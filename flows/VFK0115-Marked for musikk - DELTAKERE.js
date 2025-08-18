const description = 'Marked for musikk - DELTAKERE'
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkdeltakere/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkdeltakere/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.etternavn || 'Ikke fylt ut', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.fornavn || 'Ikke fylt ut',
              e_x002d_post: xmlData.epost || 'Ikke fylt ut',
              Mobil: xmlData.mobil || 'Ikke fylt ut',
              Org_x002f_firma: xmlData.orgFirma || 'Ikke fylt ut',
              E_x002d_post_x0020_for_x0020_fak: xmlData.fakturaEpost || 'Ikke fylt ut',
              Fakturaadresse: xmlData.fakturaadresse || 'Ikke fylt ut',
              Postnr: xmlData.postnr || 'Ikke fylt ut',
              Poststed: xmlData.poststed || 'Ikke fylt ut',
              Fakturareferanse: xmlData.fakturaReferanse || 'Ikke fylt ut',
              Arbeidsomr_x00e5_de: xmlData.arbeidsomrade || 'Ikke fylt ut',
              MFM_x002d_pass: xmlData.mfmPass || 'Ikke fylt ut',
              Kampanjekode: xmlData.kampanjekode || 'Ikke fylt ut',
              Hotellovernatting_x0020_Farris_x: xmlData.hotellovernatting || 'Ikke fylt ut',
              Innsjekk: xmlData.innsjekk || 'Ikke fylt ut',
              Utsjekk: xmlData.utsjekk || 'Ikke fylt ut',
              Middag_x0020_1: xmlData.middag1 || 'Ikke fylt ut',
              Middag_x0020_2: xmlData.middag2 || 'Ikke fylt ut',
              Spesiellebehov: xmlData.spesielleBehov || 'Ikke fylt ut',
              Informasjonomfremtidigearrangeme: xmlData.akseptFremtidigArr || 'Ikke fylt ut',
              Spesiellebehovannet: xmlData.spesielleBehov2 || 'Ikke fylt ut',
              Antallelever_x002f_studenter: xmlData.deltakerAntallElever || 'Ikke fylt ut',
              Skole: xmlData.deltakereSkole || 'Ikke fylt ut',
              Kontakte_x002d_post: xmlData.deltakereEpost || 'Ikke fylt ut',
              Datofordeltakelse: xmlData.deltakereDato || 'Ikke fylt ut',
              Hyllest_x0020_til_x0020_Ambj_x00: xmlData.ambjornsen || 'Ikke fylt ut'
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
          department: 'Kultur',
          description,
          type: 'Marked for musikk - DELTAKERE' // Required. A short searchable type-name that distinguishes the statistic element
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
