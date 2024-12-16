const description = 'Marked for musikk - GJESTER'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkgjester/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkgjester/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.etternavn || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.fornavn,
              e_x002d_post: xmlData.epost,
              Mobil: xmlData.mobil,
              Pass_x0020_dag_x0020_1: xmlData.pass_dag1,
              Pass_x0020_dag_x0020_2: xmlData.pass_dag2,
              Pass_x0020_dag_x0020_3: xmlData.pass_dag3,
              Middag_x0020_dag_x0020_1: xmlData.middagDag1,
              Middag_x0020_dag_x0020_2: xmlData.middagDag2,
              // Lunsj1: xmlData.lunsj1,
              // Lunsj2
              // Lunsj3
              Spesiellebehov: xmlData.spesielleBehov,
              Overnatting: xmlData.overnatting,
              Datoforinnsjekk: xmlData.datoInnsjekk,
              Datoforutsjekk: xmlData.datoUtsjekk,
              Organisasjon_x002f_firma: xmlData.fakturaOrgNavn,
              Fakturaepost: xmlData.fakturaEpost,
              Fakturaadresse: xmlData.fakturaAdresse,
              Faktura_x0020__x002d__x0020_Post: xmlData.fakturaPostnr,
              Faktura_x0020__x002d__x0020_Sted: xmlData.fakturaPoststed,
              Faktura_x0020__x002d__x0020_Refe: xmlData.fakturaReferanse,
              Vises_x0020_p_x00e5__x0020_delta: xmlData.akseptDeltagerliste,
              Info_x0020_om_x0020_framtidige_x: xmlData.infoOmFramtidigArrangement
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
          type: 'Marked for musikk - GJESTER' // Required. A short searchable type-name that distinguishes the statistic element
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
