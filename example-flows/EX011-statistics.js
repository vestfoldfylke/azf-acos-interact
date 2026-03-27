const description = "Eksempel på statistikkjobb"
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "OF",
          department: "SKOLE",
          description,
          type: "Registrering av lærerstudenter", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Fag,
          Skole: xmlData.Skole
        }
      }
    }
  }
}
