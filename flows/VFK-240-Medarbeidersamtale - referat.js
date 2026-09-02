const description = "Sikkerhetsinstruks for informasjonssikkerhet"
// const { nodeEnv } = require('../config')

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

  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person med fiktivt fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
          forceUpdate: false // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Personal",
            Title: "Medarbeidersamtale",
            UnofficialTitle: `Medarbeidersamtale - ${flowStatus.parseJson.result.DialogueInstance.Deltakere.Medarbeider.Navn}`,
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Personal",
            ArchiveCodes: [
              {
                ArchiveCode: "431",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 2
              },
              {
                ArchiveCode: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
                ArchiveType: "FNR",
                Sort: 1,
                IsManualText: true
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            AccessGroup: "" // Automatisk
          }
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const caseNumber = flowStatus.handleCase.result.CaseNumber
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
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
                Role: "Avsender",
                IsUnofficial: false
              }
              /*,
              {
                ReferenceNumber: `recno: ${flowStatus.syncEmployee.result.archiveManager.recno}`,
                Role: 'Mottaker'
              }
              */
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "referat",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            // Paragraph: "Offl. § 26 tredje ledd",
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: "J",
            Title: "Medarbeidersamtale",
            UnofficialTitle: `Medarbeidersamtale - ${flowStatus.parseJson.result.DialogueInstance.Deltakere.Medarbeider.Navn}`,
            Archive: "Personaldokument",
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "HR",
          department: "HR",
          description,
          type: "Medarbeidersamtale - referat", // Required. A short searchable type-name that distinguishes the statistic element
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
