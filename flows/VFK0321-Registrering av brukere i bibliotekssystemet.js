const description = 'Registrering av brukere i biblioteksystemet'
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
        // Mapper for enkeltelev
        const liste = Array.isArray(xmlData.brukere.bruker) ? xmlData.brukere.bruker : [xmlData.brukere.bruker] // Sjekker om det er mer enn en elev i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const rad of liste) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Brukerregistrering/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Brukerregistrering/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: rad.feideId || 'Mangler navn', // husk å bruke internal name på kolonnen
              Navnp_x00e5_bruker: rad.navnBruker,
              Rollebruker: rad.rolle,
              Skolebruker: rad.skole,
              Innmelding_x002f_utmelding: rad.innEllerUt,
              Navnp_x00e5_innsender: xmlData.innsenderNavn,
              Tittel_x0028_innsender_x0029_: xmlData.innsenderTittel,
              Skole_x0028_innsender_x0029_: xmlData.innsenderSkole
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
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
          type: 'Registrering av brukere i biblioteksystemet' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
