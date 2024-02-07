const description = 'Søknad om tilskudd til Liv og røre på egen skole'
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
    string Orgnr
    string Kommune
    string Skole
  }

  */

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', '')
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-105' : '24-3',
            Title: 'Søknad om tilskudd til Liv og røre', // - ${flowStatus.parseXml.result.ArchiveData.OmProsjektet}`,
            // UnofficialTitle: ,
            Status: 'B',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Sakarkiv',
            ArchiveCodes: [
              {
                ArchiveCode: '243',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              }
            ],
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? 'recno' : 'recno',
            ResponsiblePersonEmail: 'eli.haraldsen@vestfoldfylke.no',
            // AccessGroup: 'Alle'
            AccessCode: 'U'
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
        // const caseNumber = nodeEnv === 'production' ? 'må fylles inn!' : '23/00115'
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
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Orgnr.replaceAll(' ', ''),
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
                Title: 'Søknad om midler - Liv og røre',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Søknad om midler - Liv og røre', // ` - ${flowStatus.parseXml.result.ArchiveData.OmProsjektet}`,
            // UnofficialTitle: 'Søknad om utsetting av ferskvannsfisk',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? 'recno-Prod' : 'recno-Test', // Seksjon samfunn og plan-  Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: 'eli.haraldsen@vestfoldfylke.no',
            AccessCode: 'U'
            // Paragraph: 'Offl. § 26 femte ledd',
            // AccessGroup: ''
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samfunnsutvikling',
          department: 'Seksjon samfunn og plan',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om midler - Liv og røre', // Required. A short searchable type-name that distinguishes the statistic element
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
