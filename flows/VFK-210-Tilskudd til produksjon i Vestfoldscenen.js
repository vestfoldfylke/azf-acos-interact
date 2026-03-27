const description = "Tilskudd til produksjon i Vestfoldscenen"
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsnu.replaceAll(" ", "")
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
                Role: "Avsender",
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsnu.replaceAll(" ", ""),
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad - tilskudd til produksjon i Vestfoldscenen",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Søknad om tilskudd til produksjon i Vestfoldscenen",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/05205" : "26/00030",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200025" : "200031", // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "elin.feen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            AccessCode: "U"
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20produksjon%20i%20Vestfoldscenen/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20produksjon%20i%20Vestfoldscenen/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_.Organisasjon1.Organisasjon.Organisasjonsna,
              Kontaktperson: `${jsonData.Informasjon_om_.Organisasjon1.Kontaktperson} (${jsonData.Informasjon_om_.Organisasjon1.E_post1})`,
              Prosjektnavn: jsonData.Beskrivelse.Prosjektbeskriv.Navn_på_prosjek,
              Prosjektbeskrivelse: jsonData.Beskrivelse.Prosjektbeskriv.Kort_beskrivels,
              Samarbeidspartnere: jsonData.Beskrivelse.Prosjektbeskriv.Samarbeidspartn,
              Prosjektperiode_x0020_fra: jsonData.Beskrivelse.Prosjektbeskriv.Ønsket_spillepe,
              Prosjektperiode_x0020_til: jsonData.Beskrivelse.Prosjektbeskriv.Ønsket_spillepe1,
              Kort_x0020_kommentar: jsonData.Beskrivelse.Prosjektbeskriv.Kort_kommentar_,
              Kunstnerisk_x0020_ide: jsonData.Beskrivelse.Prosjektbeskriv.Kunstnerisk_id\u00E9,
              M_x00e5_lgruppe: jsonData.Beskrivelse.Prosjektbeskriv.Målgruppe_og_pu,
              Milj_x00f8__x0020_og_x0020_b_x00: jsonData.Beskrivelse.Prosjektbeskriv.Milj\u00F8_og_b\u00E6rekr,
              S_x00f8_knadssum: jsonData.Økonomi.Oppsummering.Søknadssum,
              Totalkostnad: jsonData.Økonomi.Oppsummering.Sum_utgifter,
              Andre_x0020_inntekter: jsonData.Økonomi.Oppsummering.Andre_inntekter1,
              Lenke: jsonData.Økonomi.Lenke_til_video,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber,
              Acos_x0020_refid: flowStatus.parseJson.result.Metadata.ReferenceId.Value
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
          type: "Tilskudd til produksjon i Vestfoldscenen", // Required. A short searchable type-name that distinguishes the statistic element
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
