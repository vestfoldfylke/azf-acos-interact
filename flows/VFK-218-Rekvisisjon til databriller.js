const description = "Databriller"
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
      getCaseParameter: (flowStatus) => {
        return {
          Title: "Databriller", // check for exisiting case with this title
          ArchiveCode: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber
        }
      },
      mapper: (flowStatus) => {
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Personal",
            // Project: '20-15',
            Title: "Databriller",
            UnofficialTitle: `Databriller - ${flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.displayName}`,
            Status: "A",
            AccessCode: "26",
            Paragraph: "Offl. § 26 femte ledd",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Personal",
            ArchiveCodes: [
              {
                ArchiveCode: "441",
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
                IsUnofficial: true
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
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
                Role: "Avsender",
                IsUnofficial: true
              }
              /*,
              {
                ReferenceNumber: `recno: ${flowStatus.syncEmployee.result.archiveManager.recno}`,
                Role: 'Mottaker'
              }
              */
            ],
            UnregisteredContacts: [
              {
                ContactName: flowStatus.parseJson.result.DialogueInstance.Rekvisisjon_til.Godkjenning_fra.Navn1,
                Role: "Saksbehandler"
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Rekvisisjon til databriller",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 26 femte ledd",
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: "J",
            Title: "Rekvisisjon til databriller",
            Archive: "Personaldokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber
          }
        }
      }
    }
  },

  signOff: {
    enabled: true
  },

  closeCase: {
    // handleCase må kjøres for å kunne kjøre closeCase
    enabled: true
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "HR",
          department: "",
          description,
          type: "Søknad om hjemmekontor",
          // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          responsibleEnterprise: flowStatus.syncEmployee.result.responsibleEnterprise.shortName
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
