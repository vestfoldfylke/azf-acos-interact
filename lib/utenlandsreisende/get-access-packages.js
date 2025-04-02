const { logger } = require("@vtfk/logger");
const { singleGraphRequest } = require("../graph-actions");

const graphOptions = {
  beta: false,
  method: 'get'
}

const getAccessPackages = async (countryCodes) => {
  const { value } = await singleGraphRequest("identityGovernance/entitlementManagement/accessPackages?$expand=assignmentPolicies&$filter=catalog/displayName eq 'Conditional Access Catalog - Utenlandsreisende'&$select=id,displayName,description", graphOptions)
  
  // remove duplicates and trim whitespace
  countryCodes = [
    ...(new Set(countryCodes.map(code => code.trim().toUpperCase())))
  ]
  
  if (!Array.isArray(value)) {
    logger('error', ['access-package', 'Invalid access package response from graph. Value:', value])
    throw new Error('Invalid response from graph')
  }

  const validAccessPackages = []
  const accessPackages = value.forEach((accessPackage) => {
    if (!Array.isArray(accessPackage.assignmentPolicies)) {
      return
    }

    const assignmentPolicy = accessPackage.assignmentPolicies.find((assignmentPolicy) => assignmentPolicy.displayName === 'Initial Policy')
    if (!assignmentPolicy) {
      logger('warn', ['access-package', 'No assignment policy found for access package', accessPackage.displayName, 'AccessPackageId', accessPackage.id])
      return
    }

    const countryCodesInDescription = accessPackage.description.split(',').map(code => code.trim().toUpperCase())
    const invalidCountryCodeFormat = countryCodesInDescription.filter((code) => code.length !== 2)
    if (invalidCountryCodeFormat.length > 0) {
      logger('warn', ['access-package', 'Invalid access package description. AccessPackageId:', accessPackage.id, 'Description:', accessPackage.description, 'Invalid country codes:', invalidCountryCodeFormat])
      return
    }

    validAccessPackages.push({
      accessPackage: {
        id: accessPackage.id,
        displayName: accessPackage.displayName,
        policyId: assignmentPolicy.id
      },
      countryCodes: countryCodesInDescription,
    })
  })

  return countryCodes.map(countryCode => {
    const correspondingAccessPackages = validAccessPackages.filter(accessPackage => accessPackage.countryCodes.includes(countryCode))
    if (correspondingAccessPackages.length === 0) {
      throw new Error(`No access package found for country code: ${countryCode}`)
    }

    if (correspondingAccessPackages.length > 1) {
      throw new Error(`Multiple access packages found for country code: ${countryCode}. AccessPackageIds: ${correspondingAccessPackages.map(accessPackage => accessPackage.id).join(',')}`)
    }

    return {
      ...correspondingAccessPackages[0],
      countryCode
    }
  })
}

module.exports = { getAccessPackages }