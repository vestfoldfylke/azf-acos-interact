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

  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
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
            AccessGroup: 'Fylkesbibliotek',
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
                Title: 'Forslag til kandidat',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 5',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '' : '',
            ResponsiblePersonEmail: 'steinar.engeland@vestfoldfylke.no',
            Status: 'J',
            Title: 'Vestfold Litteraturpris - Forslag til kandidat - 2026',
            UnofficialTitle: `Vestfold Litteraturpris - Forslag til kandidat - 2026 - ${jsonData.DialogueInstance.Informasjon_om_.Informasjon_om_.Innsender.Fornavn1} ${jsonData.DialogueInstance.Informasjon_om_.Informasjon_om_.Innsender.Etternavn1}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/14031' : ''
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
          company: 'Fylkesbiblioteket',
          department: 'Litteraturpris',
          description,
          type: 'Nominasjon - litteraturpris', // Required. A short searchable type-name that distinguishes the statistic element
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
