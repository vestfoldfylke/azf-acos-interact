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
        const processList = flowStatus.parseJson.result.DialogueInstance.Beskriv_prosessen.Prosess
        if (!processList || processList.length === 0) throw new Error("Ingen prosesser i JSON filen")
        const sharepointElements = []
        for (const row of processList) {
          const sharepointProcessElement = {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Forslag%20til%20forbedringsprosesser/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Forslag%20til%20forbedringsprosesser/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: row.Navn_på_prosessen,
              Beskrivelseavprosess: row.Hva_gjør_denne,
              Kontaktperson: row.Kontaktperson,
              Tilh_x00f8_righet: row.Hvor_hører,
              Prioritering: flowStatus.parseJson.result.DialogueInstance.Beskriv_prosessen.Prioritering.Hvilken_prosess_bør,
              Innsender: `${flowStatus.parseJson.result.SavedValues.Login.FirstName ?? ""} ${flowStatus.parseJson.result.SavedValues.Login.LastName ?? ""}`
            }
          }
          sharepointElements.push(sharepointProcessElement)
        }
        return sharepointElements
      }
    }
  }
}
