const description = "Søknad om tilskudd til fagskoleutdanning"
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Søknad.Informasjon_om_søker.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
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
                Role: "Avsender",
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Søknad.Informasjon_om_søker.Organisasjon.Organisasjonsnummer.replaceAll(" ", ""),
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad om fagskolemidler",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200091" : "200148", // Seksjon voksenopplæring og karriereutvikling
            ResponsiblePersonEmail: nodeEnv === "production" ? "annichen.sjoblom@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            Status: "J",
            Title: `Søknad om fagskolemidler 2027 - ${flowStatus.parseJson.result.DialogueInstance.Søknad.Informasjon_om_søker.Organisasjon.Organisasjonsnavn}`,
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/09013" : "24/00059"
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
        let soknaderTilAndreString = ""
        const andreSøknaderliste = Array.isArray(jsonData.Søknad.Søknader_til_andre) ? jsonData.Søknad.Søknader_til_andre : [jsonData.Søknad.Søknader_til_andre] // Sjekker om det er mer enn ett tilbud i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const søknad of andreSøknaderliste) {
          soknaderTilAndreString += `${søknad.Fylkeskommune} (${søknad.Søknadsbeløp})\n`
        }
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-FagskoleforvaltningVFK/Lists/Fagskolemidler/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-FagskoleforvaltningVFK/Lists/Fagskolemidler/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Søknad.Informasjon_om_søker.Organisasjon.Organisasjonsnavn || "Mangler orgnavn", // husk å bruke internal name på kolonnen
              Organisasjonsnummer: jsonData.Søknad.Informasjon_om_søker.Organisasjon.Organisasjonsnummer.replaceAll(" ", "") || "Mangler orgnr",
              Adresse: jsonData.Søknad.Informasjon_om_søker.Organisasjon.Gatenavn_og__nummer1 || "Mangler adresse",
              Postnummer: jsonData.Søknad.Informasjon_om_søker.Organisasjon.Postnummer1 || "Mangler postnummer",
              Sted: jsonData.Søknad.Informasjon_om_søker.Organisasjon.Poststed1 || "Mangler poststed",
              Kontonummer: jsonData.Søknad.Informasjon_om_søker.Kontonummer,
              E_x002d_post_x0020_til_x0020_fag: jsonData.Søknad.Informasjon_om_søker.E_postadresse_til1,
              E_x002d_post_x0020_til_x0020_kon: jsonData.Søknad.Informasjon_om_søker.E_postadresse_til,
              S_x00f8_knadsbel_x00f8_p: jsonData.Søknad.Søknadsbeløp1.Oppgi_samlet,
              S_x00f8_knader_x0020_til_x0020_a: soknaderTilAndreString || "Ingen andre søknader",
              Kategori: jsonData.Søknad.Søkerkategori.Velg_ett_av,
              M_x00e5_loppn_x00e5_else_x0020_f: jsonData.Søknad.Informasjon_om.Gi_en_vurdering_av,
              Planlagte_x0020_endringer: jsonData.Søknad.Informasjon_om.Beskriv_eventuelle,
              Heltidsekvivalenter: jsonData.Søknad.Informasjon_om.Oppgi_samlet_antall,
              Vurdering_x0020_av_x0020_st_x00f: jsonData.Søknad.Informasjon_om.Vurder_størrelsen,
              Planlagt_x0020_utdanningstilbud: jsonData.Søknad.Informasjon_om1.Beskriv_planlagt,
              Gjennomf_x00f8_ring: jsonData.Søknad.Informasjon_om1.Beskriv_hvordan,
              Forventede_x0020_heltidsekvivale: jsonData.Søknad.Informasjon_om1.Oppgi_antall,
              Andel_x0020_gjennomf_x00f8_rte_x: jsonData.Søknad.Informasjon_om1.Oppgi_andel,
              Egen_x0020_m_x00e5_loppn_x00e5_e: jsonData.Søknad.Informasjon_om1.Dersom_fagskolen,
              Vurdering_x0020_av_x0020_st_x00f0: jsonData.Søknad.Informasjon_om1.Vurder_størrelsen1,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber
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
          company: "OPT-Fagskoleforvaltning",
          department: "Seksjon voksenopplæring og karriereutvikling",
          description, // Required. A description of what the statistic element represents
          type: "Søknad om tilskudd til fagskoleutdanning", // Required. A short searchable type-name that distinguishes the statistic element
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
