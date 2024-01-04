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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/Til%20vurdering%20p%20neste%20mte.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/Til%20vurdering%20p%20neste%20mte.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Kontaktinformasjon: xmlData.Navn,
              Status: xmlData.Status,
              Title: xmlData.Tittel,
              Alder_x0020_fra: xmlData.MaalgruppeFra,
              Alder_x0020_til: xmlData.MaalgruppeTil,
              Ut_x00f8_vere_x0020_og_x0020_ins: xmlData.UtoverInstrument,
              Kort_x0020_beskrivelse: xmlData.Beskrivelse,
              fielLenker_x0020_med_x0020_passord: xmlData.Video
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
