const description = 'Søknad om sentralløyve'
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
  string Kontaktperson
  string Organisasjonsnavn
  string OrgNr
  string ReguleringsplanProsjektTiltak
  string Veinormal
  string Egendefinert1
  string Egendefinert2
  string Egendefinert3
}

}

  */

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgnr.replaceAll(' ', '')
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
            // Project: nodeEnv === 'production' ? '24-291' : '24-6',
            Title: `Sentral drosjeløyve - ${xmlData.sentral} - ${xmlData.orgnr.replaceAll(' ', '')}`,
            Status: 'B',
            AccessCode: 'U',
            JournalUnit: 'Sentralarkiv',
            SubArchive: nodeEnv === 'production' ? '200004' : '200015',
            SubArchiveCode: 'Løyver',
            ArchiveCodes: [
              {
                ArchiveCode: `${xmlData.orgnr.replaceAll(' ', '')}`,
                ArchiveType: 'ORG',
                Sort: 1,
                IsManualText: true
              },
              {
                ArchiveCode: 'N12',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              },
              {
                ArchiveCode: '&18',
                ArchiveType: 'TILLEGGSKODE PRINSIPP',
                Sort: 3
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200100' : '200157' // Team Drift og forvaltning
            // ResponsiblePersonEmail: nodeEnv === 'production' ? 'daniel.maslohansen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no'
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
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
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            AccessGroup: 'Løyver',
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: xmlData.orgnr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: 'Søknad om sentralløyve',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200100' : '200157', // Team Drift og forvaltning
            // ResponsiblePersonEmail: nodeEnv === 'production' ? 'daniel.maslohansen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            Status: 'J',
            Title: 'Søknad om sentralløyve',
            Archive: 'Saksdokument',
            SubArchive: 'Løyver',
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Team Drift og forvaltning',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om sentralløyve' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
