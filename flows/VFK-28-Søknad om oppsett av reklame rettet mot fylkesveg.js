const description = 'Søknad om oppsett av reklame rettet mot fylkesveg Skal opprettes en ny sak pr skjema'
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

  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Group.Jeg_soker_som === 'Privatperson'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Group.Jeg_soker_som === 'Organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Group.Organisasjon2.Organisasjon2_orgnr.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        if (jsonData.Kontaktopplysninger.Group.Jeg_soker_som !== 'Privatperson' && jsonData.Kontaktopplysninger.Group.Jeg_soker_som !== 'Organisasjon') throw new Error('JSON-fila må inneholde enten Privatperson eller Organisasjon')
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-3' : '23-15',
            Title: `${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Hvilke_veier_re} - ${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Kommunenavn_der} - Søknad om reklame`,
            Status: 'B',
            AccessCode: 'U',
            JournalUnit: 'Sentralarkiv',

            ArchiveCodes: [
              {
                ArchiveCode: 'Q84',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 1
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200093' : '200151' // Team veiforvaltning
          }
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
            Paragraph: 'Offl. § 26 femte ledd',
            AccessGroup: 'Team Veiforvaltning',
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: jsonData.Kontaktopplysninger.Group.Jeg_soker_som === 'Privatperson' ? flowStatus.parseJson.result.SavedValues.Login.UserID : jsonData.Kontaktopplysninger.Group.Organisasjon2.Organisasjon2_orgnr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: `${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Hvilke_veier_re} - ${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Kommunenavn_der} - Søknad om reklame`,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200093' : '200151', // Team veiforvaltning
            Status: 'J',
            Title: `${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Hvilke_veier_re} - ${jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Kommunenavn_der} - Søknad om reklame`,
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

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Team Veiforvaltning',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om reklame', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          kommune: jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Kommunenavn_der,
          veg: jsonData.Opplysninger_om_reklamen.Hvor_skal_reklamen_plass.Hvilke_veier_re
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
