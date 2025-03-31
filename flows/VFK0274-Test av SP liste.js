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
Alle er ikke i bruk!
ArchiveData {
    string Brukernavn
    string Fnr
    string Fornavn
    string Etternavn
    string Adresse
    string Postnr
    string Poststed
    string Mobilnr
    string Epost
    string Virksomhet
    string Tilgangsgruppe
    string Seksjon
    string Godkjent
    string GodkjentAv
    string AvslattAv
    string GodkjentAvslattTidspunkt
    string Kommentar
    string Fdato
    string Ansattnr
}

*/
  sharepointGetListItem: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
          searchFilter: "fields/Fornavn eq 'Nils Krane' and fields/Etternavn eq 'Thvedt'"
        }
      }
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return flowStatus.sharepointGetListItem.result.map(listElement => { // det opprettes en jobb pr element i id-lista
          return {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
            testItemId: listElement.id,
            prodItemId: listElement.id,
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Brukernavn,
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Enhetsnavn: xmlData.Seksjon,
              Kommentar: xmlData.Kommentar,
              Ansattnummer: `${listElement.id}-666`,
              F_x00f8_dselsdato: xmlData.Fdato
            }
          }
        })
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
