const description = 'Melding om bekymring for skolemiljø kapittel 12'
// const { nodeEnv } = require('../config')
// const { getSchoolYear } = require('../lib/flow-helpers')
// const { schoolInfo } = require('../lib/data-sources/vfk-schools')
// const { nodeEnv } = require('../config')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result
        // const school = schoolInfo.find(school => xmlData.skole.startsWith(school.officeLocation))
        // if (!school) throw new Error(`Could not find any school with officeLocation: ${xmlData.skjemaInnsenderSkole}`)
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: '12-4 sak',
            Title: 'Kapittel 12-4 sak',
            UnofficialTitle: `Kapittel 12-4 sak - ${jsonData.DialogueInstance.Informasjon_om_deg_som_m.Personalia.Fornavn} ${jsonData.DialogueInstance.Informasjon_om_deg_som_m.Personalia.Etternavn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            // AccessGroup: school['9a4Tilgangsgruppe'], // 9a-4 tilgangsgruppe til den skolen det gjelder
            JournalUnit: 'Sentralarkiv',
            // SubArchive: '4',
            // Project: flowStatus.handleProject.result.ProjectNumber,
            ArchiveCodes: [
              {
                ArchiveCode: flowStatus.parseJson.result.SavedValues.Login.UserID.replaceAll(' ', ''),
                ArchiveType: 'FNR',
                IsManualText: true,
                Sort: 1
              },
              {
                ArchiveCode: '---',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 2
              },
              {
                ArchiveCode: 'B08 - Skolemiljø',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 3,
                IsManualText: true
              }
            ],
            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID.replaceAll(' ', ''),
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseNumber: jsonData.SavedValues.Dataset.Hvilke_skole_2.Orgnr
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        let utfordring = ''
        if (jsonData.DialogueInstance.Beskrivelse_av_hva_du_me.Hva_melder_du_ifra_om_.Type_utfordring === 'Utfordringer i fysisk skolemiljø') {
          utfordring = 'fysisk'
        } else if (jsonData.DialogueInstance.Beskrivelse_av_hva_du_me.Hva_melder_du_ifra_om_.Type_utfordring === 'Utfordringer i psykososialt skolemiljø') {
          utfordring = 'psykososialt'
        } else if (jsonData.DialogueInstance.Beskrivelse_av_hva_du_me.Hva_melder_du_ifra_om_.Type_utfordring === 'Utfordringer i både fysisk og psykososialt skolemiljø') {
          utfordring = 'både fysisk og psykososialt'
        }
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          secure: true,
          parameter: {
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Melding om bekymring for skolemiljø kapittel 12',
                VersionFormat: 'A'
              }
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Melding om bekymring for skolemiljø kapittel 12 - ${flowStatus.parseJson.result.SavedValues.Dataset.Hvilke_skole_2.Skole} - ${utfordring} skolemiljø`,
            // UnofficialTitle: `Varslingsskjema opplæringsloven 9A-4 - ${xmlData.krenketElevNavn}`,
            Archive: '12-4 dokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseNumber: jsonData.SavedValues.Dataset.Hvilke_skole_2.Orgnr,
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1'
            // AccessGroup: school['9a4Tilgangsgruppe'] // Trenger ikke denne, står "Automatisk i excel?"
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OF',
          department: 'Pedagogisk støtte og utvikling',
          description,
          type: 'Melding om bekymring for skolemiljø kapittel 12', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          skole: flowStatus.parseJson.result.SavedValues.Dataset.Hvilke_skole_2.Skole
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
