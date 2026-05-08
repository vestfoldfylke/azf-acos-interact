const description = "Melding om opplæringsbehov for barn og unge i barnevernsinstitusjoner"
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
        let orgnr = ""
        if (flowStatus.parseJson.result.DialogueInstance.Melding_om_flyt.Selections2 === "Flytte til institusjon") {
          orgnr = flowStatus.parseJson.result.SavedValues.Dataset.Barnevernsinsti.Orgnr.replaceAll(" ", "")
        } else if (flowStatus.parseJson.result.DialogueInstance.Melding_om_flyt.Selections2 === "Flytte fra institusjon") {
          orgnr = flowStatus.parseJson.result.SavedValues.Dataset.Barnevernsinsti1.Orgnr.replaceAll(" ", "")
        }
        return {
          orgnr: orgnr
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      getCaseParameter: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let elevNavn = ""
        if (jsonData.Melding_om_flyt.Selections2 === "Flytte til institusjon") {
          elevNavn = `${jsonData.Personopplysninger.Informasjon_om_3.Fornavn2} ${jsonData.Personopplysninger.Informasjon_om_3.Etternavn3}`
        } else if (jsonData.Melding_om_flyt.Selections2 === "Flytte fra institusjon") {
          elevNavn = `${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Fornavn4} ${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Etternavn5}`
        }
        return {
          UnofficialTitle: `Opplæring i barnevernsinstitusjon - ${elevNavn}` // check for exisiting case with this title
        }
      },
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let elevNavn = ""
        let fnr = ""
        if (jsonData.Melding_om_flyt.Selections2 === "Flytte til institusjon") {
          elevNavn = `${jsonData.Personopplysninger.Informasjon_om_3.Fornavn2} ${jsonData.Personopplysninger.Informasjon_om_3.Etternavn3}`
          fnr = jsonData.Personopplysninger.Informasjon_om_3.Fødselsnummer1.replaceAll(" ", "")
        } else if (jsonData.Melding_om_flyt.Selections2 === "Flytte fra institusjon") {
          elevNavn = `${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Fornavn4} ${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Etternavn5}`
          fnr = jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Fødselsnummer2.replaceAll(" ", "")
        }
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Elev",
            Title: "Opplæring i barnevernsinstitusjon",
            UnofficialTitle: `Opplæring i barnevernsinstitusjon - ${elevNavn}`,
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            AccessGroup: "Opplæring barnevernsinstitusjon",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Elev",
            ArchiveCodes: [
              {
                ArchiveCode: fnr,
                ArchiveType: "FNR",
                Sort: 1,
                IsManualText: true
              },
              {
                ArchiveCode: "B31",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: fnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200017" : "200020" // Seksjon Kompetanse og pedagogisk utvikling
          }
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, _attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let tittel = ""
        let elevNavn = ""
        if (jsonData.Melding_om_flyt.Selections2 === "Flytte til institusjon") {
          tittel = "Melding om plassering i barnevernsinstitusjon"
          elevNavn = `${jsonData.Personopplysninger.Informasjon_om_3.Fornavn2} ${jsonData.Personopplysninger.Informasjon_om_3.Etternavn3}`
        } else if (jsonData.Melding_om_flyt.Selections2 === "Flytte fra institusjon") {
          tittel = "Flyttemelding - Utmelding"
          elevNavn = `${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Fornavn4} ${jsonData.Melding_ved.Personopplysninger.Informasjon_om_5.Etternavn5}`
        }
        return {
          service: "DocumentService",
          method: "CreateDocument",
          secure: true,
          parameter: {
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.syncEnterprise.result.repackedEnterprise.EnterpriseNumber,
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
                Title: tittel,
                VersionFormat: "A"
              }
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: tittel,
            UnofficialTitle: `${tittel} - ${elevNavn}`,
            Archive: "Sensitivt elevdokument",
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "200017" : "200020", // Seksjon Kompetanse og pedagogisk utvikling
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            AccessGroup: "Opplæring barnevernsinstitusjon"
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
      mapper: () => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "OF",
          department: "Pedagogisk støtte og utvikling",
          description,
          type: "Melding om opplæringsbehov for barn og unge i barnevernsinstitusjoner" // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
