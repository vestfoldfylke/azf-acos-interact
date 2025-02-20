const description = 'Registrering av unntak for fakturering'
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const type = xmlData.type
        if (type === 'Enkeltelev') {
          // Mapper for enkeltelev
          const liste = Array.isArray(xmlData.elever.elev) ? xmlData.elever.elev : [xmlData.elever.elev] // Sjekker om det er mer enn en elev i lista (altså et array). Hvis ikke lag et array med det ene elementet
          for (const rad of liste) {
            const [dayFrom, monthFrom, yearFrom] = rad.datoFra.split('.')
            const isoDateFrom = new Date(yearFrom, monthFrom - 1, dayFrom).toISOString()
            const [dayTo, monthTo, yearTo] = rad.datoTil.split('.')
            const isoDateTo = new Date(yearTo, monthTo - 1, dayTo).toISOString()
            const sharepointElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx',
              prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: rad.navnElev || 'Mangler navn', // husk å bruke internal name på kolonnen
                Tittel_x002f_stilling: xmlData.innsenderTittel,
                Navnp_x00e5_innsender: xmlData.innsenderNavn,
                Navn: xmlData.innsenderSkole,
                Fradato: isoDateFrom,
                Tildato: isoDateTo,
                FeideID: rad.feideId
              }
            }
            sharepointElements.push(sharepointElement)
          }
          return sharepointElements
        } else if (type === 'Klasse') {
          // Mapper for klasse s
          const liste = Array.isArray(xmlData.klasser.klasse) ? xmlData.klasser.klasse : [xmlData.klasser.klasse] // Sjekker om det er mer enn en klasse i lista (altså et array). Hvis ikke lag et array med det ene elementet
          for (const rad of liste) {
            const [day, month, year] = rad.fraDato.split('.')
            const isoDateFrom = new Date(year, month - 1, day).toISOString()
            const sharepointElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx',
              prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Faktureringsunntak/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: rad.navnKlasse || 'Mangler navn på klasse', // husk å bruke internal name på kolonnen
                Tittel_x002f_stilling: xmlData.innsenderTittel,
                Navnp_x00e5_innsender: xmlData.innsenderNavn,
                Navn: xmlData.innsenderSkole,
                Fradato: isoDateFrom
              }
            }
            sharepointElements.push(sharepointElement)
          }
          return sharepointElements
        } else throw new Error('Ukjent type: ' + type)
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
          department: 'Bibliotekene',
          description, // Required. A description of what the statistic element represents
          type: 'Registrering av unntak for fakturering fra bibliotektjenesten' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
