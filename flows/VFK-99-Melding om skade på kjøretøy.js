const description = "Melding om skade på kjøretøy Skal opprettes en ny sak pr skjema"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Melde_skade_på_
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Title: `Melding om skade på kjøretøy - ${jsonData.Informasjon_om_skaden.Pa_hvilken_fylkesvei_skj}`,
            // UnofficialTitle: ,
            Status: "B",
            AccessCode: "U",
            // Paragraph: '',
            JournalUnit: "Sentralarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "271",
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
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200094" : "200150" // Team infrastruktur
          }
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Melde_skade_på_
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
            AccessCode: "26",
            Paragraph: "Offl. § 26 femte ledd",
            AccessGroup: "Team Infrastruktur",
            Category: "Dokument inn",
            Contacts: [
              {
                Role: "Avsender",
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID, // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Melding om skade på kjøretøy",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200094" : "200150", // Team infrastruktur
            Status: "J",
            Title: `Melding om skade på kjøretøy - ${jsonData.Informasjon_om_skaden.Pa_hvilken_fylkesvei_skj}`,
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-DRI-Skaderoghenvendelser/Lists/Melding%20om%20skade%20p%20kjrety/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-DRI-Skaderoghenvendelser/Lists/Melding%20om%20skade%20p%20kjrety/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.handleCase.result.CaseNumber,
              Meldt_x0020_inn_x0020_av: `${jsonData.Melde_skade_på_.Innsender.Person.Fornavn} ${jsonData.Melde_skade_på_.Innsender.Person.Etternavn}`,
              E_x002d_post: jsonData.Melde_skade_på_.Innsender.Person.E_postadresse,
              Telefon: jsonData.Melde_skade_på_.Innsender.Person.Telefon,
              Forsikringsselskap: jsonData.Melde_skade_på_.Informasjon_om_skaden.Navn_pa_forsikringsselsk,
              Skadenummer: jsonData.Melde_skade_på_.Informasjon_om_skaden.Skadenummer_fra_forsikri,
              Skadetidspunkt: jsonData.Melde_skade_på_.Informasjon_om_skaden.Nar_skjedde_skaden_,
              Fylkesvei: jsonData.Melde_skade_på_.Informasjon_om_skaden.Pa_hvilken_fylkesvei_skj,
              Kort_x0020_beskrivelse: jsonData.Melde_skade_på_.Informasjon_om_skaden.Kort_beskrivelse_av_skad,
              Meldt_x0020_veitrafikksentralen: jsonData.Melde_skade_på_.Informasjon_om_skaden.Har_du_meldt_fra_om_skad,
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
          department: "Team infrastruktur",
          description, // Required. A description of what the statistic element represents
          type: "Skade på kjøretøy", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          road: flowStatus.parseJson.result.DialogueInstance.Melde_skade_på_.Informasjon_om_skaden.Pa_hvilken_fylkesvei_skj
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
