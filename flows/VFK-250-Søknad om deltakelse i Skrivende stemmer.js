const description = "Søknad om deltakelse i Skrivende stemmer"
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
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
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
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad om deltakelse i Skrivende stemmer",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Søknad om deltakelse i Skrivende stemmer",
            UnofficialTitle: "Søknad om deltakelse i Skrivende stemmer",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/15269" : "26/00124",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200025" : "200031", // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "elin.feen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            AccessGroup: "Seksjon kultur",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1"
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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/VESTFOLDSCENENKjernegruppen/Lists/Skrivende%20stemmer%20%20sknader/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/VESTFOLDSCENENKjernegruppen/Lists/Skrivende%20stemmer%20%20sknader/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om.Søker.Etternavn1,
              Fornavn: jsonData.Informasjon_om.Søker.Fornavn1,
              F_x00f8_dselsdato: jsonData.Informasjon_om.Søker.Fødselsdato,
              Bostedskommune: jsonData.Informasjon_om.Søker.Bostedskommune,
              Telefonnummer: jsonData.Informasjon_om.Søker.Telefon1,
              E_x002d_post: jsonData.Informasjon_om.Søker.E_post,
              Kort_x0020_om_x0020_s_x00f8_ker: jsonData.Informasjon_om.Om_søkeren.Fortell_kort_om_deg,
              Erfaring: jsonData.Informasjon_om.Om_søkeren.Hva_er_din_erfaring,
              Hvorfor_x0020_delta: jsonData.Motivasjon_og.Motivasjon.Hvorfor_ønsker_du_å,
              Kunstnerisk_x0020_prosjekt: jsonData.Motivasjon_og.Kunstnerisk_prosjekt.Har_du_en_idé_eller,
              _x00d8_nsker_x0020__x00e5__x0020: jsonData.Motivasjon_og.Motivasjon.Hva_ønsker_du_å,
              Dokumentnr_x002e_iP360: flowStatus.archive.result.DocumentNumber,
              Acosrefid: flowStatus.parseJson.result.Metadata.ReferenceId.Value
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
          company: "Samfunnsutvikling",
          department: "Kultur",
          description, // Required. A description of what the statistic element represents
          type: "Søknad om deltakelse i Skrivende stemmer", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
