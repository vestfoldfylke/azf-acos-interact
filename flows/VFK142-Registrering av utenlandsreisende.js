const { logger } = require("@vtfk/logger");

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true // TODO: Set to false when the flow is ready
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueInstance) => {
        return {
          entraUserObjectId: '00000000-0000-0000-0000-000000000000',
          travel: {
            dateFrom: '2025-10-01T00:00:00Z',
            dateTo: '2025-10-31T00:00:00Z',
            countryCodes: [
              'SE',
              'ES'
            ]
          },
        }
      }
    }
  },
  customJobAddAccessPackageAssignments: {
    enabled: true,
    runAfter: 'parseJson',
    customJob: async (jobDef, flowStatus) => {
      const { getAccessPackages } = require('../lib/utenlandsreisende/get-access-packages')
      const { createAssignmentRequest, getAssignmentRequests } = require('../lib/utenlandsreisende/add-user-to-access-packages')
      
      const countryCodes = flowStatus.parseJson.result.mapped.travel.countryCodes
      const accessPackages = await getAccessPackages(countryCodes)
      
      const activeAssignments = await getAssignmentRequests(flowStatus.parseJson.result.mapped.entraUserObjectId)
      
      const assignedAccessPackages = []
      for (const accessPackage of accessPackages) {
        const activeAssignment = activeAssignments.find(assignment => assignment.accessPackage.id === accessPackage.accessPackage.id)
        if (activeAssignment) {
          logger('warn', ['access-package', 'User already has an active assignment for access package', accessPackage.accessPackage.displayName, 'accessPackageId:', accessPackage.accessPackage.id])
          continue;
        }
        
        const assignmentRequestId = await createAssignmentRequest(accessPackage.accessPackage, flowStatus.parseJson.result.mapped.entraUserObjectId, flowStatus.parseJson.result.mapped.travel.dateFrom, flowStatus.parseJson.result.mapped.travel.dateTo)
        if (!assignmentRequestId) {
          logger('error', ['access-package', 'Failed to create assignment request for access package', accessPackage.accessPackage.displayName, 'accessPackageId:', accessPackage.accessPackage.id])
          throw new Error('Failed to create assignment request')
        }

        assignedAccessPackages.push({
          accessPackage: accessPackage.accessPackage,
          assignmentRequestId
        })
        logger('info', ['access-package', 'Created assignment request for access package', accessPackage.accessPackage.displayName, 'accessPackageId:', accessPackage.accessPackage.id, 'with assignmentRequestId:', assignmentRequestId])
      }
      
      return assignedAccessPackages
    }
  },
  groundControl: {
    enabled: true // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  failOnPurpose: {
    enabled: false
  }
}
