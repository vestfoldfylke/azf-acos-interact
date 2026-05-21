const description = "Søknad om dispensasjon fra streik"
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (_dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {}
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Dispensasjonssøknad
        const date = jsonData.Dispensasjon.Dato_det_søkes.split("-")
        const newDate = `${date[2]}.${date[1]}.${date[0]}`
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/MBMforberedelser-Tariff2026/Lists/Dispensasjonssknader/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/MBMforberedelser-Tariff2026/Lists/Dispensasjonssknader/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Dispensasjon.Navn,
              E_x002d_post: jsonData.Dispensasjon.E_postadresse,
              Tittel: jsonData.Dispensasjon.Tittel1,
              Dato_x0020_det_x0020_s_x00f8_kes: newDate,
              Gjelder: jsonData.Dispensasjon.Gjelder,
              Begrunnelse: jsonData.Dispensasjon.Begrunnelse,
              Innsender: `${jsonData.Innsender.Fornavn1} ${jsonData.Innsender.Etternavn1}`,
              Tittel_x0020_innsender: jsonData.Innsender.Tittel,
              Virksomhet: jsonData.Innsender.Virksomhet,
              Seksjon: jsonData.Innsender.Seksjon,
              Telefon: jsonData.Innsender.Telefon1
            }
          }
        ]
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Organisasjon",
          department: "Ledergruppa",
          description, // Required. A description of what the statistic element represents
          type: "Søknad om dispensasjon fra streik" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
