const description = "Sender til elevmappe"
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

   // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
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
            AccessCode: "13",
            AccessGroup: "Erasmus+",
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: jsonData.SavedValues.Login.UserID,
                Role: "Avsender",
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200017" : "200020", // Seksjon Kompetanse og pedagogisk utvikling
            // ResponsiblePersonEmail: '',
            Status: "J",
            Title: "Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger",
            // UnofficialTitle: '',
            Archive: "Elevdokument",
            CaseNumber: elevmappe.CaseNumber
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
        const tidligereSkolegang = (jsonData.Tidligere_skolegang?.Tidligere_skolegang3 || [])
          .map((item) => {
            const skole = item.Skole7 || ""
            const skolear = item.Skolear ? ` (${item.Skolear})` : ""
            const utdanningsprogram = item.Utdanningsprogram_vg1_el2 || ""
            if (!skole && !utdanningsprogram) return ""
            return `${skole}${skolear}${utdanningsprogram ? ` - ${utdanningsprogram}` : ""}`.trim()
          })
          .filter(Boolean)
          .join("\n")
        const tidligereArbeidserfaring = (jsonData.Tidligere?.Arbeidsplass || [])
          .map((item) => {
            const fra = item.Periode_fra || ""
            const til = item.Periode_til || ""
            const arbeidsplass = item.Arbeidsplass1 || ""
            const typeArbeid = item.Type_arbeid || ""
            if (!fra && !til && !arbeidsplass && !typeArbeid) return ""
            const periode = [fra, til].filter(Boolean).join(" - ")
            const prefix = periode ? `${periode}: ` : ""
            const typeSuffix = typeArbeid ? ` (${typeArbeid})` : ""
            return `${prefix}${arbeidsplass}${typeSuffix}`.trim()
          })
          .filter(Boolean)
          .join("\n")
        // if (!jsonData.Postnr) throw new Error('Postnr har ikke kommet med fra JSON') // validation example
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Internasjonalisering/Lists/ErasmusSoknad",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Internasjonalisering/Lists/ErasmusSoknad",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Bakgrunnsinformasjon.Person.Fødselsnummer,
              Navn: `${jsonData.Bakgrunnsinformasjon.Person.Fornavn} ${jsonData.Bakgrunnsinformasjon.Person.Etternavn}`,
              Adresse: jsonData.Bakgrunnsinformasjon.Person.Adresse,
              Postnr_x002e__x002f_sted: `${jsonData.Bakgrunnsinformasjon.Person.Postnummer} ${jsonData.Bakgrunnsinformasjon.Person.Poststed}`,
              Mobilnummer: jsonData.Bakgrunnsinformasjon.Person.Telefon,
              E_x002d_post: jsonData.Bakgrunnsinformasjon.Person.E_postadresse,
              L_x00e6_refag: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Larefag2,
              L_x00e6_rekontraktfra: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Larekontrakt_fra_til_from,
              L_x00e6_rekontrakttil: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Larekontrakt_fra_til_to,
              L_x00e6_rested_x002f_arbeidsplas: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Navn_pa_larested_arbeids,
              Navnp_x00e5_veileder: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Navn_pa_veileder,
              Telefonveileder: jsonData.Bakgrunnsinformasjon.Fag_og_arbeidsplass.Telefon_veileder,
              Sterkesider: jsonData.Presentasjon_av_meg.Om_meg.Skriv_noen_ord_om_deg_se,
              Hvaerdugodp_x00e5__x003f_: jsonData.Presentasjon_av_meg.Om_meg.Hvilke_deler_av_jobben_d,
              Engelskkarakter: jsonData.Presentasjon_av_meg.Om_meg.Hva_er_din_karakter_i_en,
              Fritidsinteresser: jsonData.Presentasjon_av_meg.Om_meg.Hva_gjor_du_pa_fritida_o,
              Hvorfor: jsonData.Presentasjon_av_meg.Om_meg.Hvorfor_onsker_du_a_ta_d,
              Fagligutbytte: jsonData.Presentasjon_av_meg.Om_meg.Hvilket_faglig_utbytte_t,
              Utfordringer: jsonData.Presentasjon_av_meg.Om_meg.Hva_vil_vare_de_tre_stor,
              Utenlandserfaring: jsonData.Presentasjon_av_meg.Om_meg.Hvilke_erfaringer_har_du,
              Godesider: jsonData.Presentasjon_av_meg.Om_meg.Hvilke_sider_ved_deg_sel,
              Land: jsonData.Valg_av_land.Land1.Velg_to_land1,
              _x0031__x002e_prioritet: jsonData.Valg_av_land.Land1.Tyskland,
              _x0032__x002e_prioritet: jsonData.Valg_av_land.Land1.Spania,
              Lengdep_x00e5_opphold: jsonData.Valg_av_land.Land1.Lengde_på_opphold,
              Allergier: jsonData.Allergi_og_sykdom.Informasjon_om.Allergier,
              Sykdom: jsonData.Allergi_og_sykdom.Informasjon_om.Sykdom_det_er_viktig_at_,
              Oppl_x00e6_ringskontor: jsonData.Bakgrunnsinformasjon.Navn_pa_Opplaringskontor,
              Tidligereskolegang: tidligereSkolegang,
              Tidligerearbeidserfaring: tidligereArbeidserfaring
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring",
          department: "Seksjon kompetanse og pedagogisk utvikling",
          description,
          type: "Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || "tilArkiv er false" // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
