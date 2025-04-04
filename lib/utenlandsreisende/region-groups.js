const { logger } = require('@vtfk/logger')
const { singleGraphRequest } = require('../graph-actions')

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
    throw new Error(`Failed to add userId ${entraUserId} as a member to region groupId: ${regionGroupId}. Error: ${error.response?.data || error.message}`)
  }
}

const removeUserFromRegionGroup = async (regionGroupId, entraUserId) => {
  try {
    await singleGraphRequest(`groups/${regionGroupId}/members/${entraUserId}/$ref`, {
      ...graphOptions,
      method: 'delete'
    })
    logger('info', ['add-to-region-group', 'Removed user from region group. GroupId:', regionGroupId, 'UserId:', entraUserId])
  } catch (error) {
    throw new Error(`Failed to remove userId ${entraUserId} from region groupId: ${regionGroupId}. Error: ${error.response?.data || error.message}`)
  }
}

const getEntraUserRegionGroups = async (userPrincipalName) => {
  const { value } = await singleGraphRequest(`users/${userPrincipalName}/transitiveMemberOf?$count=true&$filter=startsWith(displayName, '${regionGroupsPrefix}')&$select=id,displayName`, {
    ...graphOptions,
    advanced: true
  })

  if (!Array.isArray(value)) {
    logger('error', ['region-groups', 'Invalid user region groups response from graph. Value:', value])
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
      countryCodes: countryCodesInDescription,
      members: regionGroup.members
    })
  })

  return countryCodes.map(countryCode => {
    const correspondingRegionGroups = validRegionGroups.filter(regionGroup => regionGroup.countryCodes.includes(countryCode))
    if (correspondingRegionGroups.length === 0) {
      throw new Error(`No region group found for country code: ${countryCode}`)
    }

    if (correspondingRegionGroups.length > 1) {
      throw new Error(`Multiple region groups found for country code: ${countryCode}. GroupIds: ${correspondingRegionGroups.map(regionGroup => regionGroup.id).join(',')}`)
    }

    return {
      ...correspondingRegionGroups[0],
      countryCode
    }
  })
}

module.exports = { addUserToRegionGroup, getEntraUserRegionGroups, getRegionGroups, removeUserFromRegionGroup }
