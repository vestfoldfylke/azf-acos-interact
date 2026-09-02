const description = "Svar på høring - Ordensregler for voksne"
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
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Jeg_svarer_p\u00E5_vegne === "meg selv"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
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
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Jeg_svarer_p\u00E5_vegne !== "meg selv"
      },
      mapper: (flowStatus) => {
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
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
                ReferenceNumber:
                  jsonData.DialogueInstance.Informasjon_om.Jeg_svarer_p\u00E5_vegne === "meg selv"
                    ? jsonData.SavedValues.Login.UserID
                    : jsonData.DialogueInstance.Informasjon_om.Organisasjon.Organisasjonsnummer.replaceAll(" ", ""), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: "Høringssvar",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "262217" : "200736", // Seksjon skoleutvikling og eksamen - Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "karen.anne.kjendlie@vestfoldfylke.no" : "",
            Status: "J",
            AccessCode: "U",
            Title: "Høringsinnspill - Regional plan for opplæring 2027-2040",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/12652" : "26/00103"
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Regional_plan_for
        return [
          {
            testListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/Regionalplanvideregendeopplring-Vestfoldskolen/Lists/Hringssvar%20%20Regional%20plan%20for%20opplring%20med%20handlingsprogram/AllItems.aspx",
            prodListUrl:
              "https://vestfoldfylke.sharepoint.com/sites/Regionalplanvideregendeopplring-Vestfoldskolen/Lists/Hringssvar%20%20Regional%20plan%20for%20opplring%20med%20handlingsprogram/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Innsender.Fornavn1 ?? ""} ${flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Innsender.Etternavn1 ?? ""}`,
              Svarer_x0020_p_x00e5__x0020_vegn: flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Jeg_svarer_på_vegne,
              Navn_x0020_p_x00e5__x0020_organi: `${flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Organisasjon.Navn_på_organisasjon ?? ""} - ${flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Organisasjon.Organisasjonsnummer ?? ""}`,
              Kap_x002e__x0020_2_x0020_innledn: jsonData.Innspill_til,
              Kap_x002e__x0020_3_x0020_Kunnska: jsonData.Innspill_til1,
              Kap_x002e__x0020_4_x0020_Kvalite: jsonData.Innspill_til2,
              Kap_x002e__x0020_5_x0020_M_x00e5: jsonData.Innspill_til3,
              Kap_x002e__x0020_6_x0020_Gjennom: jsonData.Innspill_til4,
              Kap_x002e__x0020_7_x0020_Inklude: jsonData.Innspill_til5,
              Kap_x002e__x0020_8_x0020_Profesj: jsonData.Innspill_til6,
              Kap_x002e__x0020_9_x0020_Samhand: jsonData.Innspill_til7,
              Kap_x002e__x0020_10_x0020_Fra_x0: jsonData.Innspill_til8,
              Oppf_x00f8_lging_x0020_av_x0020_: flowStatus.parseJson.result.DialogueInstance.Handlingsprogram.Innspill_til9,
              Handlinger: flowStatus.parseJson.result.DialogueInstance.Handlingsprogram.Innspill_til10,
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring og tannhelse",
          department: "Seksjon Voksenopplæring og karriereutvikling",
          description,
          type: "Svar på høring - Ordensregler for voksne", // Required. A short searchable type-name that distinguishes the statistic element
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
