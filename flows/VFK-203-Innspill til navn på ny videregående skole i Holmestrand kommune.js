const description = 'Innspill til navn på ny videregående skole i Holmestrand kommune'
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
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.Egendefinert1 === 'Privatperson'
      },
      */
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
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
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
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
                Title: 'Innspill',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'hanne.iselin.terland@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Innspill til navn på ny videregående skole i Holmestrand kommune',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '26/03811' : '26/00009'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/NavneprosessnyVGS/Lists/NavnNyVGS/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/NavneprosessnyVGS/Lists/NavnNyVGS/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Vi_trenger_ditt.Informasjon_om_.Fornavn1} ${jsonData.Vi_trenger_ditt.Informasjon_om_.Etternavn1}`, // husk å bruke internal name på kolonnen
              Telefon: jsonData.Vi_trenger_ditt.Informasjon_om_.Telefon1,
              E_x002d_post: jsonData.Vi_trenger_ditt.Informasjon_om_.E_post,
              Forslagnavn: jsonData.Vi_trenger_ditt.Forslag_og_begr.Forslag_til_nav,
              Begrunnelse: jsonData.Vi_trenger_ditt.Forslag_og_begr.Begrunnelse_for,
              Innsendtp_x00e5_vegneav: jsonData.Vi_trenger_ditt.Forslag_og_begr.Fyll_ut_navn_på || 'seg selv som privatperson',
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Seksjon Sektorstøtte, inntak og eksamen',
          description,
          type: 'Innspill til navn på ny videregående skole i Holmestrand kommune', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
