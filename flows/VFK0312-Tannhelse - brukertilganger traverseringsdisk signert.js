const description = 'Oppdaterer rad i SP liste.'
// const { nodeEnv } = require('../config')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.fnr,
          forceUpdate: false // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      /*
      getCaseParameter: (flowStatus) => {
        return {
          Title: 'Tilleggsavtale om hjemmekontor', // check for exisiting case with this title
          ArchiveCode: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      },
      */
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Personal',
            // Project: '20-15',
            Title: 'Ansvarsbekreftelse - Sikret sone og klinisk fotografering',
            UnofficialTitle: `Ansvarsbekreftelse - Sikret sone og klinisk fotografering  - ${flowStatus.parseXml.result.ArchiveData.navn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Personal',
            ArchiveCodes: [
              {
                ArchiveCode: '420',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 2
              },
              {
                ArchiveCode: flowStatus.parseXml.result.ArchiveData.fnr,
                ArchiveType: 'FNR',
                Sort: 1,
                IsManualText: true
              },
              {
                ArchiveCode: '--',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 3,
                IsManualText: true
              }
            ],
            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: flowStatus.parseXml.result.ArchiveData.fnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            AccessGroup: '' // Automatisk
          }
        }
      }
    }
  },
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '13',
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.fnr,
                Role: 'Avsender',
                IsUnofficial: true
              }
              /*,
              {
                ReferenceNumber: `recno: ${flowStatus.syncEmployee.result.archiveManager.recno}`,
                Role: 'Mottaker'
              }
              */
            ],
            /*
            UnregisteredContacts: [
              {
                ContactName: xmlData.GodkjentAv,
                Role: 'Saksbehandler'
              }
            ],
            */
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Ansvarsbekreftelse',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: 'J',
            Title: 'Ansvarsbekreftelse - Sikret sone og klinisk fotografering',
            Archive: 'Personaldokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  },
  signOff: {
    enabled: true
  },
  closeCase: { // handleCase må kjøres for å kunne kjøre closeCase
    enabled: true
  },
  sharepointGetListItem: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
          searchFilter: `fields/guid0 eq '${xmlData.guid}'` // guid blir sendt med fra første skjema og lagret i lista. Denne raden søker vi etter her
        }
      }
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (flowStatus.sharepointGetListItem.result.length !== 1) throw new Error('Fant ikke unik match i lista når vi kjørte sharepointGetListItem, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila')
        const id = flowStatus.sharepointGetListItem.result[0]
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: false,
            uploadFormAttachments: false,
            fields: {
              Tilgangtiltraverseringsdisk: `Signert (${xmlData.tidspunkt})`,
              DokumentnummeriP360: flowStatus.archive?.result?.DocumentNumber || 'ikke arkivert'
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
          company: 'Tannhelse',
          department: 'Tannhelse',
          description,
          type: 'Tannhelse - bestilling av tilganger - Traversering - signert avtale' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber // || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
