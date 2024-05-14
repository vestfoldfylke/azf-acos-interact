const description = 'Undersøkelse om deltagelse fag og svennebrevutdeling'
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
  xml fil fra Acos:
ArchiveData {
    string Fnr
    string Fornavn
    string Etternavn
    string Adresse
    string Postnr
    string Sted
    string Mobil
    string Epost
    string Onske
    string Egendefinert1
    string Egendefinert2
    string Egendefinert3
}
  */
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Underskelse%20om%20deltagelse%20p%20fag%20og%20svennebrevutdel/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Underskelse%20om%20deltagelse%20p%20fag%20og%20svennebrevutdel/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Etternavn, // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              F_x00f8_dselsnummer: xmlData.Fnr,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Sted: xmlData.Sted,
              Mobilnummer: xmlData.Mobil,
              Epostadresse: xmlData.Epost,
              _x00d8_nske: xmlData.Onske
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
          company: 'Opplæring',
          department: 'Fagopplæring',
          description,
          type: 'Undersøkelse om deltagelse fag og svennebrevutdeling 2024' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
