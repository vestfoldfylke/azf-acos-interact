const description = 'Sender til Sharepoint. Hver privatist som meldes inn i skjema blir en rad i lista.'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      // no mapper here means that we will not create a case if we do not find an existing one and throw error if case is missing
      getCaseParameter: (flowStatus) => {
        return {
          // check for exisiting case with this title
          Title: `Rapportering på hospiteringsordning for yrkesfaglærere - ${flowStatus.parseJson.result.DialogueInstance.Rapportering.Innsender.Skole.split(' ')[0]}%`
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
            Category: 'Internt notat med oppfølging',
            Contacts: [
              {
                ReferenceNumber: nodeEnv === 'production' ? 'recno:200725' : 'recno:200005', // Mottaker: Ole H. / Stine MH
                Role: 'Mottaker',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Rapportering på hospiteringsordning for yrkesfaglærere',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Rapportering på hospiteringsordning for yrkesfaglærere - ${jsonData.Rapportering.Innsender.Skole}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            // ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno, // skolen
            ResponsiblePersonEmail: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.mail,
            AccessCode: 'U'
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
        const sharepointElements = []
        const teacherList = jsonData.Rapportering.Hospitering
        if (teacherList.length === 0) throw new Error('Ingen yrkesfaglærer i JSON filen')
        for (const row of teacherList) {
          const sharepointFagElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Rapportering%20%20hospiteringsordning%20for%20yrkesfaglrere/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Rapportering%20%20hospiteringsordning%20for%20yrkesfaglrere/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Rapportering.Innsender.Navn,
              Skole: jsonData.Rapportering.Innsender.Skole,
              Avdeling: jsonData.Rapportering.Innsender.Avdeling,
              Antall_x0020_yrkesfagl_x00e6_rer: jsonData.Rapportering.Innsender.Antall_yrkesfag,
              Yrkesfagl_x00e6_rer: row.Yrkesfaglærer,
              Programomr_x00e5_de: row.Programområde,
              Bedrift: row.Bedrift,
              Tema_x0020_for_x0020_hospitering: row.Tema_for_hospit,
              _x00c5_r: row.År, // År
              Uke: row.Uke,
              Antall_x0020_dager: row.Antall_dager,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
            }
          }
          sharepointElements.push(sharepointFagElement)
        }
        return sharepointElements
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
          company: 'Utdanning',
          department: 'Fagopplæring',
          description,
          type: 'Rapportering - hospiteringsordning for yrkesfaglærere' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
