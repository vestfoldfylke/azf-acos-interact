const { logger } = require('@vtfk/logger')
const { singleGraphRequest } = require('../graph-actions')
const { accessPackage: { assignmentRequestStatuses } } = require('../../config')

const graphOptions = {
  beta: false,
  method: 'get'
}

const getAssignmentRequests = async (entraUserId) => {
  let url = `identityGovernance/entitlementManagement/assignmentRequests?$expand=accessPackage($select=id),assignment($expand=target)&$filter=assignment/target/objectId eq '${entraUserId}'`
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

const createAssignmentRequest = async (accessPackage, entraUserId, startUtc, endUtc) => {
  const body = {
    ...graphOptions,
    method: 'post',
    body: {
      requestType: 'adminAdd',
      assignment: {
        targetId: entraUserId,
        assignmentPolicyId: accessPackage.policyId,
        accessPackageId: accessPackage.id
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
  }

  const assignmentRequestAdded = await singleGraphRequest('identityGovernance/entitlementManagement/assignmentRequests', body)

  if (assignmentRequestAdded.state !== 'submitted') {
    logger('error', ['access-package', 'Invalid assignment request response from graph. AssignmentRequest:', assignmentRequestAdded])
    throw new Error('Invalid assignment request response from graph')
  }

  return assignmentRequestAdded.id
}

module.exports = { createAssignmentRequest, getAssignmentRequests }
