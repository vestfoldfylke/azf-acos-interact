const description = "Melding om skade på eiendom"
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
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_
        const kommune = jsonData.Om_skaden.I_hvilken_kommu
        let prosjektProd = ""
        let prosjektTest = ""
        if (kommune === "Tønsberg") {
          prosjektProd = "24-133"
          prosjektTest = "26-5"
        } else if (kommune === "Sandefjord") {
          prosjektProd = "26-11"
          prosjektTest = "26-5"
        } else if (kommune === "Færder") {
          prosjektProd = "26-7"
          prosjektTest = "26-5"
        } else if (kommune === "Holmestrand") {
          prosjektProd = "26-8"
          prosjektTest = "26-5"
        } else if (kommune === "Horten") {
          prosjektProd = "26-9"
          prosjektTest = "26-5"
        } else if (kommune === "Larvik") {
          prosjektProd = "26-10"
          prosjektTest = "26-4"
        } else {
          throw new Error("Ukjent kommune")
        }
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Title: `Melding om skade på eiendom - ${jsonData.Om_skaden.Hvilken_type_sk} - ${jsonData.Om_skaden.Ved_hvilken_adr} - ${jsonData.Om_skaden.I_hvilken_kommu} kommune`,
            // UnofficialTitle: ,
            Status: "B",
            AccessCode: "U",
            // Paragraph: '',
            JournalUnit: "Sentralarkiv",
            Project: nodeEnv === "production" ? prosjektProd : prosjektTest,
            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "Q13",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200095" : "200152" // Team driftskontrakt vei
          }
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_
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
            AccessCode: "U",
            AccessGroup: "Alle",
            Category: "Dokument inn",
            Contacts: [
              {
                Role: "Avsender",
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID, // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: "Melding om skade på eiendom",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200095" : "200152", // Team driftskontrakt vei
            Status: "J",
            Title: `Melding om skade på eiendom - ${jsonData.Om_skaden.Hvilken_type_sk} - ${jsonData.Om_skaden.Ved_hvilken_adr} - ${jsonData.Om_skaden.I_hvilken_kommu} kommune`,
            Archive: "Saksdokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-DRI-Skaderoghenvendelser/Lists/Melding%20om%20skade%20p%20eiendom/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-DRI-Skaderoghenvendelser/Lists/Melding%20om%20skade%20p%20eiendom/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.handleCase.result.CaseNumber,
              Meldt_x0020_inn_x0020_av: `${jsonData.Informasjon_om_.Kontaktinformas.Fornavn1} ${jsonData.Informasjon_om_.Kontaktinformas.Etternavn1}`,
              E_x002d_post: jsonData.Informasjon_om_.Kontaktinformas.E_post,
              Telefon: jsonData.Informasjon_om_.Kontaktinformas.Mobil,
              Kommune: jsonData.Informasjon_om_.Om_skaden.I_hvilken_kommu,
              Type_x0020_skade: jsonData.Informasjon_om_.Om_skaden.Hvilken_type_sk,
              Forsikringsselskap: jsonData.Informasjon_om_.Om_skaden.Forsikringssels,
              Skadenummer: jsonData.Informasjon_om_.Om_skaden.Fyll_inn_skaden,
              Beskrivelse: jsonData.Informasjon_om_.Om_skaden.Beskriv_skaden_,
              Tidspunkt: jsonData.Informasjon_om_.Om_skaden.Tidspunkt_for_s,
              Acos_x0020_refid: flowStatus.parseJson.result.Metadata.ReferenceId.Value
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
          company: "Samferdsel",
          department: "Team driftskontrakt vei",
          description, // Required. A description of what the statistic element represents
          type: "Skade på eiendom", // Required. A short searchable type-name that distinguishes the statistic element
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
