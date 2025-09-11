const description = 'Sender til elevmappe'
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

  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
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
            AccessCode: '5',
            AccessGroup: 'Seksjon Fag- og yrkesopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.SavedValues.Login.UserID,
                Role: 'Avsender',
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
                Title: 'Nominasjon Lærlingprisen',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 5',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring,
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Nominasjon Lærlingprisen - Høst 2025',
            UnofficialTitle: `Nominasjon Lærlingprisen - Høst 2025 - ${jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Fornavn2} ${jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Etternavn2}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/13850' : '25/00091'
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
        const jsonData = flowStatus.parseJson.result
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Nominasjon%20%20lrlingprisen/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Nominasjon%20%20lrlingprisen/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber,
              Fornavn_x0020_innsender: jsonData.SavedValues.Login.FirstName,
              Etternavn_x0020_innsender: jsonData.SavedValues.Login.LastName,
              Organisasjon: jsonData.DialogueInstance.Nominasjon.Innsender_.Navn_på_firma_e,
              Fornavn_x0020_kandidat: jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Fornavn2,
              Etternavn_x0020_kandidat: jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Etternavn2,
              Arbeidssted: jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Arbeidssted_,
              Begrunnelse: jsonData.DialogueInstance.Nominasjon.Informasjon_om_.Begrunnelse_for
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
          company: 'Opplæring og tannhelse',
          department: 'Seksjon Fag- og yrkesopplæring',
          description,
          type: 'Nominasjon - lærlingprisen', // Required. A short searchable type-name that distinguishes the statistic element
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
