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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Acos%20%20gevinstmling/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Acos%20%20gevinstmling/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Informasjon_om.Skjema.Skjemanavn,
              Skjema_x0020_ID: jsonData.Informasjon_om.Skjema.SkjemaId,
              Skjemaeier: jsonData.Informasjon_om.Skjemaeier.Navn,
              E_x002d_postadresse: jsonData.Informasjon_om.Skjemaeier.Brukernavn1,
              Virksomhet: jsonData.Informasjon_om.Skjemaeier.Virksomhet,
              Enhet: jsonData.Informasjon_om.Skjemaeier.Enhet,
              I_x0020_bruk_x0020_fra: jsonData.Informasjon_om.Skjema.Skjemaet_skal_tas_i,
              I_x0020_bruk_x0020_til: jsonData.Informasjon_om.Skjema.Skjemaet_skal,
              Varighet: jsonData.Informasjon_om.Skjema.Varighet,
              Hvordan_x0020_ble_x0020_oppgaven: jsonData.Informasjon_om.Har_dere_håndtert,
              Antal_x0020_innsendinger: jsonData.Eksisterende.Hvor_mange_saker,
              Arbeidstid_x0020_pr_x0020_innsen: jsonData.Eksisterende.Anslå_din_eller,
              Eks_x002e__x0020_prosess_x003a__: jsonData.Eksisterende.Hvor_lang_tid_tror,
              Feilsituasjoner: jsonData.Eksisterende.Hvor_ofte_er,
              Ny_x0020_prosess_x003a__x0020_An: jsonData.Ny_oppgave_eller.Hvor_mange_saker1,
              Ny_x0020_prosess_x003a__x0020_es: jsonData.Ny_oppgave_eller.Anslå_din_eller1,
              refId_x002d_nullpunkt: flowStatus.parseJson.result.Metadata.ReferenceId.Value
            }
          }
        ]
      }
    }
  }
}
