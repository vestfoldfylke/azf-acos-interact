const description = "Sender til elevmappe"
// const { nodeEnv } = require('../config')
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
        const school = schoolInfo.find((school) => school.orgNr.toString() === jsonData.SavedValues.Dataset.Skole.Orgnr)
        if (!school) throw new Error(`Could not find any school with orgNr: ${jsonData.SavedValues.Dataset.Skole.Orgnr}`)
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
                Title: "Vedlegg til søknader",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            ResponsibleEnterpriseNumber: school.orgNr,
            // ResponsiblePersonEmail: '',
            Status: "J",
            Title: "Vedlegg til søknader",
            UnofficialTitle: `Vedlegg til søknader i Visma in School - Vedlegget gjelder ${jsonData.DialogueInstance.Kontaktopplysni.Vedlegg_til_soknad_i_Vis.Vedlegget_gjelder}`,
            Archive: "Sensitivt elevdokument",
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

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "Opplæring og tannhelse",
          department: "",
          description,
          type: "Vedlegg til søknader", // Required. A short searchable type-name that distinguishes the statistic element
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
