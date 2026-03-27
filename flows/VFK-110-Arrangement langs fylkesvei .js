const description = "Arrangement langs fylkesvei"
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
          flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Privatperson" ||
          flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Lag/forening uten organisasjonsnummer"
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
          flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Organisasjon" ||
          flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Lag/forening med organisasjonsnummer"
        )
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        let orgnr
        if (flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Organisasjon") {
          orgnr = flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Organisasjon3.Organisasjon5.Organisasjonsnu.replaceAll(" ", "")
        } else if (flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Jeg_soker_pa_vegne_av === "Lag/forening med organisasjonsnummer") {
          orgnr = flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes.Lag_forening2.Organisasjon4.Organisasjon4_orgnr.replaceAll(" ", "")
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes
        const fromDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_from.split("-")
        const toDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_to.split("-")
        const newFromDate = `${fromDate[2]}.${fromDate[1]}.${fromDate[0]}`
        const newToDate = `${toDate[2]}.${toDate[1]}.${toDate[0]}`
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: nodeEnv === "production" ? "24-132" : "26-1",
            Title: `${jsonData.Informasjon_om_arragemen.Navn_på_arrange} - ${jsonData.Informasjon_om_arragemen.Hvilke_n__fylke} - ${newFromDate} - ${newToDate} - ${jsonData.Informasjon_om_arragemen.Kommune_r_}`,
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes
        const fromDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_from.split("-")
        const toDate = jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_to.split("-")
        const newFromDate = `${fromDate[2]}.${fromDate[1]}.${fromDate[0]}`
        const newToDate = `${toDate[2]}.${toDate[1]}.${toDate[0]}`
        const kontakttype = jsonData.Jeg_soker_pa_vegne_av
        let title = `Søknad om arrangement langs fylkesveg - ${jsonData.Informasjon_om_arragemen.Navn_på_arrange} - ${jsonData.Informasjon_om_arragemen.Hvilke_n__fylke} - ${jsonData.Informasjon_om_arragemen.Vegnavn_på_berø} - ${newFromDate} - ${newToDate} - ${jsonData.Informasjon_om_arragemen.Kommune_r_}`
        let avsenderId = ""
        if (kontakttype === "Privatperson") {
          avsenderId = flowStatus.parseJson.result.SavedValues.Login.UserID
        } else if (kontakttype === "Organisasjon") {
          avsenderId = jsonData.Organisasjon3.Organisasjon5.Organisasjonsnu.replaceAll(" ", "")
        } else if (kontakttype === "Lag/forening med organisasjonsnummer") {
          avsenderId = jsonData.Lag_forening2.Organisasjon4.Organisasjon4_orgnr.replaceAll(" ", "")
        } else if (kontakttype === "Lag/forening uten organisasjonsnummer") {
          title = `Søknad om arrangement langs fylkesveg - ${jsonData.Informasjon_om_arragemen.Navn_på_arrange} - ${jsonData.Lag_forening3.Navn_på_lag_for} - ${jsonData.Informasjon_om_arragemen.Hvilke_n__fylke} - ${jsonData.Informasjon_om_arragemen.Vegnavn_på_berø} - ${newFromDate} - ${newToDate} - ${jsonData.Informasjon_om_arragemen.Kommune_r_}`
          avsenderId = flowStatus.parseJson.result.SavedValues.Login.UserID
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
            Title: title,
            Archive: "Saksdokument",
            CaseNumber: caseNumber
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Arrangement_langs_fylkes
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Arrangement%20langs%20fylkesvei/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Arrangement%20langs%20fylkesvei/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_arragemen.Navn_på_arrange || "Mangler title", // husk å bruke internal name på kolonnen
              Type_x0020_arrangement: jsonData.Informasjon_om_arragemen.Type_arrangement,
              S_x00f8_ker_x0020_p_x00e5__x0020: jsonData.Jeg_soker_pa_vegne_av,
              Fylkesveg: jsonData.Informasjon_om_arragemen.Hvilke_n__fylke,
              Behov_x0020_for_x0020_veistengin: jsonData.Informasjon_om_arragemen.Behov_for_veistegning,
              Blir_x0020_fremkommeligheten_x00: jsonData.Informasjon_om_arragemen.Blir_fremkommel,
              Ber_x00f8_ring_x0020_veiareal: jsonData.Informasjon_om_arragemen.Beskriv_hvordan_veiareal,
              Fra_x0020_dato: jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_from,
              Til_x0020_dato: jsonData.Nar_skal_arrangemntet_av.Fra_til_dato_to,
              Innsender: `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
              Organisasjon:
                jsonData.Organisasjon3.Organisasjon5.Organisasjonsna || jsonData.Lag_forening2.Organisasjon4.Organisasjon4_orgnavn || jsonData.Lag_forening3.Navn_på_lag_for || "Ingen organisasjon",
              Dokumentnummer_x0020_i_x0020_p36: flowStatus.archive.result.DocumentNumber,
              Acos_x0020_refiId: flowStatus.refId || "Mangler refId"
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
          company: "Samferdsel",
          department: "Team Veiforvaltning",
          description, // Required. A description of what the statistic element represents
          type: "Arrangement langs fylkesvei", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
