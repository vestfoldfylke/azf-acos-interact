const description = 'Søknad om å bli godkjent lærebedrift, opplæringskontor eller medlem i opplæringskontor.- Skal opprettes en ny sak pr skjema'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
ArchiveData {
    string orgNr
    string bedriftsnavn
    string adresse
    string postnr
    string sted
    string epost
    string telefon
}

  */
  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        console.log(flowStatus.parseXml.result.ArchiveData.orgNr.replaceAll(' ', ''))
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgNr.replaceAll(' ', '')
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Title: `Lærebedrift - ${xmlData.bedriftsnavn}`,
            Status: 'B',
            AccessCode: 'U',
            JournalUnit: 'Sentralarkiv',

            ArchiveCodes: [
              {
                ArchiveCode: 'A53',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 1
              }
            ],

            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: xmlData.orgNr.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019' // Seksjon Fag- og yrkesopplæring
          }
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
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '7',
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.orgNr.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: `Søknad ny lærebedrift ${xmlData.bedriftsnavn}`,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 7d',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            Status: 'J',
            Title: `Søknad ny lærebedrift ${xmlData.bedriftsnavn}`,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Fag- og yrkesopplæring',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad ny lærebedrfit - bedriftsnavn', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          skole: xmlData.SkoleNavn
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
