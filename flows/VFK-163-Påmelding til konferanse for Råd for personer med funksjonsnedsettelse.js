const description = 'Påmelding til konferanse for råd for personer med funksjonsnedsettelse' // Marit Karlsen er eier
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Rdforpersonermedfunksjonsnedsettelse/Lists/Pmelding%20til%20felles%20samling%20for%20de%20kommunale%20rdene/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Rdforpersonermedfunksjonsnedsettelse/Lists/Pmelding%20til%20felles%20samling%20for%20de%20kommunale%20rdene/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Påmelding.Navn || 'Mangler navn', // husk å bruke internal name på kolonnen
              Deltar: jsonData.Påmelding.Jeg_ønsker_å_de,
              Kommune: jsonData.Påmelding.Kommune___fylke,
              Hensyn: jsonData.Påmelding.Eventuelle_alle
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
          type: 'Påmelding til konferanse for råd for personer med funksjonsnedsettelse' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
