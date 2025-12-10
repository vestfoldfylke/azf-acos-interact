const description = 'Sender til Sharepoint'
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
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Kontaktinformasjon: jsonData.Markedet_for_mu.Informasjon_om_produksjo.Navn,
              Status: 'Avventer',
              Title: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Tittel_pa_produksjon,
              Alder_x0020_fra: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Malgruppe__alder__for_pr,
              Alder_x0020_til: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Til,
              Ut_x00f8_vere_x0020_og_x0020_ins: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Navn_pa_utovere_og_instr,
              Kort_x0020_beskrivelse: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Kort_beskrivels,
              Lenker_x0020_med_x0020_passord: jsonData.Markedet_for_mu.Informasjon_om_produksjo2.Lenke_til_et_representat,
              acosRefId: flowStatus.refId
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
