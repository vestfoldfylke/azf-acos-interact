const { logger } = require('@vtfk/logger')
const { remove } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../config')
const { addUserToRegionGroup, getEntraUserRegionGroups, getRegionGroups, removeUserFromRegionGroup } = require('../lib/utenlandsreisende/region-groups')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true // TODO: Set to false when the flow is ready
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogData) => {
        const countries = dialogData.DialogueInstance.Informasjon_om_?.Hvilke_land_ska
        if (!countries) {
          throw new Error('Missing Informasjon_om_.Hvilke_land_ska in JSON file. There is something wrong')
        }
        
        if (!dialogData.SavedValues) {
          throw new Error('Missing SavedValues in JSON file. There is something wrong')
        }
        
        const travelTimeframe = dialogData.DialogueInstance.Informasjon_om_?.Tidsrom
        if (!travelTimeframe) {
          throw new Error('Missing Informasjon_om_.Tidsrom in JSON file. There is something wrong')
        }
        
        const dateFrom = new Date(travelTimeframe.Fra)
        const dateTo = new Date(travelTimeframe.Til)
        if (dateFrom.toString() === 'Invalid Date' || dateTo.toString() === 'Invalid Date' || dateFrom > dateTo) {
          throw new Error('Invalid date range in travel timeframe')
        }
        
        const dialogUPN = dialogData.DialogueInstance.Informasjon_om_?.Privatperson?.Velg_bruker_du_
        const integrationDataEntraUser = dialogData.SavedValues?.Integration?.Hent_brukere__ssn_?.users
        if (!dialogUPN || !integrationDataEntraUser || dialogUPN !== integrationDataEntraUser.userPrincipalName) {
          throw new Error('UserPrincipalName mismatch between dialogData and integration data')
        }
        
        const countryCodes = countries.split('),')
          .map(cc => cc.slice(-3).replace('(', '').replace(')', ''))
        
        return {
          entraUser: integrationDataEntraUser,
          travel: {
            dateFrom: travelTimeframe.Fra,
            dateTo: travelTimeframe.Til,
            countryCodes,
            countries
          }
        }
      }
    }
  },
  customJobPrepareAndCleanData: {
    enabled: true,
    runAfter: 'parseJson',
    customJob: async (jobDef, flowStatus) => {
      delete flowStatus.parseJson.result.DialogueInstance
      delete flowStatus.parseJson.result.SavedValues
      
      await remove(flowStatus.parseJson.result.jsonFile.path, {
        connectionString: storageAccount.connectionString,
        containerName: storageAccount.containerName
      })
    }
  },
  customJobAddToRegionGroups: {
    enabled: true,
    runAfter: 'customJobPrepareAndCleanData',
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        return flowStatus.parseJson.result.mapped.travel.dateFrom
      }
    },
    customJob: async (jobDef, flowStatus) => {
      const regionGroups = await getRegionGroups(flowStatus.parseJson.result.mapped.travel.countryCodes)
      const entraUserRegionGroups = await getEntraUserRegionGroups(flowStatus.parseJson.result.mapped.entraUser.userPrincipalName)
      
      for (const regionGroup of regionGroups) {
        if (entraUserRegionGroups.find(group => group.id === regionGroup.id)) {
          logger('warn', ['region-groups', 'User is already a member of region group', regionGroup.displayName, 'GroupId:', regionGroup.id])
          continue
        }
        
        await addUserToRegionGroup(regionGroup.id, flowStatus.parseJson.result.mapped.entraUser.id)
      }
      
      return {
        regionGroups
      }
    }
  },
  customJobRemoveFromRegionGroups: {
    enabled: true,
    runAfter: 'customJobAddToRegionGroups',
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        return flowStatus.parseJson.result.mapped.travel.dateTo
      }
    },
    customJob: async (jobDef, flowStatus) => {
      const regionGroups = await getRegionGroups(flowStatus.parseJson.result.mapped.travel.countryCodes)
      const entraUserRegionGroups = await getEntraUserRegionGroups(flowStatus.parseJson.result.mapped.entraUser.userPrincipalName)

      for (const regionGroup of regionGroups) {
        if (!entraUserRegionGroups.find(group => group.id === regionGroup.id)) {
          logger('warn', ['region-groups', "User isn't a member of this region group", regionGroup.displayName, 'GroupId:', regionGroup.id])
          continue
        }

        await removeUserFromRegionGroup(regionGroup.id, flowStatus.parseJson.result.mapped.entraUser.id)
      }
      
      return {
        regionGroups
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
