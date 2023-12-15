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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: '',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Droneteam/Lists/Flylogg%20for%20drone',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Navn: xmlData.Navn,
              Mobilnummer: xmlData.Mobilnummer,
              E_x002d_postadresse: xmlData.Epost,
              Rolle: xmlData.Rolle,
              Dato: xmlData.Dato,
              Tidfra_x002f_til: xmlData.Tid,
              Totalflytid: xmlData.Flytid,
              Sted: xmlData.Sted,
              Koordinater: xmlData.Koordinater,
              Form_x00e5_l: xmlData.Formal,
              Dronenummer: xmlData.Dronenummer,
              Serienummer: xmlData.Serienummer,
              TyeRPAS: xmlData.TypeRPAS,
              Ansvarlig: xmlData.Ansvarlig,
              Seksjon: xmlData.Seksjon,
              Temperatur: xmlData.Temperatur,
              Vind: xmlData.Vind,
              Skyforhold: xmlData.Skyforhold,
              Merknader: xmlData.Merknader,
              Produsent: xmlData.Produsent
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
          company: 'SMM',
          department: 'Dronegjengen',
          description,
          type: 'Flylogg for drone' // Required. A short searchable type-name that distinguishes the statistic element
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
