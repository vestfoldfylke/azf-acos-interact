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
  syncEmployee: {
    enabled: true,
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        return '2025-04-03T13:06:00Z' // Må returne en UTC-timestring - denne jobben vil ikke kjøre før dette tidspunktet er passert
      },
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr,
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },
  customJobVentMedDette: {
    enabled: true,
    runAfter: 'syncEmployee',
    options: {
      runAfterTimestamp: (jobDef, flowStatus) => {
        return '2025-10-15T13:34:00Z' // Må returne en UTC-timestring - denne jobben vil ikke kjøre før dette tidspunktet er passert.
      }
    },
    customJob: async (jobDef, flowStatus) => {
      return `${flowStatus.syncEmployee.result.privatePerson.navn} var en ansatt før i tida hvertfall, sikkert fortsatt og`
    }
  }
}
