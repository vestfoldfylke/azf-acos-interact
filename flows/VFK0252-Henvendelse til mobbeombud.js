const description = 'Arkivering av henvendelse til mobbeombud. Skal opprettes en ny sak pr skjema'
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
string SkoleNavn
string ElevNavn
string ElevFnr
string InnsenderFornavn
string InnsenderEtternavn
string InnsenderFnr
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
            Title: 'Elevsak',
            UnofficialTitle: `Elevsak - ${xmlData.SkoleNavn} - ${xmlData.ElevNavn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Mobbeombud',

            ArchiveCodes: [
              {
                ArchiveCode: '---',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'B36',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              },
              {
                ArchiveCode: '--',
                ArchiveType: 'TILLEGGSKODE PRINSIPP',
                Sort: 3,
                IsManualText: true
              },
              {
                ArchiveCode: flowStatus.syncPrivatePersonElev.result.privatePerson.ssn, // xmlData.ElevFnr,
                ArchiveType: 'FNR',
                IsManualText: true,
                Sort: 4
              }
            ],

            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: xmlData.ElevFnr,
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
            AccessCode: '13',
            AccessGroup: 'Mobbeombud',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.InnsenderFnr,
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
                Title: 'Henvendelse til mobbeombud',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200421' : '200065',
            Status: 'J',
            Title: 'Henvendelse til mobbeombud',
            Archive: 'Personsensitivt dokument',
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
          company: 'HRMU',
          department: 'Mestring og utvikling',
          description, // Required. A description of what the statistic element represents
          type: 'Henvendelse til mobbeombud', // Required. A short searchable type-name that distinguishes the statistic element
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
