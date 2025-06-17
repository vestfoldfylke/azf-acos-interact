const { logger } = require('@vtfk/logger')
const { remove } = require('@vtfk/azure-blob-client')
const { storageAccount, utenlandsreisende: { regionGroupsPrefix } } = require('../config')
const { addUserToRegionGroup, getEntraUserRegionGroups, getOverlappingTimespan, getRegionGroups, removeUserFromRegionGroup } = require('../lib/utenlandsreisende/region-groups')
const sendSms = require('../lib/send-sms')

const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

const sendSmsToUser = async (confirmation, message) => {
  if (!confirmation || !confirmation.useSms || !confirmation.phoneNumber) {
    return 'User did not want SMS or phone number is missing'
  }

  if (!confirmation.phoneNumber.startsWith('+47') && !confirmation.phoneNumber.startsWith('0047')) {
    logger('warn', ['sms', 'Phone number does not start with "+47" or "0047". Will not send SMS', confirmation.phoneNumber])
    return 'Phone number does not start with "+47" or "0047". Will not send SMS'
  }

  const phoneNumber = confirmation.phoneNumber.slice(-8)
  if (phoneNumber.length !== 8 || isNaN(phoneNumber)) {
    logger('warn', ['sms', 'Phone number is not valid. Will not send SMS', confirmation.phoneNumber])
    return 'Phone number is not valid. Will not send SMS'
  }

  const payload = {
    receivers: [`47${phoneNumber}`],
    message,
    sender: 'VFK' // max 11 tegn
  }

  return await sendSms(payload)
}

const prettifyDate = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }

  return new Date(date).toLocaleDateString('no-NO', options)
}

