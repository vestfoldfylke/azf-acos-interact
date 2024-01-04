const description = 'Sender til Sharepoint'
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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/AlleProgramforslagMFMVestfoldfra2024/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/AlleProgramforslagMFMVestfoldfra2024/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              field_18: xmlData.Navn,
              field_15: xmlData.Status,
              Title: xmlData.Tittel,
              field_2: xmlData.MaalgruppeFra,
              field_3: xmlData.MaalgruppeTil,
              field_4: xmlData.UtoverInstrument,
              field_16: xmlData.Beskrivelse,
              field_1: xmlData.Video
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
          company: 'SAMU',
          department: 'MFM',
          description,
          type: 'innmelding av produksjon' // Required. A short searchable type-name that distinguishes the statistic element
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
