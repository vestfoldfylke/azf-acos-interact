const description = 'Påmelding til juleavslutning for fylkestinget'
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Påmelding_til_j.Påmelding
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Vestfoldfylkesting/Lists/Pmelding%20til%20juleavslutning%202024/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Vestfoldfylkesting/Lists/Pmelding%20til%20juleavslutning%202024/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Navn || 'Mangler navn', // husk å bruke internal name på kolonnen
              _x00d8_nsker_x0020__x00e5__x0020: jsonData.Jeg_ønsker_å_de,
              Kommentarer: jsonData.Allergier_og_li
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