const toShortUtcString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogData) => {
        const countries = dialogData.DialogueInstance.Informasjon_om_?.Land.map(country => country.Hvilket_land_sk)
        if (countries.length === 0) {
          throw new Error('Missing Informasjon_om_.Land in JSON file. There is something wrong')
        }

        const countryCodes = countries.map(country => country.slice(-3).replace('(', '').replace(')', ''))
        if (countryCodes.length === 0) {
          throw new Error('No countryCodes found in Informasjon_om_.Land in JSON file. There is something wrong')
        }

        if (!dialogData.SavedValues) {
          throw new Error('Missing SavedValues in JSON file. There is something wrong')
        }

        const travelTimeframe = dialogData.DialogueInstance.Informasjon_om_?.Tidsrom
        if (!travelTimeframe) {
          throw new Error('Missing Informasjon_om_.Tidsrom in JSON file. There is something wrong')
        }

        const fromStr = travelTimeframe.Fra_og_med
        const toStr = travelTimeframe.Til_og_med
        const dateFrom = new Date(fromStr)
        let dateTo = new Date(toStr)

        if (dateFrom.toString() === 'Invalid Date' || dateTo.toString() === 'Invalid Date' || dateFrom > dateTo) {
          throw new Error('Invalid date range in travel timeframe')
        }

        // add one day to have end date inclusiveAdd
        dateTo = new Date(dateTo.getTime() + 24 * 60 * 60 * 1000)

        if (dateTo <= dateFrom) {
          throw new Error('End date must be after start date')
        }

        if (dateTo < new Date()) {
          throw new Error('End date must be in the future')
        }

        const useSms = dialogData.DialogueInstance.Informasjon_om_?.Ønsker_du_SMS_n === 'Ja'
        const phoneNumber = useSms ? dialogData.DialogueInstance.Informasjon_om_?.Telefonnummer : undefined

        const dialogUPN = dialogData.DialogueInstance.Informasjon_om_?.Privatperson?.Velg_bruker
        const integrationDataEntraUser = dialogData.SavedValues?.Integration?.Hent_brukere__ssn_?.users
        if (!dialogUPN || !integrationDataEntraUser || dialogUPN !== integrationDataEntraUser.userPrincipalName) {
          throw new Error('UserPrincipalName mismatch between dialogData and integration data')
        }

        return {
          entraUser: integrationDataEntraUser,
          travel: {
            dateFrom: toShortUtcString(dateFrom),
            dateTo: toShortUtcString(dateTo),
            countryCodes,
            countries
          },
          confirmation: {
            useSms,
            phoneNumber
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

      await remove(flowStatus.parseJson.result.jsonFile.path, blobOptions)
    }
  },
  customJobAddToRegionGroups: {
    enabled: true,
    runAfter: 'customJobPrepareAndCleanData',
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        // subtract 8 hours from the date to notify user in a reasonable time
        const dateWithMinuteOffset = new Date(new Date(flowStatus.parseJson.result.mapped.travel.dateFrom).getTime() - (8 * 60 * 60 * 1000))
        return dateWithMinuteOffset.toISOString()
      }
    },
    customJob: async (jobDef, flowStatus) => {
      const regionGroups = await getRegionGroups(flowStatus.parseJson.result.mapped.travel.countryCodes)
      const entraUserRegionGroups = await getEntraUserRegionGroups(flowStatus.parseJson.result.mapped.entraUser.userPrincipalName)

      for (const regionGroup of regionGroups) {
        if (entraUserRegionGroups.find(group => group.id === regionGroup.id)) {
          logger('info', ['region-groups', 'User is already a member of region group', regionGroup.displayName, 'GroupId:', regionGroup.id])
          continue
        }

        await addUserToRegionGroup(regionGroup.id, flowStatus.parseJson.result.mapped.entraUser.id)
      }

      return {
        regionGroups: regionGroups.map(regionGroup => regionGroup.displayName.replace(regionGroupsPrefix, ''))
      }
    }
  },
  customJobSendSmsAdd: {
    enabled: true,
    runAfter: 'customJobAddToRegionGroups',
    customJob: async (jobDef, flowStatus) => {
      const confirmation = flowStatus.parseJson.result.mapped.confirmation
      const regions = flowStatus.customJobAddToRegionGroups.result.regionGroups.join('\n- ')
      const message = `Du kan logge inn med brukeren din i følgende regioner:\n- ${regions}\ni perioden ${prettifyDate(flowStatus.parseJson.result.mapped.travel.dateFrom)} - ${prettifyDate(flowStatus.parseJson.result.mapped.travel.dateTo)}.\n\nGod reise!\n\nHilsen Digitale tjenester, Vestfold fylkeskommune`
      return await sendSmsToUser(confirmation, message)
    }
  },
  customJobRemoveFromRegionGroups: {
    enabled: true,
    runAfter: 'customJobSendSmsAdd',
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        // add 8 hours to the date to notify user in a reasonable time
        const dateWithMinuteOffset = new Date(new Date(flowStatus.parseJson.result.mapped.travel.dateTo).getTime() + (8 * 60 * 60 * 1000))
        return dateWithMinuteOffset.toISOString()
      }
    },
    customJob: async (jobDef, flowStatus) => {
      const regionGroups = await getRegionGroups(flowStatus.parseJson.result.mapped.travel.countryCodes)
      const entraUserRegionGroups = await getEntraUserRegionGroups(flowStatus.parseJson.result.mapped.entraUser.userPrincipalName)

      const regionGroupsToSkip = await getOverlappingTimespan('VFK-142', flowStatus.refId, regionGroups, flowStatus.parseJson.result.mapped.entraUser)

      const regionGroupsRemovedFrom = []
      for (const regionGroup of regionGroups) {
        if (regionGroupsToSkip.find(group => group.id === regionGroup.id)) {
          logger('info', ['region-groups', 'User has an overlapping travel in the same region. Will be removed later', regionGroup.displayName, 'GroupId:', regionGroup.id])
          continue
        }
        if (!entraUserRegionGroups.find(group => group.id === regionGroup.id)) {
          logger('info', ['region-groups', "User isn't a member of this region group", regionGroup.displayName, 'GroupId:', regionGroup.id])
          continue
        }

        await removeUserFromRegionGroup(regionGroup.id, flowStatus.parseJson.result.mapped.entraUser.id)
        regionGroupsRemovedFrom.push(regionGroup.displayName.replace(regionGroupsPrefix, ''))
      }

      return {
        regionGroups: regionGroupsRemovedFrom
      }
    }
  },
  customJobSendSmsRemove: {
    enabled: true,
    runAfter: 'customJobRemoveFromRegionGroups',
    customJob: async (jobDef, flowStatus) => {
      if (flowStatus.customJobRemoveFromRegionGroups.result.regionGroups.length === 0) {
        logger('info', ['region-groups', 'User has no region groups to remove'])
        return 'User has no region groups to remove'
      }

      const confirmation = flowStatus.parseJson.result.mapped.confirmation
      const regions = flowStatus.customJobRemoveFromRegionGroups.result.regionGroups.join('\n- ')
      const message = `Du kan ikke lenger logge inn med brukeren din fra følgende regioner:\n- ${regions}\n\nHvis du fortsatt trenger tilgang, må nytt skjema sendes via: https://dialog.vestfoldfylke.no/dialogue/VFK-142\n\nHilsen Digitale tjenester, Vestfold fylkeskommune`
      return await sendSmsToUser(confirmation, message)
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          company: 'Digitale tjenester',
          department: 'Forvaltning',
          description: 'Automatisk inn- og utmelding av utenlandsreiser',
          type: 'utenlandsreise', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          countryCodes: flowStatus.parseJson.result.mapped.travel.countryCodes.join(','),
          countries: flowStatus.parseJson.result.mapped.travel.countries.join(','),
          dateFrom: flowStatus.parseJson.result.mapped.travel.dateFrom,
          dateTo: flowStatus.parseJson.result.mapped.travel.dateTo
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
