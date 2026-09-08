const description = "ny lokal inntaks- og formidlingsforskrift"
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
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om.Jeg_svarer_p\u00E5_vegne === "en organsiasjon"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
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
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200091" : "200148", // Seksjon Voksenopplæring og karriereutvikling - Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "charlotte.viksand.glad@vestfoldfylke.no" : "",
            Status: "J",
            AccessCode: "U",
            Title: "Høringssvar - Revidert forskrift om inntak til videregående opplæring og formidling til læreplass i Vestfold fylkeskommune",
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "26/12973" : "26/00104"
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Hringssvar%20lokal%20forskrift%20inntak%20og%20formidling%20til%20lreplass/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Hringssvar%20lokal%20forskrift%20inntak%20og%20formidling%20til%20lreplass/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber,
              Fornavn: jsonData.Informasjon_om.Innsender.Fornavn,
              Etternavn: jsonData.Informasjon_om.Innsender.Etternavn,
              Hvisvirksomhet: `${jsonData.Informasjon_om.Organisasjon.Navn_på_organisasjon ?? ""} - ${jsonData.Informasjon_om.Organisasjon.Organisasjonsnummer ?? ""}`,
              Innspilltils_x00f8_knadikapittel: jsonData.Ny_lokal_inntaks_.Kapittel_2___Inntak.Innspill_til___5_,
              Innspill_x00a7_8ikapittel2: jsonData.Ny_lokal_inntaks_.Kapittel_2___Inntak.Innspill_til___8_,
              Innspill_x0020__x00a7__x0020_9_x: jsonData.Ny_lokal_inntaks_.Kapittel_2___Inntak.Innspill_til__9_,
              Innspill_x00a7_9ikapittel2: jsonData.Ny_lokal_inntaks_.Kapittel_2___Inntak.Innspill_til___10_,
              Innspill_x0020__x00a7__x0020_11_: jsonData.Ny_lokal_inntaks_.Kapittel_2___Inntak.Innspill_til___11_,
              Innspilltil_x00a7_19ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til___19_,
              Innspilltil_x00a7_20ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til___20_,
              Innspillutg_x00e5_tt_x00a7_20kap: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til_utgått,
              Innspilltil_x00a7_21ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til___21_,
              Innspilltil_x00a7_22ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til___22_1,
              Innspillutg_x00e5_tt_x00a7_22kap: jsonData.Ny_lokal_inntaks_.Kapittel_3___Inntak.Innspill_til___22_,
              Innspilltil_x00a7_23ikapittel4: jsonData.Ny_lokal_inntaks_.Kapittel_4__.Innspill_til___23_,
              Innspilltil_x00a7_24ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_4__.Innspill_til___24_,
              Innspilltil_x00a7_25ikapittel3: jsonData.Ny_lokal_inntaks_.Kapittel_4__.Innspill_til___25_,
              Innspill_x0020__x00a7__x0020_26_: jsonData.Ny_lokal_inntaks_.Kapittel_4__.Innspill_til___26_,
              Innspill_x0020_til_x0020__x00a7_: jsonData.Ny_lokal_inntaks_.Kapittel_5___Felles.Innspill_til___31_,
              Innspill_x0020_til_x0020__x00a7_0: jsonData.Ny_lokal_inntaks_.Kapittel_5___Felles.Innspill_til___32_,
              Innspill_x0020_til_x0020__x00a7_1: jsonData.Ny_lokal_inntaks_.Kapittel_5___Felles.Innspill_til___33_,
              Andremerknader: jsonData.Ny_lokal_inntaks_.Andre_merknader_ved,
              Acosrefid: flowStatus.parseJson.result.Metadata.ReferenceId.Value
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
          type: "Høring - ny lokal inntaks- og formidlingsforskrift", // Required. A short searchable type-name that distinguishes the statistic element
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
