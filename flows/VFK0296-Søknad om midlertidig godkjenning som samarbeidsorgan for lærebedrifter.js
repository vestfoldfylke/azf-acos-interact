const description = 'Søknad om midlertidig godkjenning som samarbeidsorgan for lærebedrifter'
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
  string Samarbeidsorgan
  string Bekreftelse
  string Prosjektnr
  string Egendefinert1
  string Egendefinert2
}
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
      getCaseParameter: (flowStatus) => {
        return {
          Title: `Søknad om midlertidig godkjenning som samarbeidsorgan for lærebedrift - ${flowStatus.parseXml.result.ArchiveData.Samarbeidsorgan}` // check for exisiting case with this title
        }
      },
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: flowStatus.parseXml.result.ArchiveData.Prosjektnr || '',
            Title: `Midlertidig godkjenning som samarbeidsorgan for lærebedrift - ${flowStatus.parseXml.result.ArchiveData.Samarbeidsorgan}`,
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
                ReferenceNumber: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'kristina.rabe@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessGroup: '' // Automatisk
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
                Title: 'Bekreftelse',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Søknad om midlertidig godkjenning som samarbeidsorgan for lærebedrift',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'kristina.rabe@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: 'U'
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        let bekreftelse = 'Nei'
        if (xmlData.Bekreftelse === 'true') { bekreftelse = 'Ja' }
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20midlertidig%20godkjenning%20som%20samarbeidsorg/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20midlertidig%20godkjenning%20som%20samarbeidsorg/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.parseXml.result.ArchiveData.Samarbeidsorgan, // husk å bruke internal name på kolonnen
              Kontaktperson: xmlData.Kontaktperson,
              S_x00f8_ker_x0020_om_x0020_midle: bekreftelse
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
          company: 'Opplæring',
          department: 'Fagopplæring',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om midlertidig godkjenning som samarbeidsorgan for lærebedrift', // Required. A short searchable type-name that distinguishes the statistic element
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
