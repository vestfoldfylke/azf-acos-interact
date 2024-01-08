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

  /*
  ArchiveData {
    string Status
    string Skole
    string Fnr
    string Fornavn
    string Etternavn
    string Adresse
    string Postnr
    string Poststed
    string Mobilnr
    string Epost
    string Fagkoder
}
  */

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Klager%20p%20skriftlig%20eksamen/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Klager%20p%20skriftlig%20eksamen/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Referansenummer: flowStatus.refId,
              Status: xmlData.Status,
              Skole: xmlData.Skole,
              Fdselsnummer: xmlData.Fnr,
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Epost: xmlData.Epost,
              Valgtefagkoder: xmlData.Fagkoder
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
          company: 'Utdanning',
          department: 'Eksamen',
          description,
          type: 'Klage på skriftlig eksamen for elever som har byttet skole eller ikke har tilgang til VIS' // Required. A short searchable type-name that distinguishes the statistic element
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
