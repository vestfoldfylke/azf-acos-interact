const description = 'Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter'
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          orgnr: xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', '')
        }
      }
    }
  },

  handleProject: {
    enabled: true,
    options: {
      getProjectParameter: (flowStatus) => {
        return {
          Title: flowStatus.parseXml.result.ArchiveData.NyttSamarbeidsorganNavn // check for exisiting project with this title, '%' er wildcard når vi søker i 360 eller sif api.
          // ContactReferenceNumber: school.orgNr,
          // StatusCode: 'Under utføring'
        }
      },
      mapper: (flowStatus) => {
        return {
          service: 'ProjectService',
          method: 'CreateProject',
          parameter: {
            Title: flowStatus.parseXml.result.ArchiveData.NyttSamarbeidsorganNavn,
            ResponsiblePersonRecno: nodeEnv === 'production' ? '200016' : '200019' // Seks
            /* Contacts: [
              {
                ReferenceNumber: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring,
                Role: 'Ansvarlig'
              }
            ]
              */
          }
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
            Project: flowStatus.handleProject.result.ProjectNumber || '',
            Title: `Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter - ${xmlData.NyttSamarbeidsorganNavn}`,
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
                ArchiveCode: 'A55',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: nodeEnv === 'production' ? 'jan.erik.rismyhr@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessGroup: 'Alle'
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
            AccessCode: '26',
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', ''),
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
            Paragraph: 'Offl. § 26 femte ledd',
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Godkjenning av samarbeidsorgan',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019' // Seksjon Fag- og yrkesopplæring
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
        let dagligLeder = ''
        if (xmlData.DagligLederSammePerson === 'Ja') {
          dagligLeder = xmlData.NavnUtfyller
        } else {
          dagligLeder = xmlData.NavnDagligLeder
        }
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20godkjenning%20som%20nytt%20samarbeidsorgan%20for/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20godkjenning%20som%20nytt%20samarbeidsorgan%20for/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.NyttSamarbeidsorganNavn, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: xmlData.NyttSamarbeidsorganOrgnr,
              Navn_x0020_utfyller: xmlData.NavnUtfyller,
              Navn_x0020_daglig_x0020_leder: dagligLeder,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber
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
          type: 'Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter', // Required. A short searchable type-name that distinguishes the statistic element
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
