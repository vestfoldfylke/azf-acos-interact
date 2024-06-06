const description = 'Påmelding til sommerfest'
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Sosialkomiteen/Lists/Sensommerfest%20%20pmeldte/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Sosialkomiteen/Lists/Sensommerfest%20%20pmeldte/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Navn || 'Mangler navn', // husk å bruke internal name på kolonnen
              Virksomhet: xmlData.Virksomhet,
              Enhet: xmlData.Enhet,
              Ansattnummer: xmlData.Ansattnummer,
              E_x002d_post: xmlData.Epost,
              Anneninfo: xmlData.Allergier
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Organisasjon',
          department: 'Seksjon dokumentasjon og politisk støtte',
          description, // Required. A description of what the statistic element represents
          type: 'Sommerfest 2024' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
