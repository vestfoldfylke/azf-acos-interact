module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueInstance) => {
        return {
          async: 'streng'
        }
      }
    }
  },
  customJobDritOgMokk: {
    enabled: true,
    runAfter: 'parseJson',
    options: {
    runAfterTimestamp: (jobDef, flowStatus) => {
      return '2025-04-03T13:06:00Z'
      }
    },
    customJob: async (jobDef, flowStatus) => {
      return 'Drit og Møkk'
    }
  },
  customJobDritOgMokk2: {
    enabled: true,
    runAfter: 'customJobDritOgMokk',
    options: {
    runAfterTimestamp: (jobDef, flowStatus) => {
      return '2025-04-03T13:09:00Z'
      }
    },
    customJob: async (jobDef, flowStatus) => {
      return 'Drit og Møkk 2'
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
