const description = "Tilskudd til idrettsarrangement og regionale idrettsanlegg"
const { nodeEnv } = require("../config")

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

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_soker.Informasjon_om_soker2.Organisasjon.Organisasjon_orgnr.replaceAll(" ", "")
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const p360Attachments = attachments.map((att) => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: "F",
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: "DocumentService",
          method: "CreateDocument",
          parameter: {
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_soker.Informasjon_om_soker2.Organisasjon.Organisasjon_orgnr.replaceAll(" ", ""),
                Role: "Avsender",
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad om fylkeskommunale midler til idrettsarrangement",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om fylkeskommunale midler til idrettsarrangement 2026 – ${flowStatus.parseJson.result.DialogueInstance.Idrettsarrangement.Beskrivelse.Navn_pa_idrettsarrangeme}`,
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/04125" : "24/00006",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200025" : "200031", // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            AccessCode: "U",
            Paragraph: "",
            AccessGroup: "Alle"
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMU-IdrettogfriluftslivVTFK/Lists/Sknader%20idrettsarrangement/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMU-IdrettogfriluftslivVTFK/Lists/Sknader%20idrettsarrangement/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_soker.Informasjon_om_soker2.Organisasjon.Organisasjon_orgnavn,
              Arrangements_x002d_anleggsnavn: jsonData.Idrettsarrangement.Beskrivelse.Navn_pa_idrettsarrangeme,
              Gjennomf_x00f8_ringstidspunkt: `${jsonData.Idrettsarrangement.Beskrivelse.Tidspunkt_for_gjennomfor_from} - ${jsonData.Idrettsarrangement.Beskrivelse.Tidspunkt_for_gjennomfor_to}`,
              Arrangements_x002d__x002f_anlegs: jsonData.Idrettsarrangement.Beskrivelse.Arrangementssted,
              Kommune: jsonData.Idrettsarrangement.Beskrivelse.Kommune,
              Tildeltarranegement: jsonData.Idrettsarrangement.Beskrivelse.Har_dere_fatt_tildelt_ar,
              Beskrivelse: jsonData.Idrettsarrangement.Beskrivelse.Her_ønsker_vi_a,
              Tilskudd: jsonData._konomi.Tilskudd_til_id.Hva_soker_du_om_tilskudd,
              Sumutgifter: jsonData._konomi.Gruppe9.Sum_utgifter,
              S_x00f8_knadssum: jsonData._konomi.Soknadssum2.Soknadssum_til_fylkeskom,
              E_x002d_post: jsonData.Informasjon_om_soker.Kontaktopplysninger.E_postadresse3 || jsonData.Informasjon_om_soker.Kontaktopplysninger.E_postadresse2,
              Organisasjonsnummer: jsonData.Informasjon_om_soker.Informasjon_om_soker2.Organisasjon.Organisasjon_orgnr.replaceAll(" ", ""),
              Kontonummerforutetaling: jsonData.Informasjon_om_soker.Informasjon_om_soker2.Kontonummer_for_utbetali,
              Tilskuddsordning: "Idrettsarrangement",
              _x00c5_rstall: ""
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
          company: "Kultur",
          department: "",
          description, // Required. A description of what the statistic element represents
          type: "Tilskudd til idrettsarrangement og regionale idrettsanlegg", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
