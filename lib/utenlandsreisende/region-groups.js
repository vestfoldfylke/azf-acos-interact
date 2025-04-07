const { logger } = require('@vtfk/logger')
const { get } = require("@vtfk/azure-blob-client");
const { storageAccount } = require('../../config')
const { singleGraphRequest } = require('../graph-actions')

const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

const graphOptions = {
  beta: false,
  method: 'get'
}

const regionGroupsPrefix = 'A-CA-REGION'

const addUserToRegionGroup = async (regionGroupId, entraUserId) => {
  try {
    await singleGraphRequest(`groups/${regionGroupId}/members/$ref`, {
      ...graphOptions,
      method: 'post',
      body: {
        '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${entraUserId}`
      }
    })
    logger('info', ['add-to-region-group', 'Added user as a member to region group. GroupId:', regionGroupId, 'UserId:', entraUserId])
  } catch (error) {
    const errorCode = error.response
      ? JSON.stringify(error.response.data)
      : error.message
    throw new Error(`Failed to add userId ${entraUserId} as a member to region groupId: ${regionGroupId}. Error: ${errorCode}`)
  }
}

const removeUserFromRegionGroup = async (regionGroupId, entraUserId) => {
  try {
    await singleGraphRequest(`groups/${regionGroupId}/members/${entraUserId}/$ref`, {
      ...graphOptions,
      method: 'delete'
    })
    logger('info', ['remove-from-region-group', 'Removed user from region group. GroupId:', regionGroupId, 'UserId:', entraUserId])
  } catch (error) {
    const errorCode = error.response
      ? JSON.stringify(error.response.data)
      : error.message
    throw new Error(`Failed to remove userId ${entraUserId} from region groupId: ${regionGroupId}. Error: ${errorCode}`)
  }
}

const getEntraUserRegionGroups = async (userPrincipalName) => {
  const { value } = await singleGraphRequest(`users/${userPrincipalName}/transitiveMemberOf?$count=true&$filter=startsWith(displayName, '${regionGroupsPrefix}')&$select=id,displayName`, {
    ...graphOptions,
    advanced: true
  })

  if (!Array.isArray(value)) {
    logger('error', ['get-entra-user-region-groups', 'Invalid user region groups response from graph. Value:', value])
    throw new Error('Invalid response from graph')
  }

  return value.map(regionGroup => ({
    id: regionGroup.id,
    displayName: regionGroup.displayName
  }))
}

const getRegionGroups = async (countryCodes) => {
  const { value } = await singleGraphRequest(`groups?$filter=startsWith(displayName, '${regionGroupsPrefix}')&$select=id,displayName,description`, graphOptions)

  // remove duplicates and trim whitespace
  countryCodes = [
    ...(new Set(countryCodes.map(code => code.trim().toUpperCase())))
  ]

  if (!Array.isArray(value)) {
    logger('error', ['region-groups', 'Invalid region groups response from graph. Value:', value])
    throw new Error('Invalid response from graph')
  }

  const validRegionGroups = []
  value.forEach((regionGroup) => {
    const countryCodesInDescription = regionGroup.description.split(',').map(code => code.trim().toUpperCase())
    const invalidCountryCodeFormat = countryCodesInDescription.filter((code) => code.length !== 2)
    if (invalidCountryCodeFormat.length > 0) {
      logger('warn', ['region-groups', 'Invalid region group description. GroupId:', regionGroup.id, 'Description:', regionGroup.description, 'Invalid country codes:', invalidCountryCodeFormat])
      return
    }

    validRegionGroups.push({
      id: regionGroup.id,
      displayName: regionGroup.displayName,
      countryCodes: countryCodesInDescription
    })
  })
  
  

  const actuallyValidRegionGroups = []
  countryCodes.forEach(countryCode => {
    const correspondingRegionGroups = validRegionGroups.filter(regionGroup => regionGroup.countryCodes.includes(countryCode))
    if (correspondingRegionGroups.length === 0) {
      throw new Error(`No region group found for country code: ${countryCode}`)
    }

    if (correspondingRegionGroups.length > 1) {
      throw new Error(`Multiple region groups found for country code: ${countryCode}. GroupIds: ${correspondingRegionGroups.map(regionGroup => regionGroup.id).join(',')}`)
    }
    
    if (actuallyValidRegionGroups.find(group => group.id === correspondingRegionGroups[0].id)) {
      return
    }

    actuallyValidRegionGroups.push({
      ...correspondingRegionGroups[0],
      countryCode
    })
  })
  
  return actuallyValidRegionGroups
}

const getOverlappingRegionGroups = (flowStatus, regionGroups, entraUser, currentDateTime) => {
  if (flowStatus.entraUser.id !== entraUser.id) {
    return []
  }

  const dateFrom = new Date(flowStatus.travel.dateFrom)
  const dateTo = new Date(flowStatus.travel.dateTo)
  if (dateFrom > currentDateTime || dateTo < currentDateTime) {
    return []
  }

  return regionGroups.filter(regionGroup => regionGroup.countryCodes.some(countryCode => flowStatus.travel.countryCodes.includes(countryCode)))
}

const getOverlappingTimespan = async (schemaId, currentRefId, regionGroups, entraUser) => {
  const blobs = await get(`${schemaId}/`, blobOptions)
  const flowStatuses = blobs.filter(blob => blob.name.endsWith('flow-status.json') && !blob.name.startsWith(currentRefId))

  const now = new Date()
  const overlappingRegionGroups = []

  for (const flowStatus of flowStatuses) {
    const { data } = await get(flowStatus.path, blobOptions)
    const flowStatusParsed = JSON.parse(data)

    overlappingRegionGroups.push(...getOverlappingRegionGroups(flowStatusParsed.parseJson.result.mapped, regionGroups, entraUser, now))
  }

  return overlappingRegionGroups
}

module.exports = { addUserToRegionGroup, getEntraUserRegionGroups, getOverlappingTimespan, getRegionGroups, removeUserFromRegionGroup }
