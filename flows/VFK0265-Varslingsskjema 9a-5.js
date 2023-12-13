// Dette skjemaet er ikke ferdig designet. Denne flow-filen er basert på A-4 og må oppdateres til A 5!!

const description = 'Arkivering av varsling ved brud på oppll. § 9 A-5. Skal opprettes en ny sak pr skjema'
// const { nodeEnv } = require('../config')
// const { getSchoolYear } = require('../lib/flow-helpers')
const { schoolInfo } = require('../lib/data-sources/vfk-schools')
module.exports = {
  config: {
    enabled: false,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
  ArchiveData {
    string skjemaInnsenderNavn
    string skjemaInnsenderEpost
    string skjemaInnsenderSkole
    string datoForVarsling
    string elevNavn
    string elevFnr
    string elevKlasse
    string ivolverte
    string informerte
    string hendelseBeskrivelse
    string handlingTidspunkt
    string fyltutAvVarsler
    string navnPaVarsler
}

  */

  // Arkivert som 9a-4 elvens navn
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.krenketElevFnr
        }
      }
    }
  },
  /*
  handleProject: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const school = schoolInfo.find(school => flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole.startsWith(school.officeLocation))
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          service: 'ProjectService',
          method: 'CreateProject',
          parameter: {
            Title: `§9A-4 sak - ${getSchoolYear()} - ${school.primaryLocation}`,
            Contacts: [
              {
                ReferenceNumber: school.orgNr,
                Role: 'Ansvarlig'
              }
            ],
            AccessGroup: school['9a4Tilgangsgruppe']
          }
        }
      },
      getProjectParameter: (flowStatus) => {
        const school = schoolInfo.find(school => flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole.startsWith(school.officeLocation))
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          Title: `§9A-4 - ${getSchoolYear()} - %`, // check for exisiting project with this title, '%' er wildcard når vi søker i 360 eller sif api.
          ContactReferenceNumber: school.orgNr,
          StatusCode: 'Under utføring'
        }
      }
    }
  }, */
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const school = schoolInfo.find(school => xmlData.skjemaInnsenderSkole.startsWith(school.officeLocation))
        if (!school) throw new Error(`Could not find any school with officeLocation: ${xmlData.skjemaInnsenderSkole}`)
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: '9A4-Sak',
            Title: 'Elevsak',
            UnofficialTitle: `§9A4-sak - ${xmlData.krenketElevNavn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            // AccessGroup: school['9a4Tilgangsgruppe'], // 9a-4 tilgangsgruppe til den skolen det gjelder
            JournalUnit: 'Sentralarkiv',
            SubArchive: '4',
            // Project: flowStatus.handleProject.result.ProjectNumber,
            ArchiveCodes: [
            //   {
            //     ArchiveCode: '---',
            //     ArchiveType: '',
            //     Sort: 1
            //   },
              {
                ArchiveCode: xmlData.krenketElevFnr,
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
                ArchiveCode: 'B39 - Elevforhold - Annet',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 3,
                IsManualText: true
              }
            ],
            Contacts: [
              {
                Role: 'Sakspart',
                ReferenceNumber: xmlData.krenketElevFnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseNumber: school.orgNr
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
        const school = schoolInfo.find(school => flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole.startsWith(school.officeLocation))
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          secure: true,
          parameter: {
            Category: 'Dokument inn',
            UnregisteredContacts: [
              {
                ContactName: `${xmlData.skjemaInnsenderNavn} (${xmlData.skjemaInnsenderEpost})`,
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
                Title: 'Varslingsskjema oppll. § 9A-4',
                VersionFormat: 'A'
              }
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Varsling',
            UnofficialTitle: 'Varslingsskjema § 9A-4',
            Archive: '9A4-dokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseNumber: school.orgNr,
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
          type: 'Varsling ved brudd på oppll. §9a-4', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          skole: xmlData.skjemaInnsenderSkole
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
