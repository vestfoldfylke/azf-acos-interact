const description = "VFK-233-Svar på høring - lokal forskrift om skole- og feriedager 2027/2028 og 2028/2029"
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

  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.Egendefinert1 === 'Privatperson'
      },
      */
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        let avsender
        if (flowStatus.parseJson.result.DialogueInstance.Bakgrunn_og.Tilhørighet.Jeg_svarer_på_vegne === "En organisasjon") {
          avsender = flowStatus.parseJson.result.DialogueInstance.Bakgrunn_og.Organisasjon1.Organisasjon.Organisasjonsnummer
        } else if (flowStatus.parseJson.result.DialogueInstance.Bakgrunn_og.Tilhørighet.Jeg_svarer_på_vegne === "En videregående skole i Vestfold") {
          avsender = flowStatus.parseJson.result.SavedValues.Dataset.Velg_skole_fra.Orgnr
        } else if (flowStatus.parseJson.result.DialogueInstance.Bakgrunn_og.Tilhørighet.Jeg_svarer_på_vegne === "Meg selv som privatperson") {
          avsender = flowStatus.parseJson.result.SavedValues.Login.UserID
        } else if (flowStatus.parseJson.result.DialogueInstance.Bakgrunn_og.Tilhørighet.Jeg_svarer_på_vegne === "En kommune i Vestfold") {
          avsender = flowStatus.parseJson.result.SavedValues.Dataset.Velg_kommune_fra.Orgnr
        } else {
          throw new Error("Ukjent avsender")
        }

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
                ReferenceNumber: avsender,
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
                Title: "Innspill",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200015" : "200018", // Seksjon Sektorstøtte, inntak og eksamen
            ResponsiblePersonEmail: nodeEnv === "production" ? "christina.hommefoss.olsen@vestfoldfylke.no" : "",
            Status: "J",
            AccessCode: "U",
            Title: "Svar på høring - lokal forskrift om skole- og feriedager 2027/2028 og 2028/2029",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/10244" : "26/00095"
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
          company: "Opplæring og tannhelse",
          department: "Seksjon Sektorstøtte, inntak og eksamen",
          description,
          type: "Svar på høring - lokal forskrift om skole- og feriedager 2027/2028 og 2028/2029", // Required. A short searchable type-name that distinguishes the statistic element
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
