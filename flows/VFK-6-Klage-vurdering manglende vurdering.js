const description = "Sender til elevmappe"
const { nodeEnv } = require("../config")
const title = "Klage - vurdering/manglende vurdering"
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
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
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
        const p360Attachments = attachments.map((att) => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: "F",
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        const documentData = {
          service: "DocumentService",
          method: "CreateDocument",
          parameter: {
            AccessCode: "13",
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: jsonData.SavedValues.Login.UserID,
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
                Title: title,
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            Status: "J",
            Title: title,
            // UnofficialTitle: '',
            Archive: "Elevdokument",
            CaseNumber: elevmappe.CaseNumber
          }
        }

        if (jsonData.DialogueInstance.Informasjon_om_klager.Utfyller.Hvem_fyller_ut_ === "Elev" || jsonData.DialogueInstance.Informasjon_om_klager.Utfyller.Hvem_fyller_ut_ === "Foresatt") {
          const school = schoolInfo.find((school) => school.orgNr.toString() === jsonData.SavedValues.Dataset.Velg_skole.Orgnr)
          if (!school) throw new Error(`Could not find any school with orgNr: ${jsonData.SavedValues.Dataset.Velg_skole.Orgnr}`)
          documentData.parameter.ResponsibleEnterpriseNumber = jsonData.SavedValues.Dataset.Velg_skole.Orgnr
          documentData.parameter.AccessGroup = school.tilgangsgruppe
        } else if (jsonData.DialogueInstance.Informasjon_om_klager.Utfyller.Hvem_fyller_ut_ === "Voksen") {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === "production" ? "200037" : "200045" // Kompetansebyggeren // denne er ikke verifisert
          documentData.parameter.AccessGroup = "Elev Kompetansebyggeren"
        } else {
          throw new Error('Fikk ukjent verdi inn i Utfyller fra skjemaets json-fil. Trenger "Elev", "Foresatt" eller "Voksen (Kompetansebyggeren)"')
        }
        console.log(documentData)
        return documentData
      }
    }
  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring",
          department: "FAGOPPLÆRING",
          description,
          type: title, // Required. A short searchable type-name that distinguishes the statistic element
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
