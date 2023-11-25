const description = 'Jakt på kystsel'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
ArchiveData {
string fnr
string Fornavn
string Etternavn
string Adresse
string Postnr
string Poststed
string Mobilnr
string Epost
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = nodeEnv === 'production' ? '23/38867' : '23/00024'
        return {

          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Jakt på kystsel',
                VersionFormat: 'A'
              }
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Jakt på kystsel',
            UnofficialTitle: 'Jakt på kystsel',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseNumber: nodeEnv === 'production' ? '43000' : '43000', // Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            AccessCode: 'U',
            Paragraph: '',
            AccessGroup: 'Alle'
          }
        }
      }
    }

  },

  signOff: {
    enabled: true
  },

  closeCase: {
    enabled: false
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'KRIF',
          department: 'Seksjon for kultur, idrett og friluftsliv',
          description, // Required. A description of what the statistic element represents
          type: 'Jakt på kystsel', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
