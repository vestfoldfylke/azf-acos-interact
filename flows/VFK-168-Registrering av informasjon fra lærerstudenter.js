const description = 'Påmelding til konferanse for råd for personer med funksjonsnedsettelse' // Marit Karlsen er eier
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Personalrom/Lists/Registrering%20av%20lrerstudenter/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Personalrom/Lists/Registrering%20av%20lrerstudenter/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.UserID || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName || 'Mangler fornavn',
              Etternavn: flowStatus.parseJson.result.SavedValues.Login.LastName || 'Mangler etternavn',
              Adresse: flowStatus.parseJson.result.SavedValues.Login.Address || 'Mangler adresse',
              Postnr_x0020_og_x0020_sted: `${flowStatus.parseJson.result.SavedValues.Login.PostalCode} ${flowStatus.parseJson.result.SavedValues.Login.PostalArea}`,
              Telefonnummer: flowStatus.parseJson.result.SavedValues.Login.Telephone || 'Mangler telefonnummer',
              E_x002d_post: flowStatus.parseJson.result.SavedValues.Login.Email || 'Mangler epost',
              Skole: jsonData.Lærerstudenter.Informasjon_om_.Skole || 'Mangler skole',
              Tidsrom_x0020_fra: jsonData.Lærerstudenter.Informasjon_om_.Tidsrom_fra || 'Mangler tidsrom fra',
              Tidsrom_x0020_til: jsonData.Lærerstudenter.Informasjon_om_.Tidsrom_til || 'Mangler tidsrom til',
              Fag: jsonData.Lærerstudenter.Informasjon_om_.Fag,
              Navn_x0020_p_x00e5__x0020_veiled: jsonData.Lærerstudenter.Informasjon_om_.Navn_på_veilede
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
          company: 'Opplæring og tannhelse',
          department: 'Skole',
          description, // Required. A description of what the statistic element represents
          type: 'Registrering av informasjon fra lærerstudenter' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
