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
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Personal',
            // Project: '20-15',
            Title: 'Avtale om telefonordning',
            UnofficialTitle: `Avtale om telefonordning - ${flowStatus.parseXml.archiveData.Fornavn} ${flowStatus.parseXml.archiveData.Etternavn}`,
            Status: 'B',
            AccessCode: '7',
            Paragraph: 'Offl. § 7d',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Personal',
            ArchiveCodes: [
              {
                ArchiveCode: '542',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              }
            ],
            ResponsibleEnterpriseNumber: '45678912'
            // ResponsiblePersonEmail: 'fornavn.etternavn@domene.no',
            // AccessGroup: 'tilgangsgruppe' // Automatisk
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
            AccessCode: '7',
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.orgNr.replaceAll(' ', ''),
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
                Title: 'Avtale om telefonordning',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 7d',
            ResponsiblePersonEmail: xmlData.LederEpost, // leder
            Status: 'J',
            Title: 'Avtale om telefonordning',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  sharepointList: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Prosjektnummer) throw new Error('Prosjektnummer har ikke kommet med fra XML')
        return [
          {
            testListUrl: '',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-FEL-HR-begrensetinnsyn/Lists/Soknadomtelefonordning/AllItems.aspx',
            uploadFormPdf: false,
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'HR',
          department: '',
          description,
          type: 'Søknad om telefonordning', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Seksjon
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
