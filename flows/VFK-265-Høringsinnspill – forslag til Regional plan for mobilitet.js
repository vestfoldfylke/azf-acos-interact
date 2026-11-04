const description = "Høringsinnspill – forslag til Regional plan for mobilitet"
const { nodeEnv } = require("../config")

const erPrivatperson = (flowStatus) => flowStatus.parseJson.result.DialogueInstance.Om_innsender.Sender_du_innspillet === "Som privatperson"

const getAvsenderNavn = (flowStatus) => {
  const omInnsender = flowStatus.parseJson.result.DialogueInstance.Om_innsender
  return erPrivatperson(flowStatus) ? `${omInnsender.Innsender.Fornavn} ${omInnsender.Innsender.Etternavn}` : omInnsender.Organisasjon.Organisasjonsnavn
}

// Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
const getAvsenderReferanse = (flowStatus) => {
  const jsonData = flowStatus.parseJson.result
  return erPrivatperson(flowStatus) ? jsonData.SavedValues.Login.UserID : jsonData.DialogueInstance.Om_innsender.Organisasjon.Organisasjonsnummer.replaceAll(" ", "")
}

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
        return erPrivatperson(flowStatus)
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        return {
          ssn: getAvsenderReferanse(flowStatus)
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return !erPrivatperson(flowStatus)
      },
      mapper: (flowStatus) => {
        return {
          orgnr: getAvsenderReferanse(flowStatus)
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
            Title: `Høringsinnspill - Forslag til Regional plan for mobilitet - ${getAvsenderNavn(flowStatus)}`,
            Status: "B",
            AccessCode: "U",
            JournalUnit: "Sentralarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "121",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "--",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              },
              {
                ArchiveCode: "&13",
                ArchiveType: "TILLEGGSKODE PRINSIPP",
                Sort: 3
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: getAvsenderReferanse(flowStatus),
                IsUnofficial: false
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200094" : "200150", // Team infrastruktur
            ResponsiblePersonEmail: nodeEnv === "production" ? "henriette.auensen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            AccessGroup: "",
            Project: nodeEnv === "production" ? "25-136" : "26-11"
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
            Category: "Dokument inn",
            Contacts: [
              {
                Role: "Avsender",
                ReferenceNumber: getAvsenderReferanse(flowStatus),
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
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200094" : "200150", // Team infrastruktur
            ResponsiblePersonEmail: nodeEnv === "production" ? "henriette.auensen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            Status: "J",
            AccessCode: "U",
            Title: "Høringsinnspill - Forslag til Regional plan for mobilitet",
            Archive: "Saksdokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber
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
          company: "Samferdsel",
          department: "Infrastruktur og veiforvaltning",
          description,
          type: "Høringsinnspill - Forslag til Regional plan for mobilitet", // Required. A short searchable type-name that distinguishes the statistic element
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
