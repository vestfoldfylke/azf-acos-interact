const description = 'Søknad om å bli godkjent lærebedrift eller godkjenning av nytt lærefag'
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
        // let avsender = xmlData.LaerebedriftOrgnr.replaceAll(' ', '')
        // if (xmlData.GodkjennesSom === 'Nytt samarbeidsorgan for lærebedrifter') { avsender = xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', '') }
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: xmlData.LaerebedriftOrgnr.replaceAll(' ', '')
        }
      }
    }
  },
  /*
  handleProject: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.GodkjennesSom === 'Nytt samarbeidsorgan for lærebedrifter'
      },
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
            Contacts: [
              {
                ReferenceNumber: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring,
                Role: 'Ansvarlig'
              }
            ]
          }
        }
      }
    }
  },
  */
  handleCase: {
    enabled: true,
    options: {
      getCaseParameter: (flowStatus) => {
        return {
          Title: `Lærebedrift - ${flowStatus.parseXml.result.ArchiveData.LaerebedriftNavn}` // check for exisiting case with this title
        }
      },
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // let avsender = xmlData.LaerebedriftOrgnr.replaceAll(' ', '')
        // if (xmlData.GodkjennesSom === 'Nytt samarbeidsorgan for lærebedrifter') { avsender = xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', '') }
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            // Project: flowStatus.handleProject.result.ProjectNumber || '',
            Title: `Lærebedrift - ${flowStatus.parseXml.result.ArchiveData.LaerebedriftNavn}`,
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
                ReferenceNumber: xmlData.LaerebedriftOrgnr.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'jan.erik.rismyhr@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
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
        let dokumenttittel
        // let avsender = xmlData.LaerebedriftOrgnr.replaceAll(' ', '')
        if (xmlData.GodkjennesSom === 'Ny lærebedrift') { dokumenttittel = 'Godkjenning av lærebedrift' }
        if (xmlData.GodkjennesSom === 'Nytt lærefag i godkjent bedrift') { dokumenttittel = 'Nytt lærefag' }
        /*
        if (xmlData.GodkjennesSom === 'Nytt samarbeidsorgan for lærebedrifter') {
          dokumenttittel = 'Godkjenning av samarbeidsorgan for lærebedrifter'
          avsender = xmlData.NyttSamarbeidsorganOrgnr.replaceAll(' ', '')
        }
          */
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
                ReferenceNumber: xmlData.LaerebedriftOrgnr.replaceAll(' ', ''),
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
            Title: dokumenttittel,
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
  /*
  sharepointList: {
    enabled: false,
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
  */
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Fagopplæring',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om å bli godkjent lærebedrift eller godkjenning av nytt lærefag', // Required. A short searchable type-name that distinguishes the statistic element
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
