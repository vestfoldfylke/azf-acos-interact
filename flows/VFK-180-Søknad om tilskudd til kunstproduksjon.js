const description = "Søknad om støtte til kunstproduksjon"
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
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon1.Organisasjon2.Organisasjonsnummer.replaceAll(" ", "")
        }
      }
    }
  },

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
                Role: "Avsender",
                ReferenceNumber: jsonData.Informasjon_om_.Organisasjon1.Organisasjon2.Organisasjonsnummer.replaceAll(" ", ""),
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad - tilskudd til kunstproduksjon",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd til kunstproduksjon - ${jsonData.Beskrivelse.Tilskuddsordnin.Velg_tilskuddso}`,
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/14100" : "24/00066",
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200025" : "200031", // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "yvonne.pleym@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Kunstproduksjon%20%202027/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Kunstproduksjon%20%202027/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Informasjon_om_.Organisasjon1.Organisasjon2.Organisasjonsnavn ?? ""} - ${jsonData.Informasjon_om_.Organisasjon1.Organisasjon2.Organisasjonsnummer ?? ""}`,
              Tilskuddsordning: jsonData.Beskrivelse.Tilskuddsordnin.Velg_tilskuddso,
              Prosjektnavn: jsonData.Beskrivelse.Prosjektbeskriv.Navn_på_prosjek,
              Kort_x0020_beskrivelse: jsonData.Beskrivelse.Prosjektbeskriv.Kort_beskrivels,
              Prosjektbeskrivelse: jsonData.Beskrivelse.Prosjektbeskriv.Beskrivelse_av,
              Samarbeidspartnere: jsonData.Beskrivelse.Prosjektbeskriv.Samarbeidspartn,
              Bidrag_x0020_til_x0020_mangfold_: jsonData.Beskrivelse.Prosjektbeskriv.Hvordan_kan,
              Prosjektperiode_x0020_fra: jsonData.Beskrivelse.Prosjektbeskriv.Prosjekperiode_,
              Prosjektperiode_x0020_til: jsonData.Beskrivelse.Prosjektbeskriv.Prosjektperiode,
              Kulturr_x00e5_det: `${jsonData.Økonomi.Tilskudd_fra.Mottar_dere ?? ""} - ${jsonData.Økonomi.Tilskudd_fra.Hvilken_ordning ?? ""}`,
              S_x00f8_knadssum: jsonData.Økonomi.Oppsummering.Søknadssum,
              Andre_x0020_inntekter: jsonData.Økonomi.Oppsummering.Andre_inntekter1,
              Tilskudd_x0020_kulturr_x00e5_det: jsonData.Økonomi.Oppsummering.Tilskudd_fra1,
              Sum_x0020_inntekter: jsonData.Økonomi.Oppsummering.Sum_inntekter,
              Totalkostnad: jsonData.Økonomi.Oppsummering.Sum_utgifter,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber,
              Acos_x0020_refId: flowStatus.parseJson.result.Metadata.ReferenceId.Value
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
          type: "Søknad om støtte til kunstproduksjon", // Required. A short searchable type-name that distinguishes the statistic element
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
