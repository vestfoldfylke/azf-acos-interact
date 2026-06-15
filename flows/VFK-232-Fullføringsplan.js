const description = "Sender til elevmappe"
const { schoolInfo } = require("../lib/data-sources/vfk-schools")
// const { nodeEnv } = require('../config')

// Enkelt rammeverk for mapping av lange typetekster til kortere navn.
// Bytt ut/legg til nøkler her ved behov.
const TYPE_TO_VALG_MAP = {
  "Skrive seg ut av fag for å ta faget som privatist (her kreves dokumentasjon av tungtveiende grunner og det skal skrives et enkeltvedtak i tillegg)": "Ta fag som privatist",
  "Skrive seg ut av fag for å ta omvalg": "Omvalg",
  "Bruke lenger tid enn normert på trinnet (inkludert særskilt språkopplæring)": "Ut over normert tid",
  "1 eller IV - hvordan bestå fag når eleven er tatt inn på neste nivå med 1 eller IV (NUS, privatist, Mer opplæring)": "1 og IV",
  "Endre opplæringsarena og fortsette opplæringen på VeiVis opplæring (krever et enkeltvedtak i tillegg).": "VeiVis OT",
  "Justere opplæringen på VeiVis eller endre opplæringen tilbake til skole": "Justert fullføringsplan eller plan for tilbakeføring",
  "Skrive seg ut av alle fag og følges opp av VeiVis OT": "VeiVis OT",
  "Skrive seg ut av skolen uten ønske om videre oppfølging av VeiVis OT (erstatter avklaringsskjema)": "Avbrudd uten oppfølging på VeiVis OT",
  "Skrive seg ut av skolen for å ta opplæringen i bedrift (erstatter avklaringsskjema)": "Opplæring i bedrift",
  "Skrive seg ut av fag for å kombinere opplæring i skole og opplæring i bedrift": "Kombinasjon skole og bedrift",
  "Slutte i kroppsøving Vg1 fordi faget allerede er bestått med termin to karakter på Vg1. ": "Slutte i kroppsøving",
  "Slutte i YFF for å ta privatisteksamen i programfag/morsmål. (Dette gjelder for elever som skal gå påbygg 3 eller HO 3-årig løp eller ta omvalg).": "Slutte i YFF",
  "Endre skole eller endre utdanningsprogram (erstatter avklaringsskjema)": "Endre skole eller utdanningsprogram"
}

const mapTypeToValg = (typeText) => {
  if (!typeText) throw new Error("Mangler verdi for typefeltet 'Hva_skal_det_lages'")
  const mappedValue = TYPE_TO_VALG_MAP[typeText]
  if (!mappedValue) throw new Error(`Fant ikke type i mappingtabellen: ${typeText}`)
  return mappedValue
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

  // Synkroniser elevmappe
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
          // ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
          ssn: flowStatus.parseJson.result.SavedValues.Integration.Hent_elever__display_name_.Users.ssn
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
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const school = schoolInfo.find((school) => school.companyName === flowStatus.parseJson.result.SavedValues.Integration.Hent_elever__display_name_.Users.companyName)
        if (!school) throw new Error(`Could not find any school with name: ${flowStatus.parseJson.result.SavedValues.Integration.Hent_elever__display_name_.Users.companyName}`)
        const valg = mapTypeToValg(flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Hva_skal_det_lages.Velg_)

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
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Integration.Hent_elever__display_name_.Users.ssn,
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
                Title: `Fullføringsplan - ${valg}`,
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            ResponsibleEnterpriseNumber: school.orgNr,
            // ResponsiblePersonEmail: '',
            Status: "J",
            Title: `Fullføringsplan - ${valg}`,
            UnofficialTitle: `Fullføringsplan - ${valg} - ${flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Elev.Fornavn} ${flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Elev.Etternavn}`,
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
          department: "Seksjon kompetanse og pedagogisk utvikling",
          description,
          type: "Fullføringsplan", // Required. A short searchable type-name that distinguishes the statistic element
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
