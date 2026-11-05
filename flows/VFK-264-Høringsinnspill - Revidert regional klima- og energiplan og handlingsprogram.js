const description = "Høringsinnspill - Revidert regional klima- og energiplan og handlingsprogram"
const { nodeEnv } = require("../config")

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

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Om_innsender.Sender_du_innspillet === "Som privatperson"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Om_innsender.Sender_du_innspillet !== "Som privatperson"
      },
      mapper: (flowStatus) => {
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Om_innsender.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const p360Attachments = attachments.map((att) => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: "F",
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: "DocumentService",
          method: "CreateDocument",
          parameter: {
            Category: "Dokument inn",
            Contacts: [
              {
                Role: "Avsender",
                ReferenceNumber:
                  jsonData.DialogueInstance.Om_innsender.Sender_du_innspillet === "Som privatperson"
                    ? jsonData.SavedValues.Login.UserID
                    : jsonData.DialogueInstance.Om_innsender.Organisasjon.Organisasjonsnummer.replaceAll(" ", ""), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Høringssvar",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200024" : "200030", // Seksjon klima og næring - Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "morten.fredheim.solberg@vestfoldfylke.no" : "",
            Status: "J",
            AccessCode: "U",
            Title: "Høringsinnspill - Revidert regional klima- og energiplan og handlingsprogram",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/17291" : "26/00222"
          }
        }
      }
    }
  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Regional",
          department: "Seksjon klima og næring",
          description,
          type: "Høringsinnspill - Revidert regional klima- og energiplan og handlingsprogram", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || "tilArkiv er false" // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
