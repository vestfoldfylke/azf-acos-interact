const description = 'Påmelding til praksiskandidatkurs'
// const { nodeEnv } = require('../config')

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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Pmeldingtilpraksiskandidatkurs/Lists/Pmelding%20til%20praksiskandidatkurs/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Pmeldingtilpraksiskandidatkurs/Lists/Pmelding%20til%20praksiskandidatkurs/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.SavedValues.Login.UserID,
              Fornavn: jsonData.SavedValues.Login.FirstName,
              Etternavn: jsonData.SavedValues.Login.LastName,
              Adresse: jsonData.SavedValues.Login.Address,
              Postnummer: jsonData.SavedValues.Login.PostalCode,
              Poststed: jsonData.SavedValues.Login.PostalArea,
              Telefon: jsonData.SavedValues.Login.Telephone || 'Telefon mangler',
              E_x002d_post: jsonData.SavedValues.Login.Email || 'E-post mangler',
              Arbeidssted: jsonData.DialogueInstance.P\u00E5melding.Informasjon_om_.Navn_p\u00E5_arbeids,
              Arbeidssituasjon: jsonData.DialogueInstance.P\u00E5melding.Informasjon_om_.N\u00E5v\u00E6rende_arbei,
              Praksistimer: jsonData.DialogueInstance.P\u00E5melding.Informasjon_om_.Antall_relevant,
              Periode: jsonData.DialogueInstance.P\u00E5melding.Informasjon_om_.Periode_for_pra,
              Kommentarer: jsonData.DialogueInstance.P\u00E5melding.Informasjon_om_.Kommentarer_ell
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
          department: 'Kompetansebyggeren',
          description,
          type: 'Påmelding til praksiskandidatkurs' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
