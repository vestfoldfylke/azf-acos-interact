const description = "Høring - navneforslag på ny videregående skole i Holmestrand kommune"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Gi_din_stemme
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/NavneprosessnyVGS/Lists/Hringsinnspill/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/NavneprosessnyVGS/Lists/Hringsinnspill/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: `${jsonData.Innsender.Fornavn1} ${jsonData.Innsender.Etternavn1}` || "Mangler navn", // husk å bruke internal name på kolonnen
              Navnforslag: jsonData.Les_kriteriene_
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
          company: "Opplæring",
          department: "Seksjon Sektorstøtte, inntak og eksamen",
          description, // Required. A description of what the statistic element represents
          type: "Høring - navneforslag på ny videregående skole i Holmestrand kommune" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
