const description = "Samtykke til deling av elevinformasjon"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Samtykke_til_deling.Opplysninger_om
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Samtykkeskjema%20elev/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Samtykkeskjema%20elev/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Etternavn1,
              Fornavn: jsonData.Fornavn1,
              Skole: jsonData.Ny_skole,
              Samtykke_x0020_gitt: flowStatus.parseJson.result.DialogueInstance.Samtykke_til_deling.Tillatelse.Vi_trenger_ditt === "Jeg ønsker å gi samtykke til deling" ? "Ja" : "Nei"
            }
          }
        ]
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring og tannhelse",
          department: "Kompetanse og pedagogisk utvikling",
          description, // Required. A description of what the statistic element represents
          type: "Samtykke til deling av elevinformasjon" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
