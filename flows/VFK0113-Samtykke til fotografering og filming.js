const description = 'Sender til Sharepoint. Samme liste som VFK0112'
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: '',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Bilde-ogvideoarkiv-Samtykkeskjema2021/Lists/Samtykke',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              AnsattVTFK: xmlData.AnsattVTFK,
              Brukernavn_x0028_ansatt_x0029_: xmlData.Brukernavn,
              Etternavn: xmlData.Etternavn,
              Datoforsamtykke: xmlData.DatoSamtykke,
              E_x002d_postadresse: xmlData.Epost,
              Mobilnummer: xmlData.Mobil,
              Samtykkesituasjonsbilde_x0028_an: xmlData.SamtykkeInterneKanaler,
              Digitalekanaler: xmlData.SamtykkeMedier,
              Internekanaler_x002f_systemer: xmlData.SamtykkeProfilbilde
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
          company: 'Stab',
          department: 'Kommunikasjon',
          description,
          type: 'Samtykke til fotografering og filming' // Required. A short searchable type-name that distinguishes the statistic element
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
