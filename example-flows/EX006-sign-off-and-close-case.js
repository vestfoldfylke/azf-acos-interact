module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  archive: {
    // archive må kjøres for å kunne kjøre signOff og closeCase (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          system: "acos",
          template: "en template",
          parameter: {
            ssn: flowStatus.parseXml.result.Fnr,
            accessGroup: flowStatus.parseXml.result.Tilgangsgruppe
          }
        }
      }
    }
  },
  signOff: {
    enabled: true
  },
  closeCase: {
    // handleCase må kjøres for å kunne kjøre closeCase
    enabled: true
  }
}
