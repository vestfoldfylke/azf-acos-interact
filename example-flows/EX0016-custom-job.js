module.exports = {
  config: {
    enabled: true
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueInstance) => {
        return {
          fornavn: dialogueInstance.innlogging.fornavn
        }
      }
    }
  },
  customJobLagEtternavn: {
    enabled: true,
    runAfter: 'parseJson', // Required
    customJob: async (jobDef, flowStatus) => { // Required and must be named customJob, be async function, and have parameters jobDef and flowStatus
      // Her gjør du egt hva du vil altså
      return `${flowStatus.parseJson.result.fornavn}sen`
    }
  },
  customJobGjorEtternavnUpperCase: {
    enabled: true,
    runAfter: 'customJobLagEtternavn', // Required
    customJob: async (jobDef, flowStatus) => { // Required and must be named customJob, be async function, and have parameters jobDef and flowStatus
      // Her gjør du egt hva du vil altså
      return `${flowStatus.customJobLagEtternavn.result.toUpperCase()}`
    }
  }
}
