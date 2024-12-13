const { mapFlowFile } = require('../lib/dispatcher')
const { readdirSync } = require('fs')

describe('Checking flowfile', () => {
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  test.each(schemaNames)('$filename has config and parseXml is enabled', (flow) => {
    const file = require(flow.filepath)
    expect(file.config).toBeTruthy()
    expect(file.parseXml).toBeTruthy()
    expect(file.parseXml.enabled).toBeTruthy()
  })
  describe.each(schemaNames)('$filename - customJobs are set up correctly', (flow) => {
    const file = require(flow.filepath)
    const customJobs = Object.entries(file).filter(entry => entry[0].startsWith('customJob') && entry[1].enabled)
    if (customJobs.length > 0) {
      test.each(customJobs)('%s have runAfter and runAfterJob exists and is enabled', (key, value) => {
        expect(value.runAfter).toBeTruthy()
        expect(file[value.runAfter]).toBeTruthy()
        expect(file[value.runAfter].enabled).toBeTruthy()
      })
      test.each(customJobs)('%s has a valid runAfter job', (key, value) => {
        expect(['statistics', 'finishFlow', 'failOnPurpose'].includes(value.runAfter)).toBeFalsy()
      })
    } else {
      test('No customJobs', () => {
        expect(customJobs).toHaveLength(0)
      })
    }
  })
})
