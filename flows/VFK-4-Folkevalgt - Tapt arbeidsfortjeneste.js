const description = 'Tapt arbeidsfortjeneste' // Anita Jørgensen er eier
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Refusjon_av_tap
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Tapt%20arbeidsfortjeneste/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Tapt%20arbeidsfortjeneste/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.LastName || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Innsender_x0020_fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName || 'Mangler fornavn',
              Refusjonstype: jsonData.Refusjon_av_tap,
              Organisasjonsnavn: jsonData.Arbeidsgiver.Organisasjon1.Organisasjonsna1,
              Organisasjonsnummer: jsonData.Arbeidsgiver.Organisasjon1.Organisasjonsnu1,
              Navn_x0020_p_x00e5__x0020_folkev: jsonData.Folkevalgt_føre.Fyll_inn_navn_p,
              Trekk_x0020_pr_x002e__x0020_time: jsonData.Folkevalgt_føre.Trekk_pr__time_,
              Bekreftelse_x0020_p_x00e5__x0020: jsonData.Folkevalgt_føre.Jeg_bekrefter_a
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
          company: 'Dokumentasjon og politisk støtte',
          department: 'fylkestinget',
          description, // Required. A description of what the statistic element represents
          type: 'Tapt arbeidsfortjeneste' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
