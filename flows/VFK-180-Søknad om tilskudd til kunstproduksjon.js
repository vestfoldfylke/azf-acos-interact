const description = 'Søknad om støtte til kunstproduksjon'
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

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Type_søker.Jeg_søker_på_ve === 'meg selv (som privatperson)'
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
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Type_søker.Jeg_søker_på_ve === 'en organisasjon'
      },
      mapper: (flowStatus) => {
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
                Role: 'Avsender',
                ReferenceNumber: jsonData.Informasjon_om_.Type_søker.Jeg_søker_på_ve === 'meg selv (som privatperson)' ? flowStatus.parseJson.result.SavedValues.Login.UserID : jsonData.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad - tilskudd til kunstproduksjon',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd til kunstproduksjon - ${jsonData.Beskrivelse.Tilskuddsordnin.Velg_tilskuddso}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/15698' : '24/00066',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'yvonne.pleym@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20sttte%20til%20kunstproduksjon%20%202025/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20sttte%20til%20kunstproduksjon%20%202025/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_.Type_søker.Jeg_søker_på_ve === 'meg selv (som privatperson)' ? `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}` : `${jsonData.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsna} - ${jsonData.Informasjon_om_.Organisasjon1.Kontaktperson}`,
              Tilskuddsordning: jsonData.Beskrivelse.Tilskuddsordnin.Velg_tilskuddso,
              Prosjektnavn: jsonData.Beskrivelse.Prosjektbeskriv.Navn_på_prosjek,
              Prosjektbeskrivelse: jsonData.Beskrivelse.Prosjektbeskriv.Kort_beskrivels,
              Samarbeidspartnere: jsonData.Beskrivelse.Prosjektbeskriv.Samarbeidspartn,
              Prosjektperiode_x0020_fra: jsonData.Beskrivelse.Prosjektbeskriv.Prosjekperiode_,
              Prosjektperiode_x0020_til: jsonData.Beskrivelse.Prosjektbeskriv.Prosjektperiode,
              S_x00f8_knadssum: jsonData.Økonomi.Oppsummering.Søknadssum,
              Totalkostnad: jsonData.Økonomi.Oppsummering.Sum_utgifter,
              Andre_x0020_inntekter: jsonData.Økonomi.Oppsummering.Andre_inntekter1,
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
          company: 'Samfunnsutvikling',
          department: 'Kultur',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om støtte til kunstproduksjon', // Required. A short searchable type-name that distinguishes the statistic element
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
