module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (_dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {}
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Beskriv_prosessen.Prosess
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/:l:/r/sites/ORG-Organisasjonsektorteam/Lists/Forslag%20til%20forbedringsprosesser?e=Rj2Bt4",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/:l:/r/sites/ORG-Organisasjonsektorteam/Lists/Forslag%20til%20forbedringsprosesser?e=Rj2Bt4",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Navn_på_prosessen,
              Beskrivelseavprosess: jsonData.Hva_gjør_denne
            }
          }
        ]
      }
    }
  }
}
