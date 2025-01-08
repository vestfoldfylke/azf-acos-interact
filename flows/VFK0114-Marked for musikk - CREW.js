const description = 'Marked for musikk - CREW'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkcrew/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkcrew/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.etternavn || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.fornavn,
              e_x002d_post: xmlData.epost,
              Mobil: xmlData.mobil,
              Andreopplysninger: xmlData.andreOpplysninger,
              E_x002d_post_x0020_for_x0020_fak: xmlData.fakturaEpost,
              Hotellovernatting: xmlData.hotell,
              Arbeidsdag_x002d_Opprigg: xmlData.arbeidsdag0,
              Arbeidsdag_x002d_Dag1: xmlData.arbeidsdag1,
              Arbeidsdag_x002d_Dag2: xmlData.arbeidsdag2,
              Arbeidsdag_x002d_Dag3: xmlData.arbeidsdag3,
              Middagdag1: xmlData.middagDag1,
              Middagdag2: xmlData.middagDag2
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
          type: 'Marked for musikk - CREW' // Required. A short searchable type-name that distinguishes the statistic element
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
