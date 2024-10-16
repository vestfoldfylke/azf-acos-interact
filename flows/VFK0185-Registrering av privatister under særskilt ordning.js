const description = 'Sender til Sharepoint. Hver privatist som meldes inn i skjema blir en rad i lista.'
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
    string KontNavn
    string KontFornavn
    string KontEtternavn
    string KontTelefon
    string KontEpost
    string KontSkole
    string KontOTAvd
    string Representasjon
    string Tiltak
    privatist[] Privatister
      privatist{
        string PrivFnr
        string PrivFornavn
        string PrivEtternavn
        string PrivNavn
        string PrivMobilnr
        string PrivEpost
        string Fagkoder
      }
  }

  */
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const privatistliste = Array.isArray(xmlData.Privatister.privatist) ? xmlData.Privatister.privatist : [xmlData.Privatister.privatist] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const privatist of privatistliste) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Registrereprivatister/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Registrereprivatister/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.KontNavn || 'Mangler navn', // husk å bruke internal name på kolonnen
              Telefon: xmlData.KontTelefon,
              E_x002d_post: xmlData.KontEpost,
              Representasjon: xmlData.Representasjon,
              Skole: xmlData.KontSkole,
              Tiltak_x002f_ordning: xmlData.Tiltak,
              OT_x002d_avdeling: xmlData.KontOTAvd,
              Navnprivatist: privatist.PrivNavn,
              F_x00f8_dselsnummer: privatist.PrivFnr,
              E_x002d_postprivatist: privatist.PrivFnr,
              Mobilprivatist: privatist.PrivMobilnr,
              Fagkode1: privatist.Fagkoder,
              S_x00e6_rskilttilrettelegging: privatist.Tilrettelegging
            }
          }
          sharepointElements.push(sharepointElement)
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
          department: 'Eksamen',
          description,
          type: 'Registrering av privatister under særskilt ordning' // Required. A short searchable type-name that distinguishes the statistic element
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
