const description = "Registrering av brukere i biblioteksystemet"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_
        const sharepointElements = []
        // Mapper for enkeltelev
        const liste = Array.isArray(jsonData.Informasjon_om) ? jsonData.Informasjon_om : [jsonData.Informasjon_om] // Sjekker om det er mer enn en oppføring i arrayet. Hvis ikke lag et array med det ene elementet
        for (const rad of liste) {
          const sharepointElement = {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Brukerregistrering/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/REV-Skolebibliotekarer-FORVALTNINGSTEAM-BIBLIOTOTEKSYSTEM/Lists/Brukerregistrering/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: rad.Feide_bruker || "Mangler navn", // husk å bruke internal name på kolonnen
              Navnp_x00e5_bruker: rad.Navn,
              Rollebruker: rad.Rolle,
              Skolebruker: rad.Skole1,
              Innmelding_x002f_utmelding: rad.Meldingen_gjelder,
              Navnp_x00e5_innsender: `${jsonData.Innsender.Fornavn1} ${jsonData.Innsender.Etternavn1}`,
              Tittel_x0028_innsender_x0029_: jsonData.Innsender.Tittel,
              Skole_x0028_innsender_x0029_: jsonData.Innsender.Skole,
              E_x002d_postadresse_x0028_innsen: rad.E_post1 // kolonnen har senere endret tittel slik at den inneholder epostadressen til den nye brukeren, og ikke til innsenderen.
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
      mapper: (_flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring og tannhelse",
          department: "Bibliotekene",
          description, // Required. A description of what the statistic element represents
          type: "Registrering av brukere i biblioteksystemet" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
