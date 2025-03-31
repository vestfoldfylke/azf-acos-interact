(async () => {
  // First set local env
  const setEnv = require('./set-env-variables')
  setEnv()

  const { writeFileSync, existsSync, mkdirSync } = require('fs')
  const path = require('path')
  const jobToTest = require('../../lib/jobs/sync-employee') // Require the job you want to test

  const mockJobDef = { // Equivalent to the jobdef in the flowfile (e.g. if you're testing syncEnterprise, this is the property syncEnterprise in the flowfile)
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr // Simply mocking xml avleveringsfil from Acos
        }
      }
    }
  }
  const mockFlowStatus = {
    parseXml: { // Simply mocking that parseXml is finished and have data
      result: {
        ArchiveData: {
          Fnr: '12345678910' // Remember not to put personal data in mock files - these files are synced to git
        }
      }
    }
  }
  try {
    const result = await jobToTest(mockJobDef, mockFlowStatus)
    if (!existsSync(path.join(__dirname, '/mock-results'))) mkdirSync(path.join(__dirname, '/mock-results'))
    writeFileSync(path.join(__dirname, `/mock-results/${__filename.slice(__dirname.length + 1, -3)}.json`), JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error when testing job', error.response?.data || error.stack || error.toString())
  }
})()
