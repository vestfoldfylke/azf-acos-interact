const description = "Klage på tannhelsetjenesten Skal opprettes en ny sak pr skjema"
const { nodeEnv } = require("../config")
const { clinics } = require("../lib/data-sources/vfk-dentalclinics")

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

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Klage
        const clinic = clinics.find((clinic) => clinic.name === jsonData.Tannklinikk.Hvilken_tannklinikk_gjel)
        if (!clinic) throw new Error(`Could not find any clinic with Name: ${jsonData.Tannklinikk.Hvilken_tannklinikk_gjel}`)
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Pasientbehandling",
            Title: "Tannbehandling",
            UnofficialTitle: `Tannbehandling - ${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
            Status: "B",
            Project: nodeEnv === "production" ? "26-129" : "26-7",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Pasientbehandling",
            ArchiveCodes: [
              {
                ArchiveCode: "G40",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: flowStatus.parseJson.result.SavedValues.Login.UserID, // xmlData.ElevFnr,
                ArchiveType: "FNR",
                IsManualText: true,
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseNumber: clinic.orgNr
          }
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Klage
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const clinic = clinics.find((clinic) => clinic.name === jsonData.Tannklinikk.Hvilken_tannklinikk_gjel)
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
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            // AccessGroup: '', // Automatic
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
                Title: "Klage på tannhelsetjenesten",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseNumber: clinic.orgNr,
            Status: "J",
            Title: "Klage på tannhelsetjenesten",
            Archive: "Pasientbehandling",
            CaseNumber: caseNumber
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
        const originalDato = flowStatus.parseJson.result.SavedValues.Logic.Dagens_dato
        const nyDato = originalDato.split("-").reverse().join(".") // DD.MM.ÅÅÅÅ
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Klagesaker",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Klagesaker",
            uploadFormPdf: false,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.refId || "Mangler refId",
              Datoforklagen: nyDato,
              Klinikkklagengjelderfor_x003a_: jsonData.Klage.Tannklinikk.Hvilken_tannklinikk_gjel,
              Hovedkategoriforklage: jsonData.Klage.Hva_gjelder_din_klage_,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber
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
          company: "Tannhelse",
          department: "Tannhelse",
          description, // Required. A description of what the statistic element represents
          type: "Klage på tannhelsetjenesten", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          clinic: flowStatus.parseJson.result.DialogueInstance.Klage.Tannklinikk.Hvilken_tannklinikk_gjel
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
