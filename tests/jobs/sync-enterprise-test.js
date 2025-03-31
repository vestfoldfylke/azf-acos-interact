(async () => {
  // First set local env
  const setEnv = require('./set-env-variables')
  setEnv()

  const { writeFileSync } = require('fs')
  const path = require('path')
  const jobToTest = require('../../lib/jobs/sync-enterprise') // Require the job you want to test

  const mockJobDef = { // Equivalent to the jobdef in the flowfile (e.g. if you're testing syncEnterprise, this is the property syncEnterprise in the flowfile)
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgnr // Simply mocking xml avleveringsfil from Acos
        }
      }
    }
  }
  const mockFlowStatus = {
    parseXml: { // Simply mocking that parseXml is finished and have data
      result: {
        ArchiveData: {
          orgnr: '918866485' // Remember not to put personal data in mock files - these files are synced to git
        }
      }
    }
  }
  try {
    const result = await jobToTest(mockJobDef, mockFlowStatus)
    writeFileSync(path.join(__dirname, `/mock-results/${__filename.slice(__dirname.length + 1, -3)}.json`), JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error when testing job', error.response?.data || error.stack || error.toString())
  }
})()
