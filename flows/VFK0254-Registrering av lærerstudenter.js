const description = 'Registrering av praksis for lærerstudenter'
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
  /*
XML file from Acos:
ArchiveData {
    string Fnr
    string Fornavn
    string Etternavn
    string Adresse
    string PostnrSted
    string Mobilnr
    string Epost
    string Skole
    string Fagvalg
    string Tid_fra
    string Til_til
    string Fag
    string Veileder
}
*/

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/dev-test/Lists/Studentinformasjon%20test%20VFK0254/AllItems.aspx',
            prodListUrl: 'Husk å legg inn!',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Poststed: xmlData.Sted,
              Mobil: xmlData.Mobilnr,
              E_x002d_post: xmlData.Epost,
              Skole: xmlData.Skole,
              Tid_x003a_Fra: xmlData.Tid_fra,
              Tid_x003a_Til: xmlData.Tid_til,
              Fag: xmlData.Fag,
              Veielder: xmlData.Veileder
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OF',
          department: 'SKOLE',
          description,
          type: 'Registrering av lærerstudenter', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Fag,
          Skole: xmlData.Skole
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
