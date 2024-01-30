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
  // Eksempel der man søker etter rad(er) ved hjelp av verdi i en kolonne
  sharepointGetListItem: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
          searchFilter: `fields/Fodselsnummer eq '${xmlData.Fnr}'`
        }
      }
    }
  },
  // eksempel der man sjekker at man fikk unik match på sharepointGetListItem og oppdaterer den ene raden i lista

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (flowStatus.sharepointGetListItem.result.length !== 1) throw new Error('Fant ikke unik match i lista når vi kjørte sharepointGetListItem, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila')
        const id = flowStatus.sharepointGetListItem.result[0]
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Signert: xmlData.Signert,
              Dato: xmlData.Dato
            }
          }
        ]
      }
    }
  },

  // Eksempel der man søker etter rad(er) ved hjelp av verdier i to kolonner
  sharepointGetListItem2: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
          searchFilter: `fields/Fornavn eq '${xmlData.Fornavn}' and fields/Etternavn eq '${xmlData.Etternavn}'`
        }
      }
    }
  },
  // eksempel der man oppdaterer alle matchende rader fra resultatet av sharepointGetListItem2
  sharepointList2: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return flowStatus.sharepointGetListItem.result.map(id => { // det opprettes en jobb pr element i id-lista
          return {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Brukernavn,
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Enhetsnavn: xmlData.Seksjon,
              Kommentar: xmlData.Kommentar,
              Ansattnummer: `${id}-666`,
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
