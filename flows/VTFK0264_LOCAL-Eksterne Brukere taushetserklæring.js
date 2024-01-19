const description = 'Arkivering av taushetserklæring for opprettelse av eksterne brukere og lokal avlevering'
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
string Fornavn
string Etternavn
string Adresse
string Postnr
string Sted
string Mobil
string epost
string AcosOrderId
string Fnr
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
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          secure: false,
          parameter: {
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Taushetserklæring',
                VersionFormat: 'A'
              }
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Taushetserklæring',
            UnofficialTitle: `Taushetserklæring - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '23/35207' : '23/00074',
            ResponsibleEnterpriseNumber: '15330',
            documentDate: new Date().toISOString(),
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            AccessGroup: 'IT konserndrift og brukerstøtte'
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
          company: 'BDK',
          department: 'Konserndrift',
          description, // Required. A description of what the statistic element represents
          type: 'Taushetserklæring', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  groundControl: {
    enabled: true // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  failOnPurpose: {
    enabled: false
  }
}

// Etter at skjemaet har blir hentet ned på vt-a-task01 vil scriptet "handleOrders.ps1" opprette den eksterne brukeren og varsle bestiller.
