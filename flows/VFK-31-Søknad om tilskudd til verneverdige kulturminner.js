const description = "Søknad om tilskudd til verneverdige kulturminner"
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

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Jeg_soker === "som privatperson"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra JSON-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Jeg_soker === "på vegne av en organisasjon eller stiftelse"
      },
      mapper: (flowStatus) => {
        // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_orgnr.replaceAll(" ", "")
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: nodeEnv === "production" ? "26-156" : "24-1",
            Title: `Tilskudd til verneverdige kulturminner 2026 - ${flowStatus.parseJson.result.DialogueInstance.Opplysninger_om_kulturmi.Beskrivelse3.Navn_pa_kulturminnet_}`,
            // UnofficialTitle: ,
            Status: "B",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Sakarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "223",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "C50",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200022" : "200032",
            // ResponsiblePersonEmail: '',
            AccessGroup: "Alle"
          }
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        let sender
        if (jsonData.Kontaktopplysninger.Jeg_soker === "på vegne av en organisasjon eller stiftelse") {
          sender = jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_orgnr.replaceAll(" ", "")
        } else {
          sender = flowStatus.parseJson.result.SavedValues.Login.UserID
        }
        // const caseNumber = nodeEnv === 'production' ? 'må fylles inn!' : '23/00115'
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
                ReferenceNumber: sender,
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
                Title: "Søknad om tilskudd til verneverdige kulturminner",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: `Tilskudd til verneverdige kulturminner 2026 - ${flowStatus.parseJson.result.DialogueInstance.Opplysninger_om_kulturmi.Beskrivelse3.Navn_pa_kulturminnet_}`,
            // UnofficialTitle: 'Søknad om utsetting av ferskvannsfisk',
            Archive: "Saksdokument",
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200022" : "200032", // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            // ResponsiblePersonEmail: '',
            AccessCode: "U",
            // Paragraph: "Offl. § 26 femte ledd",
            AccessGroup: "Seksjon Kulturarv"
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
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20verneverdige%20kulturminner%20i%20privat%20eie%20%202026/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20verneverdige%20kulturminner%20i%20privat%20eie%20%202026/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Kontaktopplysninger.Privatperson.etternavn || "Mangler etternavn", // husk å bruke internal name på kolonnen
              Fornavn: jsonData.Kontaktopplysninger.Privatperson.Fornavn,
              Postnummer: jsonData.Kontaktopplysninger.Privatperson.Postnummer_sted_postnr,
              Sted: jsonData.Kontaktopplysninger.Privatperson.Postnummer_sted_poststed,
              Mobilnummer: jsonData.Kontaktopplysninger.Privatperson.Mobilnummer,
              E_x002d_post: jsonData.Kontaktopplysninger.Privatperson.E_post,
              Kontonummer: jsonData.Kontaktopplysninger.Privatperson.Kontonummer,
              S_x00f8_ker_x0020_som: jsonData.Kontaktopplysninger.Jeg_soker,
              Organisasjonsnummer: jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_orgnr,
              Organisasjonsnavn: jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_orgnavn,
              Adresse_x0020__x0028_organisasjo: jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_gatenavn_og__nu2,
              Postnummer_x0020__x0028_organisa: jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_postnr2,
              Poststed_x0020__x0028_organisasj: jsonData.Kontaktopplysninger.Organisasjon1.Organisasjon.Organisasjon_poststed2,
              Navn_x0020_p_x00e5__x0020_kultur: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Navn_pa_kulturminnet_,
              Beskrivelse_x0020_av_x0020_kultu: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Beskrivelse_av_kulturmin,
              Dagens_x0020_bruk: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Dagens_bruk,
              Fremtidig_x0020_bruk: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Fremtidig_bruk,
              Eier_x0020_av_x0020_kulturminnet: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Hvem_er_eier_av_kulturmi2,
              Er_x0020_s_x00f8_ker_x0020_eier_: jsonData.Opplysninger_om_kulturmi.Beskrivelse3.Er_du_eier_av_kulturminn,
              Kommune_x0020__x0028_kulturminne: jsonData.Opplysninger_om_kulturmi.Lokasjon.Kommunenavn1,
              G_x00e5_rds_x002d__x0020_og_x002: `${String(jsonData.Opplysninger_om_kulturmi.Lokasjon.Gårdsnummer1)}/${String(jsonData.Opplysninger_om_kulturmi.Lokasjon.Bruksnummer1)}`,
              Adresse_x0020__x0028_kulturminne: jsonData.Opplysninger_om_kulturmi.Lokasjon.Adresse3,
              Postnummer_x0020_og_x0020_sted_x: jsonData.Opplysninger_om_kulturmi.Lokasjon.Postnummer_og_sted2,
              Startdato: jsonData.Opplysninger_om_arbeidet.Start_sluttdato_for_pros.Startdato,
              Sluttdato: jsonData.Opplysninger_om_arbeidet.Start_sluttdato_for_pros.Sluttdato,
              Er_x0020_tiltaket_x0020_allerede: jsonData.Opplysninger_om_arbeidet.Start_sluttdato_for_pros.Er_tiltaket_allerede_utf,
              // Tiltakstype: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Tiltakstype,
              Tiltakstype_x0020_restaurering: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Tiltakstype === "Restaurering" ? "Ja" : "",
              Tiltakstype_x0020_Sikring: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Tiltakstype === "Sikring" ? "Ja" : "",
              Tiltakstype_x0020_tilbakef_x00f8: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Tiltakstype === "Tilbakeføring" ? "Ja" : "",
              Kort_x0020_beskrivelse: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Beskriv_kort_arbeidet_de,
              Navn_x0020_p_x00e5__x0020_ansvar: jsonData.Opplysninger_om_arbeidet.Beskrivelse4.Navn_pa_ansvarlig_handve,
              S_x00f8_knadsbel_x00f8_p: jsonData.Soknadsbelop_og_budsjett.Oppsummering_av_inntekte.Soknadssum2,
              Andre_x0020_tilskudd: jsonData.Soknadsbelop_og_budsjett.Oppsummering_av_inntekte.Andre_tillskudd,
              Egeninnsats_x0020_og_x0020_annen: jsonData.Soknadsbelop_og_budsjett.Oppsummering_av_inntekte.Egeninnsats_og_eventuell,
              Sum_x0020_inntekter: jsonData.Soknadsbelop_og_budsjett.Oppsummering_av_inntekte.Sum_inntekter2,
              Sum_x0020_kostnader: jsonData.Soknadsbelop_og_budsjett.Oppsummering_av_inntekte.Sum_kostnader2,
              Offentlig_x0020_st_x00f8_tte: jsonData.Soknadsbelop_og_budsjett.Offentlig_stotte.Har_du_mottatt_offentlig2,
              Informasjon_x0020_om_x0020_offen: jsonData.Soknadsbelop_og_budsjett.Offentlig_stotte.Fyll_inn_informasjon_om_,
              Dokumentnummer_x0020_360: flowStatus.archive.result.DocumentNumber
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
          department: "Kulturarv",
          description, // Required. A description of what the statistic element represents
          type: "Tilskudd til verneverdige kulturminner", // Required. A short searchable type-name that distinguishes the statistic element
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
