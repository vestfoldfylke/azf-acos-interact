module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr
        }
      }
    }
  }
}
