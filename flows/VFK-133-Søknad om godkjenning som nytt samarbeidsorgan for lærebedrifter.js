const description = "Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter"
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
        // for å opprette/oppdatere en virksomhet i P3360
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnr.replaceAll(" ", "")
        }
      }
    }
  },

  handleProject: {
    enabled: true,
    options: {
      getProjectParameter: (flowStatus) => {
        return {
          Title: flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnavn // check for exisiting project with this title, '%' er wildcard når vi søker i 360 eller sif api.
          // ContactReferenceNumber: school.orgNr,
          // StatusCode: 'Under utføring'
        }
      },
      mapper: (flowStatus) => {
        return {
          service: "ProjectService",
          method: "CreateProject",
          parameter: {
            Title: flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnavn,
            ResponsiblePersonRecno: nodeEnv === "production" ? "200016" : "200019" // Seks
            /* Contacts: [
              {
                ReferenceNumber: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring,
                Role: 'Ansvarlig'
              }
            ]
              */
          }
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
            Project: flowStatus.handleProject.result.ProjectNumber || "",
            Title: `Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter - ${flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnavn}`,
            Status: "B",
            AccessCode: "U",
            JournalUnit: "Sentralarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "A55",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnr.replaceAll(" ", ""),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200016" : "200019", // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: nodeEnv === 'production' ? 'jan.erik.rismyhr@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessGroup: "Alle"
          }
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
            AccessCode: "26",
            AccessGroup: "Fagopplæring",
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Soknad.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnr.replaceAll(" ", ""),
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
                Title: "Bekreftelse",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 26 femte ledd",
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Godkjenning av samarbeidsorgan",
            Archive: "Saksdokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200016" : "200019" // Seksjon Fag- og yrkesopplæring
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Soknad
        let dagligLeder = ""
        if (jsonData.Opplysninger_om.Fylles_soknaden_ut_av_en === "Nei") {
          dagligLeder = `${jsonData.Opplysninger_om_den_som_2.Fornavn} ${jsonData.Opplysninger_om_den_som_2.Etternavn}`
        } else {
          dagligLeder = `${jsonData.Opplysninger_om_daglig_l.Fornavn2} ${jsonData.Opplysninger_om_daglig_l.Etternavn1}`
        }
        return [
          {
            testListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20godkjenning%20som%20nytt%20samarbeidsorgan%20for/AllItems.aspx",
            prodListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20godkjenning%20som%20nytt%20samarbeidsorgan%20for/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnavn, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: jsonData.Opplysninger_om_samarbei.Organisasjon.Organisasjon_orgnr.replaceAll(" ", ""),
              Navn_x0020_utfyller: `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
              Navn_x0020_daglig_x0020_leder: dagligLeder,
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
          company: "Opplæring",
          department: "Fagopplæring",
          description, // Required. A description of what the statistic element represents
          type: "Søknad om godkjenning som nytt samarbeidsorgan for lærebedrifter", // Required. A short searchable type-name that distinguishes the statistic element
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
