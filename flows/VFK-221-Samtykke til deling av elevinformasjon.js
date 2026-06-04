const description = "Samtykke til deling av elevinformasjon"
const { schoolInfo } = require("../lib/data-sources/vfk-schools")
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

  syncElevmappe: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa
  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const samtykke =
          flowStatus.parseJson.result.DialogueInstance.Samtykke_til_deling.Tillatelse.Vi_trenger_ditt === "Jeg ønsker å gi samtykke til deling" ? "Samtykke gitt" : "Samtykke ikke gitt/trukket"
        const navn = `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`
        const school = schoolInfo.find((school) => school.orgNr.toString() === jsonData.SavedValues.Dataset.Ny_skole.Orgnr)
        if (!school) throw new Error(`Could not find any school with orgNr: ${jsonData.SavedValues.Dataset.Ny_skole.Orgnr}`)
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
            AccessCode: "13",
            AccessGroup: school.tilgangsgruppe,
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                Role: "Avsender",
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Samtykke til deling av elevopplysninger",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            ResponsibleEnterpriseNumber: jsonData.SavedValues.Dataset.Ny_skole.Orgnr,
            // ResponsiblePersonEmail: '',
            Status: "J",
            Title: `Samtykke til deling av elevopplysninger - ${samtykke}`,
            UnofficialTitle: `Samtykke til deling av elevopplysninger - ${samtykke} - ${navn}`,
            Archive: "Elevdokument",
            CaseNumber: elevmappe.CaseNumber
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Samtykke_til_deling.Opplysninger_om
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Samtykkeskjema%20elev/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/OPT-Lederevirksomheterogfylkesadministrasjonen/Lists/Samtykkeskjema%20elev/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Etternavn1,
              Fornavn: jsonData.Fornavn1,
              Skole: jsonData.Ny_skole,
              Samtykke_x0020_gitt: flowStatus.parseJson.result.DialogueInstance.Samtykke_til_deling.Tillatelse.Vi_trenger_ditt === "Jeg ønsker å gi samtykke til deling" ? "Ja" : "Nei"
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
          company: "Opplæring og tannhelse",
          department: "Kompetanse og pedagogisk utvikling",
          description, // Required. A description of what the statistic element represents
          type: "Samtykke til deling av elevinformasjon" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
