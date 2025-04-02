const { logger } = require('@vtfk/logger')
const { accessPackage: { assignmentPolicyId, assignmentRequestStatuses }, graph: { ssnExtensionAttribute } } = require('../../config')
const { singleGraphRequest } = require('../graph-actions')

const graphOptions = {
  beta: false,
  method: 'get'
}

const isValidGuid = (guid) => guid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)

const getEntraUserId = async (ssn, type) => {
  const url = type === 'student'
    ? `users?$count=true&$select=id,userPrincipalName,customSecurityAttributes&$filter=customSecurityAttributes/IDM/SSN eq '${ssn}'`
    : `users?$filter=(${ssnExtensionAttribute}+eq+'${ssn}')&$select=id,userPrincipalName`

  const { value } = await singleGraphRequest(url, graphOptions)
  if (!Array.isArray(value) || value.length !== 1) {
    logger('error', ['access-package', `Invalid ${type} response from graph with url: '${url}'. Value:`, value])
    throw new Error('Invalid response from graph')
  }

  const userId = value[0].id
  if (!userId || !isValidGuid(userId)) {
    logger('error', ['access-package', `Invalid user id from graph with url: '${url}'. UserId:`, userId])
    throw new Error('Invalid user id from graph')
  }

  return userId
}

const getAccessPackages = async (countryCodes) => {
  const { value } = await singleGraphRequest("identityGovernance/entitlementManagement/accessPackages?$expand=assignmentPolicies&$filter=catalog/displayName eq 'Conditional Access Catalog - Utenlandsreisende'&$select=id,displayName,description", graphOptions)
  
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
      id: accessPackage.id,
      countryCodes: countryCodesInDescription,
      displayName: accessPackage.displayName,
      policyId: assignmentPolicy.id
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

const getAssignmentRequests = async (accessPackageId, entraUserId) => {
  let url = `identityGovernance/entitlementManagement/assignmentRequests?$expand=accessPackage($select=id),assignment($expand=target)&$filter=accessPackage/id eq '${accessPackageId}' and assignment/target/objectId eq '${entraUserId}'`
  if (assignmentRequestStatuses.length > 0) {
    url += ` and (state eq '${assignmentRequestStatuses.join('\' or state eq \'')}')`
  }

  const { value } = await singleGraphRequest(url, graphOptions)
  if (!Array.isArray(value)) {
    logger('error', ['access-package', `Invalid access package response from graph with url: '${url}'. Value:`, value])
    throw new Error('Invalid response from graph')
  }

  return value
}

const createAssignmentRequest = async (accessPackageId, entraUserId, startUtc, endUtc) => {
  const assignmentRequestAdded = await singleGraphRequest('identityGovernance/entitlementManagement/assignmentRequests', {
    ...graphOptions,
    method: 'post',
    body: {
      requestType: 'adminAdd',
      assignment: {
        targetId: entraUserId,
        assignmentPolicyId,
        accessPackageId
      },
      schedule: {
        startDateTime: startUtc,
        recurrence: null,
        expiration: {
          endDateTime: endUtc,
          duration: null,
          type: 'afterDateTime'
        }
      }
    }
  })

  if (!['submitted', 'Accepted'].includes(assignmentRequestAdded.state)) {
    logger('error', ['access-package', 'Invalid assignment request response from graph. AssignmentRequest:', assignmentRequestAdded])
    throw new Error('Invalid assignment request response from graph')
  }

  return assignmentRequestAdded.id
}

module.exports = async (jobDef, flowStatus) => {
  logger('info', ['access-package', 'starting job'])

  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger('error', ['access-package', 'No mapper defined in options'])
    throw new Error('No mapper defined in options for access-package. Please provide a custom mapper in flow definition')
  }

  logger('info', ['access-package', 'Mapper is defined in options. Will use it.'])
  const { accessPackageId, ssn, start, end, type } = mapper(flowStatus)

  if (!accessPackageId || !isValidGuid(accessPackageId)) {
    logger('error', ['access-package', 'No accessPackageId or invalid accessPackageId defined in options. AccessPackageId:', accessPackageId])
    throw new Error('No accessPackageId or invalid accessPackageId defined in options for access-package. Please provide a custom accessPackageId in flow definition')
  }

  if (!ssn || !ssn.match(/^\d{11}$/)) {
    logger('error', ['access-package', 'No ssn or invalid ssn defined in options. SSN:', ssn])
    throw new Error('No ssn or invalid ssn defined in options for access-package. Please provide a custom ssn in flow definition')
  }

  if (!start || !end) {
    logger('error', ['access-package', 'No start or end date defined in options. Start:', start, 'End:', end])
    throw new Error('No start or end date defined in options for access-package. Please provide a custom start and end date in flow definition')
  }

  if (!type || !['student', 'employee'].includes(type)) {
    logger('error', ['access-package', 'No type or invalid type defined in options. Type:', type])
    throw new Error('No type or invalid type defined in options for access-package. Please provide a custom type in flow definition')
  }

  // get entra user id from graph by ssn
  const entraUserId = await getEntraUserId(ssn, type)
  logger('info', ['access-package', 'Got entra user id:', entraUserId])

  const assignmentRequests = await getAssignmentRequests(accessPackageId, entraUserId)
  if (assignmentRequests.length > 0) {
    logger('info', ['access-package', 'User has already a scheduled or ongoing assignment request:', assignmentRequests])

    // TODO: update assignment request if possible

    return assignmentRequests
  }

  // TODO: create assignment request
  const createdAssignmentRequestId = await createAssignmentRequest(accessPackageId, entraUserId, start, end)
  logger('info', ['access-package', 'Created assignment request with id:', createdAssignmentRequestId])

  return createdAssignmentRequestId

  // get all assignments for a specific accessPackage and userId
  // https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/assignments?$filter=accessPackage/id eq 'e53ebeb5-de3f-4240-be9c-ef63c3237527' and target/objectId eq '33a0333e-6f4b-4181-8f2a-6c3466205431' and (state eq 'delivering' or state eq 'partiallyDelivered' or state eq 'delivered')
  // https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/assignments?$filter=accessPackage/id eq '09bf7170-cac7-48de-95c7-0d01e32de280' and target/objectId eq '33a0333e-6f4b-4181-8f2a-6c3466205431' and (state eq 'delivering' or state eq 'partiallyDelivered' or state eq 'delivered')
}
