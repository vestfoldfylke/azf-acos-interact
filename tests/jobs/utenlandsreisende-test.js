(async () => {
  // First set local env
  const setEnv = require('./set-env-variables')
  setEnv()

  const { writeFileSync, existsSync, mkdirSync } = require('fs')
  const path = require('path')
  const utenlandsFlowFil = require('../../flows/VFK142-Registrering av utenlandsreisende')
  const jobToTest = utenlandsFlowFil.customJobAddAccessPackageAssignments.customJob

  const mockJobDef = 'tut tut'
  
  const mockFlowStatus = {
    parseJson: { // Simply mocking that parseJson is finished and have data
      result: {
        mapped: {
          entraUserObjectId: '00000000-0000-0000-0000-000000000000',
          travel: {
            dateFrom: '2025-04-02T10:50:00Z',
            dateTo: '2025-04-02T13:05:00Z',
            countryCodes: ['PG']
          }
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
