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
  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.InnsenderFnr
        }
      }
    }
  },
  syncPrivatePersonElev: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.ElevFnr
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
            CaseType: 'Ombud',
            Title: `Lærebedrift - ${xmlData.bedriftsnavn}`,
            Status: 'B',
            AccessCode: 'U',
            JournalUnit: 'Sentralarkiv',

            ArchiveCodes: [
              {
                ArchiveCode: '---',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'A53',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],

            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: xmlData.orgNr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200421' : '200065'
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
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '7',
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.orgNr,
                Role: 'Avsender',
                IsUnofficial: true
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
              }
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
