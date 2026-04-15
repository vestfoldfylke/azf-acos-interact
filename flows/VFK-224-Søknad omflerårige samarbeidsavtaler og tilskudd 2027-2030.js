const description = "Søknad om flerårige samarbeidsavtaler og tilskudd 2027-2030"
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

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_søker.Søker.Organisasjon1.Organisasjonsnummer1.replaceAll(" ", "")
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let fag
        let responsibleEmail
        if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Idrett / friluftsliv") {
          fag = "Idrett og friluftsliv"
          responsibleEmail = nodeEnv === "production" ? "baard.andresen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no"
        } else if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Kunst / kultur") {
          fag = "Kultur"
          responsibleEmail = nodeEnv === "production" ? "yvonne.pleym@vestfoldfylke.no" : "stine.m.hauge@vestfoldfylke.no"
        } else if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Kulturarv") {
          fag = "Kulturarv"
          responsibleEmail = nodeEnv === "production" ? "eira.bjorvik@vestfoldfylke.no" : "nils.thvedt@vestfoldfylke.no"
        } else {
          throw new Error("Ukjent fagområde")
        }
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: nodeEnv === "production" ? "26-135" : "26-8",
            Title: `Flerårige samarbeidsavtaler - ${fag}`,
            // UnofficialTitle: ,
            Status: "B",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Sakarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "C00",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              },
              {
                ArchiveCode: "&10",
                ArchiveType: "TILLEGGSKODE PRINSIPP",
                Sort: 3,
                IsManualText: true
              }
            ],
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: responsibleEmail,
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let fag
        let responsibleEmail
        if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Idrett / friluftsliv") {
          fag = "Idrett og friluftsliv"
          responsibleEmail = nodeEnv === "production" ? "baard.andresen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no"
        } else if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Kunst / kultur") {
          fag = "Kultur"
          responsibleEmail = nodeEnv === "production" ? "yvonne.pleym@vestfoldfylke.no" : "stine.m.hauge@vestfoldfylke.no"
        } else if (jsonData.Søknad.Kategori__fagområde.Velg_fagområde === "Kulturarv") {
          fag = "Kulturarv"
          responsibleEmail = nodeEnv === "production" ? "eira.bjorvik@vestfoldfylke.no" : "nils.thvedt@vestfoldfylke.no"
        } else {
          throw new Error("Ukjent fagområde")
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
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_søker.Søker.Organisasjon1.Organisasjonsnummer1.replaceAll(" ", ""),
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
                Title: `Søknad om flerårig samarbeidsavtale`,
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            // Project: nodeEnv === 'production' ? : '25-4'
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om flerårig samarbeidsavtale - ${fag}`,
            // UnofficialTitle: '',
            Archive: "Saksdokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: responsibleEmail,
            AccessCode: "U"
            // Paragraph: 'Offl. § 26 femte ledd',
            // AccessGroup: 'Seksjon Kulturarv'
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/flerrige%20samarbeidsavtaler%20og%20tilskudd%2020272030/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/flerrige%20samarbeidsavtaler%20og%20tilskudd%2020272030/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_søker.Søker.Organisasjon1.Organisasjonsnavn1,
              Kontaktperson: `${jsonData.Informasjon_om_søker.Kontaktperson.Fornavn1} ${jsonData.Informasjon_om_søker.Kontaktperson.Etternavn1}`,
              Kontaktperson_x0020_tlf: jsonData.Informasjon_om_søker.Kontaktperson.Telefon1,
              Kontaktperson_x0020_e_x002d_post: jsonData.Informasjon_om_søker.Kontaktperson.E_post,
              Kategori: jsonData.Søknad.Kategori__fagområde.Velg_aktuell,
              Fagomr_x00e5_de: jsonData.Søknad.Kategori__fagområde.Velg_fagområde,
              Organisasjonsform: jsonData.Søknad.Kategori__fagområde.Gi_en_kort,
              Rolle_x0020_og_x0020_funksjon: jsonData.Søknad.Regional.Beskriv,
              Strategim_x00e5_l: jsonData.Søknad.Plan_og_strategi.Beskriv_kort_på,
              S_x00f8_knadsbel_x00f8_p: jsonData.Økonomi.Oppgi_årlig,
              Kommentar: jsonData.Økonomi.Legg_inn_relevante,
              Acos_x0020_Refid: flowStatus.parseJson.result.Metadata.ReferenceId.Value,
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
          company: "Samfunnsutvikling",
          department: "Kultur",
          description, // Required. A description of what the statistic element represents
          type: "Søknad om flerårige samarbeidsavtaler og tilskudd 2027-2030", // Required. A short searchable type-name that distinguishes the statistic element
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
