const description = 'Søknad om telefonavtale'
module.exports = {
  config: {
    enabled: false,
    doNotRemoveBlobs: false
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
  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person med fiktivt fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr,
          forceUpdate: false // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      getCaseParameter: (flowStatus) => {
        return {
          Title: 'Avtale om telefonordning', // check for exisiting case with this title
          ArchiveCode: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      },
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Personal',
            // Project: '20-15',
            Title: 'Avtale om telefonordning',
            UnofficialTitle: `Avtale om telefonordning - ${flowStatus.parseXml.result.ArchiveData.Fornavn} ${flowStatus.parseXml.result.ArchiveData.Etternavn}`,
            Status: 'A',
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Personal',
            ArchiveCodes: [
              {
                ArchiveCode: '542',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 2
              },
              {
                ArchiveCode: flowStatus.parseXml.result.ArchiveData.Fnr,
                ArchiveType: 'FNR',
                Sort: 1,
                IsManualText: true
              }
            ],
            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: flowStatus.parseXml.result.ArchiveData.Fnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            AccessGroup: '' // Automatisk
          }
        }
      }
    }
  },
  archive: {
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
            AccessCode: '26',
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
                Role: 'Avsender',
                IsUnofficial: true
              }
              /*,
              {
                ReferenceNumber: `recno: ${flowStatus.syncEmployee.result.archiveManager.recno}`,
                Role: 'Mottaker'
              }
              */
            ],
            UnregisteredContacts: [
              {
                ContactName: xmlData.GodkjentAv,
                Role: 'Saksbehandler'
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Avtale om telefonordning',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 26 femte ledd',
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: 'J',
            Title: 'Avtale om telefonordning',
            Archive: 'Personaldokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  },
  signOff: {
    enabled: true
  },
  closeCase: { // handleCase må kjøres for å kunne kjøre closeCase
    enabled: true
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-tjenesteutvikling-sandbox/Lists/TestSoknadomtelefonordning/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Organisasjon-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Brukernavn,
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Enhetsnavn: xmlData.Seksjon,
              Kommentar: xmlData.Kommentar,
              Ansattnummer: xmlData.Ansattnr,
              F_x00f8_dselsdato: xmlData.Fdato
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
          company: 'HR',
          department: '',
          description,
          type: 'Søknad om telefonordning',
          // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          responsibleEnterprise: flowStatus.syncEmployee.result.responsibleEnterprise.shortName
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
