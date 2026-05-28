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
            Title: "Sikkerhetsinstruks for informasjonssikkerhet",
            UnofficialTitle: `Sikkerhetsinstruks for informasjonssikkerhet - ${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
            Status: "B",
            AccessCode: "26",
            Paragraph: "Offl. § 26 tredje ledd",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Personal",
            ArchiveCodes: [
              {
                ArchiveCode: "420",
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
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Signert sikkerhetsinstruks for informasjonssikkerhet",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 26 tredje ledd",
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: "J",
            Title: "Signert sikkerhetsinstruks for informasjonssikkerhet",
            Archive: "Personaldokument",
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Sikkerhetsinstruks.Informasjon_om
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Signering%20sikkerhetsinstruks/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Signering%20sikkerhetsinstruks/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
              Virksomhet: jsonData.Virksomhet || "Navn e-post",
              Enhet: jsonData.Enhet || "Arbeidssted mangler",
              Dokumentnummer_x0020_i_x0020_P36: flowStatus.archive.result.DocumentNumber || "Mangler dokumentnummer"
              // Acos_x002d_refId: flowStatus.refId || "Mangler refId"
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Virksomhetsstyring",
          department: "Sikkerhetsinstruks for informasjonssikkerhet",
          description,
          type: "Sikkerhetsinstruks for informasjonssikkerhet", // Required. A short searchable type-name that distinguishes the statistic element
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
