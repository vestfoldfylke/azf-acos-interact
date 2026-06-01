const description = "Tilskuddsordning for kulturell og kreativ næring"
const { nodeEnv } = require("../config")

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
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
        // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_søker.Søker.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
                ReferenceNumber: jsonData.Informasjon_om_søker.Søker.Organisasjon.Organisasjonsnummer.replaceAll(" ", ""),
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
                Title: "Tilskuddsordning for kulturell og kreativ næring",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: `Tilskuddsordning for kulturell og kreativ næring - ${jsonData.Om_prosjektet.Hva_er_navnet_på}`,
            // UnofficialTitle: 'Tilskuddsordning for kulturell og kreativ næring',
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/05130" : "26/00092",
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "anna.b.jorgensen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            AccessCode: "U",
            // Paragraph: 'Offl. § 26 femte ledd',
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
        const bagatellmessigStotte = jsonData.Gjennomførbarhet_og.Hvilke_t__år_
          ? `${jsonData.Gjennomførbarhet_og.Hvilke_t__år_} (${jsonData.Gjennomførbarhet_og.Sum__samlet_beløp_})`
          : jsonData.Gjennomførbarhet_og.Har_dere_mottatt
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/KreativNring/Lists/Sknader%20%20tilskuddsordning%20for%20kulturell%20og%20kreativ%20nring/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/KreativNring/Lists/Sknader%20%20tilskuddsordning%20for%20kulturell%20og%20kreativ%20nring/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_søker.Søker.Organisasjon.Organisasjonsnavn, // husk å bruke internal name på kolonnen
              Prosjektleder: `${jsonData.Informasjon_om_søker.Prosjektleder.Fornavn1} ${jsonData.Informasjon_om_søker.Prosjektleder.Etternavn1}`,
              E_x002d_post: jsonData.Informasjon_om_søker.Prosjektleder.E_post1,
              Telefon: jsonData.Informasjon_om_søker.Prosjektleder.Telefon2,
              Navn_x0020_p_x00e5__x0020_prosje: jsonData.Om_prosjektet.Hva_er_navnet_på,
              Bransje: `${jsonData.Om_prosjektet.Hvilken_bransje1} ${jsonData.Om_prosjektet.Hvilken_bransje1.Annen_bransje1}`,
              Forprosjekt: jsonData.Om_prosjektet.Er_dette_et,
              Hovedm_x00e5_l: jsonData.Om_prosjektet.Hva_er_hovedmålet,
              Kort_x0020_beskrivelse: jsonData.Om_prosjektet.Kort_beskrivelse_av,
              Milj_x00f8__x0020_og_x0020_b_x00: jsonData.Om_prosjektet.Hvordan_har_dere,
              Samarbeidspartnere: jsonData.Samarbeid_og.Hvem_er1,
              Viktigheten_x0020_av_x0020_samar: jsonData.Samarbeid_og.Hva_bidrar,
              Til_x0020_gode_x0020_for_x0020_f: jsonData.Samarbeid_og.Hvordan_kan,
              Verdi_x0020_utenfor_x0020_Vestfo: jsonData.Samarbeid_og.Hvordan_har || jsonData.Samarbeid_og.Har_prosjektet, // enten står årsaken her, ellers vises Nei
              Oppstart: jsonData.Gjennomførbarhet_og.Oppstartsdato,
              Slutt: jsonData.Gjennomførbarhet_og.Sluttdato,
              S_x00f8_knadssum: jsonData.Gjennomførbarhet_og.Søknadssum_til,
              Privat_x0020_finansiering: jsonData.Gjennomførbarhet_og.Oppsummering.Privat_finansiering1,
              Andre_x0020_offentlige_x0020_til: jsonData.Gjennomførbarhet_og.Oppsummering.Andre_offentlige1,
              Sum_x0020_inntekter: jsonData.Gjennomførbarhet_og.Oppsummering.Sum_inntekter,
              Sum_x0020_utgifter: jsonData.Gjennomførbarhet_og.Oppsummering.Sum_utgifter,
              Kommentar: jsonData.Gjennomførbarhet_og.Kommentar_til,
              Bagatellmessig_x0020_st_x00f8_tt: bagatellmessigStotte,
              Dokumentnummer_x0020_i_x0020_P36: flowStatus.archive.result.DocumentNumber,
              Acos_x0020_RefId: flowStatus.parseJson.result.Metadata.ReferenceId.Value || "Ingen Acos RefId"
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
          company: "Samfunnsutvikling",
          department: "Kultur",
          description, // Required. A description of what the statistic element represents
          type: "Tilskuddsordning for kulturell og kreativ næring", // Required. A short searchable type-name that distinguishes the statistic element
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
