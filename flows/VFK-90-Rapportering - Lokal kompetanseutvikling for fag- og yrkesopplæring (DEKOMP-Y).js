const description = "Sender til samlesak"
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
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktpersoner.Soker.Hvem_er_søker_ === "Opplæringskontor"
      },
      mapper: (flowStatus) => {
        // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Kontaktpersoner.Soker.Organisasjon1.Organisasjonsnu.replaceAll(" ", "")
        }
      }
    }
  },

  syncPrivatePerson: {
    // Jobname is valid as long as it starts with "syncPrivatePerson"
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Kontaktpersoner.Soker.Hvem_er_søker_ === "Prøvenemnd"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.DialogueInstance.Kontaktpersoner.Informasjon_om_soker.Fodselsnummer,
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Kontaktpersoner
        let sender
        let accessCode
        let accessGroup
        let paragraph
        if (jsonData.Soker.Hvem_er_søker_ === "Prøvenemnd") {
          sender = jsonData.Informasjon_om_soker.Fodselsnummer
          accessCode = "26"
          accessGroup = "Fagopplæring"
          paragraph = "Offl. § 26 femte ledd"
        } else if (jsonData.Soker.Hvem_er_søker_ === "Skole") {
          sender = flowStatus.parseJson.result.SavedValues.Dataset.Skole2.Orgnr.replaceAll(" ", "")
          accessCode = "U"
          accessGroup = "Alle"
          paragraph = ""
        } else {
          sender = jsonData.Soker.Organisasjon1.Organisasjonsnu.replaceAll(" ", "")
          accessCode = "U"
          accessGroup = "Alle"
          paragraph = ""
        }
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
            AccessCode: accessCode,
            AccessGroup: accessGroup,
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: sender,
                Role: "Avsender",
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
                Title: "Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: paragraph,
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200016" : "200019", // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: '',
            Status: "J",
            Title: "Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)",
            // UnofficialTitle: '',
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "24/00158" : "23/00128"
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
            testListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Rapportering%20%20lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx",
            prodListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Rapportering%20%20lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive?.result?.DocumentNumber || "Dokumentnummer mangler", // husk å bruke internal name på kolonnen
              Navn_x0020_p_x00e5__x0020_skole_: jsonData.Kontaktpersoner.Soker.Organisasjon1.Organisasjonsna || jsonData.Kontaktpersoner.Soker.Skole2 || jsonData.Kontaktpersoner.Navn_pa_provenemnd_,
              Navn_x0020_p_x00e5__x0020_samarb: jsonData.Kontaktpersoner.Soker.Navn_pa_samarbeidspartne,
              Gjennomf_x00f8_ringsperiode: jsonData.Kontaktpersoner.Soker.Gjennomforingsperiode,
              Hvilke_x0020_tiltak_x0020_skal_x: jsonData.Tiltak__Hospitering.Hvilket_tiltak_skal_det_,
              Hvor_x0020_mye_x0020_midler_x002: jsonData.Tiltak__Hospitering.Hvor_mye_midler_ble_tild,
              Hvor_x0020_mye_x0020_av_x0020_mi: jsonData.Tiltak__Hospitering.Hvor_mye_av_midlene_tild2,
              Dersom_x0020_det_x0020_er_x0020_: jsonData.Tiltak__Hospitering.Dersom_det_er_ubrukte_mi2,
              Egenfinansiering: jsonData.Tiltak__Hospitering.Egenfinansiering2.toString(),
              Velg_x0020_tema: jsonData.Vurdering_av_maloppnaels.Hvilke_tema__er_ble_dekk.Velg_tema_,
              Velg_x0020_utdanningsprogram: jsonData.Vurdering_av_maloppnaels.Hvilke_utdanningsprogram.Velg_utdanngsprogram,
              Yrkesfagl_x00e6_rere: jsonData.Vurdering_av_maloppnaels.Yrkesfaglarere.toString(),
              Avdelingsledere: jsonData.Vurdering_av_maloppnaels.Avdelingsledere.toString(),
              Andre_x0020_ansatte_x0020_i_x002: jsonData.Vurdering_av_maloppnaels.Andre_ansatte_i_skole,
              Faglig_x0020_ledere_x0020_og_x00: jsonData.Vurdering_av_maloppnaels.Faglig_ledere_og_instruk.toString(),
              Oppl_x00e6_ringskontor: jsonData.Vurdering_av_maloppnaels.Opplaringskontor3.toString(),
              Pr_x00f8_venemnder: jsonData.Vurdering_av_maloppnaels.Provenemnder.toString(),
              Andre_x0020_m_x00e5_lgrupper: jsonData.Vurdering_av_maloppnaels.Andre_malgrupper__hvilke,
              Navnp_x00e5_densomrapporterer: jsonData.Kontaktpersoner.Navn_pa_den_som_rapporte,
              Eposttildensomrapporterer: jsonData.Kontaktpersoner.E_post__,
              Navnp_x00e5_deltakere: jsonData.Tiltak__Hospitering.Navn_pa_deltakere_
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
          department: "Fagopplæring",
          description,
          type: "Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber // || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
