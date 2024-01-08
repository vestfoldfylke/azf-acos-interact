module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { 
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr,
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  }
}