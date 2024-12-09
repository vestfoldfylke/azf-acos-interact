const description = 'Påmelding til juleavslutning for fylkestinget'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Vestfoldfylkesting/Lists/Pmelding%20til%20juleavslutning%202024/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Vestfoldfylkesting/Lists/Pmelding%20til%20juleavslutning%202024/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.navn || 'Mangler navn', // husk å bruke internal name på kolonnen
              _x00d8_nsker_x0020__x00e5__x0020: xmlData.svar,
              Kommentarer: xmlData.annet
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
          company: 'Dokumentasjon og politisk støtte',
          department: 'fylkestinget',
          description, // Required. A description of what the statistic element represents
          type: 'Påmelding til juleavslutning for fylkestinget' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
