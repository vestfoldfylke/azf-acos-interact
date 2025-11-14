const description = 'Sender til Sharepoint. Hver privatist som meldes inn i skjema blir en rad i lista.'
// const { nodeEnv } = require('../config')

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
              Antall_x0020_dager: row.Antall_dager
              // Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
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
