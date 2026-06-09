const description = "Registrering av unntak for fakturering"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Registrering
        const sharepointElements = []
        const type = jsonData.Unntaket_for
        if (type === "Enkeltelev") {
          // Mapper for enkeltelev
          const liste = Array.isArray(jsonData.Enkeltelev) ? jsonData.Enkeltelev : [jsonData.Enkeltelev] // Sjekker om det er mer enn en elev i lista (altså et array). Hvis ikke lag et array med det ene elementet
          for (const rad of liste) {
            const [yearFrom, monthFrom, dayFrom] = rad.Gjelder_fra_dato.split("-")
            const isoDateFrom = new Date(yearFrom, monthFrom - 1, dayFrom).toISOString()
            const [yearTo, monthTo, dayTo] = rad.Gjelder_til_dato.split("-")
            const isoDateTo = new Date(yearTo, monthTo - 1, dayTo).toISOString()
            const sharepointElement = {
              testListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx",
              prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx",
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: rad.Navn || "Mangler navn", // husk å bruke internal name på kolonnen
                Tittel_x002f_stilling: jsonData.Innsender.Tittel,
                Navnp_x00e5_innsender: `${jsonData.Innsender.Fornavn2} ${jsonData.Innsender.Etternavn2}`,
                Navn: jsonData.Innsender.Skole,
                Fradato: isoDateFrom,
                Tildato: isoDateTo,
                FeideID: rad.Feide_bruker
              }
            }
            sharepointElements.push(sharepointElement)
          }
          return sharepointElements
        } else if (type === "Klasse") {
          // Mapper for klasse
          const liste = Array.isArray(jsonData.Klasse) ? jsonData.Klasse : [jsonData.Klasse] // Sjekker om det er mer enn en klasse i lista (altså et array). Hvis ikke lag et array med det ene elementet
          for (const rad of liste) {
            const [day, month, year] = rad.Gjelder_fra.split("-")
            const isoDateFrom = new Date(year, month - 1, day).toISOString()
            const sharepointElement = {
              testListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx",
              prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx",
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: rad.navnKlasse || "Mangler navn på klasse", // husk å bruke internal name på kolonnen
                Tittel_x002f_stilling: jsonData.Innsender.Tittel,
                Navnp_x00e5_innsender: `${jsonData.Innsender.Fornavn2} ${jsonData.Innsender.Etternavn2}`,
                Navn: jsonData.Innsender.Skole,
                Fradato: isoDateFrom
              }
            }
            sharepointElements.push(sharepointElement)
          }
          return sharepointElements
        } else throw new Error(`Ukjent type: ${type}`)
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring og tannhelse",
          department: "Bibliotekene",
          description, // Required. A description of what the statistic element represents
          type: "Registrering av unntak for fakturering fra bibliotektjenesten" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
