const description = 'Søknad om fravik fra veinormalen'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik.Innsender.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-291' : '24-6',
            Title: `Søknad om fravik - ${jsonData.Informasjon1.Reguleringsplan_prosjekt} - ${jsonData.Informasjon1.Kommune3}`,
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
                ArchiveCode: 'Q13',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200094' : '200150', // Team infrastruktur
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'daniel.maslohansen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no'
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik
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
            AccessCode: 'U',
            AccessGroup: 'Team Veiforvaltning',
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik.Innsender.Organisasjon.Organisasjonsnu.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: 'Søknad om fravik',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200094' : '200150', // Team infrastruktur
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'daniel.maslohansen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            Status: 'J',
            Title: `Søknad om fravik - ${jsonData.Informasjon1.Reguleringsplan_prosjekt} - ${jsonData.Informasjon1.Kommune3}`,
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Fraviksknad/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Fraviksknad/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Innsender.Organisasjon.Organisasjonsna || 'Mangler navn', // husk å bruke internal name på kolonnen
              Kontaktperson: jsonData.Innsender.Navn_pa_kontaktperson,
              Reguleringsplan_x0020__x002f__x0: jsonData.Informasjon1.Reguleringsplan_prosjekt,
              Veinormal_x0020_det_x0020_gj_x00: jsonData.Vegnormal_det_sokes_frav,
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Soknad_om_fravik
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Team Veiforvaltning',
          description, // Required. A description of what the statistic element represents
          type: 'Fravik fra veinormalen', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          kommune: jsonData.Informasjon1.Kommune3,
          veg: jsonData.Vegnormal_det_sokes_frav
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
