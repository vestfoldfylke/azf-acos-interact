const description = 'Taushetserklæring for leveranse av IT-utstyr'
const { nodeEnv } = require('../config')
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
            CaseNumber: nodeEnv === 'production' ? '24/05847' : '24/00023',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200013' : '200014',
            documentDate: new Date().toISOString(),
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            AccessGroup: 'Seksjon Digitale tjenester'
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
  groundControl: {
    enabled: true // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Digitale tjenester',
          department: 'Seksjon digitale tjenester',
          description, // Required. A description of what the statistic element represents
          type: 'Taushetserklæring', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  }
}
