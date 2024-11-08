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
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
  ArchiveData {
    string fnr
    string skole
    string tilgangsgruppe
    string orgnr
    string navn
  }

  */

  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.fnr.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // const school = schoolInfo.find(school => xmlData.skole.startsWith(school.officeLocation))
        // if (!school) throw new Error(`Could not find any school with officeLocation: ${xmlData.skjemaInnsenderSkole}`)
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: '12-4 sak',
            Title: 'Kapittel 12-4 sak',
            UnofficialTitle: `Kapittel 12-4 sak - ${xmlData.navn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            // AccessGroup: school['9a4Tilgangsgruppe'], // 9a-4 tilgangsgruppe til den skolen det gjelder
            JournalUnit: 'Sentralarkiv',
            // SubArchive: '4',
            // Project: flowStatus.handleProject.result.ProjectNumber,
            ArchiveCodes: [
              {
                ArchiveCode: xmlData.fnr.replaceAll(' ', ''),
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
                ReferenceNumber: xmlData.fnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseNumber: xmlData.orgnr
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        let utfordring = ''
        if (xmlData.typeUtfordring === 'Utfordringer i fysisk skolemiljø') {
          utfordring = 'fysisk'
        } else if (xmlData.typeUtfordring === 'Utfordringer i psykososialt skolemiljø') {
          utfordring = 'psykososialt'
        } else if (xmlData.typeUtfordring === 'Utfordringer i både fysisk og psykososialt skolemiljø') {
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
                ReferenceNumber: xmlData.fnr,
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
            Title: `Melding om bekymring for skolemiljø kapittel 12 - ${xmlData.skole} - ${utfordring} skolemiljø`,
            // UnofficialTitle: `Varslingsskjema opplæringsloven 9A-4 - ${xmlData.krenketElevNavn}`,
            Archive: '12-4 dokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseNumber: xmlData.orgnr,
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OF',
          department: 'Pedagogisk støtte og utvikling',
          description,
          type: 'Melding om bekymring for skolemiljø kapittel 12', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          skole: xmlData.skole
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
