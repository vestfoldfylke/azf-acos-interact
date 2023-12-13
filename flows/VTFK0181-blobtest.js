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
  syncElevmappeFakeSsn: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          generateFakeSsn: true,
          birthdate: '230594',
          gender: 'M',
          firstName: 'Ola',
          lastName: 'Knudsen',
          streetAddress: 'Gata 5',
          zipCode: '4900',
          zipPlace: 'Stedet'
        }
      }
    }
  },
  syncElevmappe: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        return {
          ssn: flowStatus.parseXml.result.skjemadata.Fnr
        }
      }
    }
  },
  syncEmployee: {
    enabled: false,
    options: {
      enOption: 'Hei',
      enTil: 'hå'
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          system: 'acos',
          template: 'create-test-case',
          parameter: {}
        }
      },
      getCaseParameter: (flowStatus) => {
        return {
          CaseNumber: '23/00039' // archive to this case only (case number defined here) (samlesak)
        }
      }
    }
  },
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          system: 'acos',
          template: 'create-test-document',
          parameter: {
            ssn: flowStatus.parseXml.result.skjemadata.Fnr,
            caseNumber: flowStatus.handleCase.result.CaseNumber,
            base64,
            attachments
          }
        }
      }
    }
  },
  _archive: {
    enabled: false,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          system: 'acos',
          template: 'elevdocument-default',
          parameter: {
            organizationNumber: '974568098',
            documentDate: '2021-09-27',
            caseNumber: '20/05905',
            studentName: 'Ola Bredesen',
            responsibleEmail: '',
            accessGroup: 'Elev Bamble vgs',
            studentSsn: '',
            base64,
            documentTitle: 'Tittel',
            attachments
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return [
          {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            siteName: 'BDK-Jrgensteste-team',
            path: 'sites/BDK-Jrgensteste-team/Lists/Tester%20acos/AllItems.aspx',
            listId: '038fbc1f-b046-4266-8f58-9adef78c13ad',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.parseXml.result.skjemadata?.Status || 'tom streng', // husk å bruke internal name på kolonnen
              EtValg: 'heihå'
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'BDK',
          department: 'TEK',
          description: 'Arkivering av testdokument og opprettelse av et listeelement i SP.', // Required. A description of what the statistic element represents
          type: 'TEK - Blobtest', // Required. A short searchable type-name that distinguishes the statistic element
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
