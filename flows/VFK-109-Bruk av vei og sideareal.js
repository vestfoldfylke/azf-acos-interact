const description = "Bruk av vei og sideareal"
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

  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return (
          flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som === "Tiltakshaver" &&
          flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Tiltakshaver === "Privatperson"
        )
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
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
        return (
          flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som !== "Tiltakshaver" &&
          flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Tiltakshaver !== "Privatperson"
        )
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        let orgnr
        if (flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som === "Tiltakshaver") {
          orgnr = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Tiltakshaver_or.Organisasjon5.Organisasjonsnu4.replaceAll(" ", "")
        } else if (flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som === "Konsulent/ tredjepart") {
          orgnr = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Konsulent_tredj.Organisasjon7.Organisasjonsnu6.replaceAll(" ", "")
        } else if (flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som === "Utførende") {
          orgnr = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Utførende2.Organisasjon6.Organisasjonsnu5.replaceAll(" ", "")
        } else {
          throw new Error("Ugyldig tilstand i syncEnterprise")
        }
        return {
          orgnr
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea
        /*
        const fromDate = jsonData.Tiltaket_onskes_gjennomf.Fra_til_from.split('-')
        const toDate = jsonData.Tiltaket_onskes_gjennomf.Fra_til_to.split('-')
        const newFromDate = `${fromDate[2]}.${fromDate[1]}.${fromDate[0]}`
        const newToDate = `${toDate[2]}.${toDate[1]}.${toDate[0]}`
        */
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: nodeEnv === "production" ? "26-101" : "26-2",
            Title: `Bruk av vei- og sideareal - Fv ${jsonData.Hvor.Berørte_veinr__} - ${jsonData.Hvor.Berørte_veinavn} - ${jsonData.Bruk.Hva_skal_veiareal_brukes} - ${jsonData.Hvor.Kommune} kommune`,
            Status: "B",
            AccessCode: "U",
            JournalUnit: "Sentralarkiv",

            ArchiveCodes: [
              {
                ArchiveCode: "Q13",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 1
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200093" : "200151" // Team veiforvaltning
          }
        }
      }
    }
  },

  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea
        /*
        const fromDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_from.split('-')
        const toDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_to.split('-')
        const newFromDate = `${fromDate[2]}.${fromDate[1]}.${fromDate[0]}`
        const newToDate = `${toDate[2]}.${toDate[1]}.${toDate[0]}`
        */
        const kontakttype = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Jeg_søker_som
        let avsenderId = ""
        if (kontakttype === "Tiltakshaver" && flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Søker.Tiltakshaver === "Privatperson") {
          avsenderId = flowStatus.parseJson.result.SavedValues.Login.UserID
        } else if (kontakttype === "Tiltakshaver") {
          avsenderId = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Tiltakshaver_or.Organisasjon5.Organisasjonsnu4.replaceAll(" ", "")
        } else if (kontakttype === "Konsulent/ tredjepart") {
          avsenderId = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Konsulent_tredj.Organisasjon7.Organisasjonsnu6.replaceAll(" ", "")
        } else if (kontakttype === "Utførende") {
          avsenderId = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea.Utførende2.Organisasjon6.Organisasjonsnu5.replaceAll(" ", "")
        } else {
          throw new Error("JSON-fila må inneholde en gyldig kontakttype for avsender")
        }
        const caseNumber = flowStatus.handleCase.result.CaseNumber
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
            AccessCode: "U",
            AccessGroup: "Alle",
            Category: "Dokument inn",
            Contacts: [
              {
                Role: "Avsender",
                ReferenceNumber: avsenderId,
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
                Title: "Søknad om arrangement langs fylkesveg",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200093" : "200151", // Team veiforvaltning
            Status: "J",
            Title: `Søknad om bruk av vei- og sideareal - Fv ${jsonData.Hvor.Berørte_veinr__} - ${jsonData.Hvor.Berørte_veinavn} - ${jsonData.Bruk.Hva_skal_veiareal_brukes} - ${jsonData.Hvor.Kommune} kommune`,
            Archive: "Saksdokument",
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Bruk_av_vei__og_sidearea
        const fromDate = jsonData.Tiltaket_onskes_gjennomf.Fra_til_from.split("-")
        const toDate = jsonData.Tiltaket_onskes_gjennomf.Fra_til_to.split("-")
        const newFromDate = `${fromDate[2]}.${fromDate[1]}.${fromDate[0]}`
        const newToDate = `${toDate[2]}.${toDate[1]}.${toDate[0]}`
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bruk%20av%20vei%20og%20sideareal/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bruk%20av%20vei%20og%20sideareal/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.refId || "Mangler title", // husk å bruke internal name på kolonnen
              Types_x00f8_ker: jsonData.Søker.Jeg_søker_som,
              Organisasjonsnummer:
                jsonData.Konsulent_tredj.Organisasjon7.Organisasjonsnu6 ||
                jsonData.Tiltakshaver_or.Organisasjon5.Organisasjonsnu4 ||
                jsonData.Utførende2.Organisasjon6.Organisasjonsnu5 ||
                "Ingen organisasjon",
              Organisasjonsnavn:
                jsonData.Konsulent_tredj.Organisasjon7.Organisasjonsna6 ||
                jsonData.Tiltakshaver_or.Organisasjon5.Organisasjonsna4 ||
                jsonData.Utførende2.Organisasjon6.Organisasjonsna5 ||
                "Ingen organisasjon",
              Kontaktperson_x0028_organisasjon: jsonData.Konsulent_tredj.Kontaktperson || jsonData.Tiltakshaver_or.Kontaktperson_i || jsonData.Utførende2.Kontaktperson_u,
              KontaktpersonE_x002d_post_x0028_: jsonData.Konsulent_tredj.E_post_kontaktp3 || jsonData.Tiltakshaver_or.E_post_kontaktp2 || jsonData.Utførende2.E_post_kontaktp1,
              Kontaktpersontelefon_x0028_organ: jsonData.Konsulent_tredj.Telefonnummer_k || jsonData.Tiltakshaver_or.Telefonnummer_k1 || jsonData.Utførende2.Telefonmummer_k,
              Kontaktperson_x0028_privat_x0029: `${jsonData.Informasjon_om_.Fornavn1} ${jsonData.Informasjon_om_.Etternavn1}`,
              KontaktpersonE_x002d_post_x0028_0: jsonData.Informasjon_om_.E_post,
              Kontaktpersontelefon_x0028_priva: jsonData.Informasjon_om_.Telefon1,
              Hvor_x0028_adresse_x0029_: jsonData.Hvor.Adresse_r_,
              Hvor_x0028_kommune_x0029_: jsonData.Hvor.Kommune,
              Bruksomr_x00e5_de: jsonData.Bruk.Hva_skal_veiareal_brukes,
              Ber_x00f8_rtveiareal: jsonData.Bruk.Hvilke_veiareal_blir_ber,
              Ber_x00f8_rteveiobjekter: jsonData.Bruk.Folgende_veiobjekter_bli,
              // Beskrivelse: xmlData.Egendefinert3,
              Gjennomf_x00f8_ringsperiodefra: newFromDate,
              Gjennomf_x00f8_ringsperiodetil: newToDate,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Samferdsel",
          department: "Seksjon veiforvaltning",
          description, // Required. A description of what the statistic element represents
          type: "Bruk av vei og sideareal" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // documentNumber:  // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
