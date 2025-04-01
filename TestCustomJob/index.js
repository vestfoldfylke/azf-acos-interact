const { logger } = require('@vtfk/logger')
const upsertAccessPackage = require('../lib/jobs/access-package')

module.exports = async function (context, req) {
  logger('info', ['testCustomJob', 'starting job'])

  const jobDef = {
    options: {
      mapper: (flowStatus) => {
        return {
          accessPackageId: flowStatus.refAccessPackageId,
          ssn: flowStatus.refId,
          start: flowStatus.refStart,
          end: flowStatus.refEnd,
          type: flowStatus.refType
        }
      }
    }
  }

  // const africa = '09bf7170-cac7-48de-95c7-0d01e32de280'
  const viTester = 'e53ebeb5-de3f-4240-be9c-ef63c3237527'

  const dtStart = new Date()
  const dtEnd = new Date(dtStart.getTime() + 3600000)

  const flowStatus = {
    refAccessPackageId: viTester,
    refId: '08058532739',
    refStart: dtStart.toISOString(),
    refEnd: dtEnd.toISOString(),
    refType: 'employee'
  }

  try {
    await upsertAccessPackage(jobDef, flowStatus)
    logger('info', ['testCustomJob', 'Successfully executed job'])

    return {
      status: 200,
      body: 'OK'
    }
  } catch (error) {
    logger('error', ['testCustomJob', 'Error in job', error])

    return {
      status: 500,
      body: error.toString()
    }
  }
}
