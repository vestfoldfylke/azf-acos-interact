const description = "Arkivering av henvendelse til mobbeombud. Skal opprettes en ny sak pr skjema"
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
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  syncPrivatePersonElev: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.DialogueInstance.Utfylling.Informasjon_om_barnet.Fodselsnummer2
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Ombud",
            Title: "Elevsak",
            UnofficialTitle: `Elevsak - ${jsonData.Utfylling.Informasjon_om_barnet.Skole_barnehage} - ${jsonData.Utfylling.Informasjon_om_barnet.Navn}`,
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Mobbeombud",

            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "B36",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              },
              {
                ArchiveCode: "--",
                ArchiveType: "TILLEGGSKODE PRINSIPP",
                Sort: 3,
                IsManualText: true
              },
              {
                ArchiveCode: flowStatus.syncPrivatePersonElev.result.privatePerson.ssn,
                ArchiveType: "FNR",
                IsManualText: true,
                Sort: 4
              }
            ],

            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: jsonData.Utfylling.Informasjon_om_barnet.Fodselsnummer2,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200421" : "200065"
          }
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
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
            AccessCode: "13",
            AccessGroup: "Mobbeombud",
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                Role: "Avsender",
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
                Title: "Henvendelse til mobbeombud",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200421" : "200065",
            Status: "J",
            Title: "Henvendelse til mobbeombud",
            Archive: "Sensitivt ombudsdokument",
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

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra JSON-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "HRMU",
          department: "Mestring og utvikling",
          description, // Required. A description of what the statistic element represents
          type: "Henvendelse til mobbeombud", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          skole: flowStatus.parseJson.result.DialogueInstance.Utfylling.Informasjon_om_barnet.Skole_barnehage
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
