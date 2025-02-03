const description = 'Arkivering av varsling ved brud på oppll. § 9 A-5 til skolen sitt 9 A-5 prosjekt. Skal opprettes en ny sak pr skjema - ikke i bruk'
// const { nodeEnv } = require('../config')
const { getSchoolYear } = require('../lib/flow-helpers')
const { schoolInfo } = require('../lib/data-sources/vtfk-schools')
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
    string skjemaInnsenderNavn
    string skjemaInnsenderEpost
    string skjemaInnsenderSkole
    string datoForVarsling
    string krenketElevNavn
    string krenketElevFnr
    string krenketElevKlasse
    string ivolverte
    string informerte
    string epostRektor
    string epostAvdLeder
    string epostAvdLederSkjult
    string typeVold
    string typeTrakassering
    string typeMobbing
    string typeDiskriminering
    string typeDigiKrenkelser
    string typeAnnet
    string hendelseBeskrivelse
    string handlingBeskrivelse
    string tqmVarsling
    string fyltutAvVarsler
    string navnPaVarsler
  }

  */

  // Arkivert som 9a-5 elvens navn
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

  handleProject: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const school = schoolInfo.find(school => school.officeLocation === flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole)
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          service: 'ProjectService',
          method: 'CreateProject',
          parameter: {
            Title: `§9A-5 - ${getSchoolYear()} - ${school.officeLocation}`,
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
        const school = schoolInfo.find(school => school.officeLocation === flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole)
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          Title: `§9A-5 - ${getSchoolYear()} - %`, // check for exisiting project with this title, '%' er wildcard når vi søker i 360 eller sif api.
          ContactReferenceNumber: school.orgNr,
          StatusCode: 'Under utføring'
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const school = schoolInfo.find(school => school.officeLocation === xmlData.skjemaInnsenderSkole)
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Title: '§9a-5 sak',
            UnofficialTitle: `§9a-5 sak - ${xmlData.krenketElevNavn}`,
            Status: 'B',
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            AccessGroup: school['9a5Tilgangsgruppe'], // 9a-5 tilgangsgruppe til den skolen det gjelder
            JournalUnit: 'Sentralarkiv',
            SubArchive: '4',
            Project: flowStatus.handleProject.result.ProjectNumber,
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
                ArchiveCode: 'B31',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
              //   {
              //     ArchiveCode: '--',
              //     ArchiveType: 'TILLEGGSKODE PRINSIPP',
              //     Sort: 3,
              //     IsManualText: true
              //   },
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
        const school = schoolInfo.find(school => school.officeLocation === xmlData.skjemaInnsenderSkole)
        if (!school) throw new Error(`Could not find any school with officeLocation: ${flowStatus.parseXml.result.ArchiveData.skjemaInnsenderSkole}`)
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          secure: true,
          parameter: {
            Category: 'Internt notat / e-post MED oppfølging',
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
                Title: 'Varslingsskjema oppll. § 9A-5',
                VersionFormat: 'A'
              }
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: '§9a-5 sak',
            UnofficialTitle: 'Varslingsskjema oppll. § 9A-5',
            Archive: 'Personsensitivt dokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseNumber: school.orgNr,
            AccessCode: '13',
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            AccessGroup: school['9a4Tilgangsgruppe']
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
          type: 'Varsling ved brudd på oppll. §9a-5', // Required. A short searchable type-name that distinguishes the statistic element
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
