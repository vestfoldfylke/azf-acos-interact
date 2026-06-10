const description = "Innmelding av enkeltpersonfortak - yrkesskadeforsikring for YFF/utplassering"
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Innmelding.Opplysninger_om.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
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
                ReferenceNumber: jsonData.Innmelding.Opplysninger_om.Organisasjon.Organisasjonsnummer.replaceAll(" ", ""),
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
                Title: "Innmelding-yrkesskadeforsikring",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Innmelding av enkeltpersonfortak - yrkesskadeforsikring for YFF/Utplassering",
            // UnofficialTitle: '',
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? "25/04673" : "25/00008",
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200107' : '200016', // Seksjon Virksomhetsstyring Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === "production" ? "anna.karpych@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/innsida-personaloglonn/Lists/Medforsikrede%20enkeltpersonforetak/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/innsida-personaloglonn/Lists/Medforsikrede%20enkeltpersonforetak/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Innmelding.Opplysninger_om.Organisasjon.Organisasjonsnavn, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: jsonData.Innmelding.Opplysninger_om.Organisasjon.Organisasjonsnummer,
              Navnp_x00e5_innsender: `${jsonData.Innmelding.Innsender.Fornavn1} ${jsonData.Innmelding.Innsender.Etternavn1}`,
              E_x002d_postinnsender: jsonData.Innmelding.Innsender.E_post || "Mangler epost",
              Mobilinnsender: jsonData.Innmelding.Innsender.Telefon1 || "Mangler mobilnummer",
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
          company: "Organisasjon",
          department: "Økonomi",
          description, // Required. A description of what the statistic element represents
          type: "Innmelding av enkeltpersonfortak - yrkesskadeforsikring for YFF/utplassering", // Required. A short searchable type-name that distinguishes the statistic element
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
