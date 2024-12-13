const description = 'Marked for musikk - DELTAKERE'
// const { nodeEnv } = require('../config')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
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
              Title: xmlData.etternavn || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.fornavn,
              e_x002d_post: xmlData.epost,
              Mobil: xmlData.mobil,
              Org_x002f_firma: xmlData.orgFirma,
              E_x002d_post_x0020_for_x0020_fak: xmlData.fakturaEpost,
              Fakturaadresse: xmlData.fakturaadresse,
              Postnr: xmlData.postnr,
              Poststed: xmlData.poststed,
              Fakturareferanse: xmlData.fakturaReferanse,
              Arbeidsomr_x00e5_de: xmlData.arbeidsomrade,
              MFM_x002d_pass: xmlData.mfmPass,
              Kampanjekode: xmlData.kampanjekode,
              Hotellovernatting_x0020_Farris_x: xmlData.hotellovernatting,
              Innsjekk: xmlData.innsjekk,
              Utsjekk: xmlData.utsjekk,
              Middag_x0020_1: xmlData.middag1,
              Middag_x0020_2: xmlData.middag2,
              Spesiellebehov: xmlData.spesielleBehov,
              Informasjonomfremtidigearrangeme: xmlData.akseptFremtidigArr,
              Spesiellebehovannet: xmlData.spesielleBehov2,
              Deltakerliste2: xmlData.deltakerliste
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
