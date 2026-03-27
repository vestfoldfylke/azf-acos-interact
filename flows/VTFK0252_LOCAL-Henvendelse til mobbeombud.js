const description = "Arkivering av henvendelse til mobbeombud. Skal opprettes en ny sak pr skjema"
const { nodeEnv } = require("../config")

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
string SkoleNavn
string ElevNavn
string ElevFnr
string InnsenderFornavn
string InnsenderEtternavn
string InnsenderFnr
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.InnsenderFnr
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Title: "Elevsak",
            UnofficialTitle: `Elevsak - ${xmlData.SkoleNavn} - ${xmlData.ElevNavn}`,
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            AccessGroup: "Mobbeombud",
            JournalUnit: "Mobbeombud",
            SubArchive: "Mobbeombud",
            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "B08",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              },
              {
                ArchiveCode: "--",
                ArchiveType: "TILLEGGSKODE PRINSIPP",
                Sort: 3,
                IsManualText: true
              },
              {
                ArchiveCode: xmlData.ElevFnr,
                ArchiveType: "FNR",
                IsManualText: true,
                Sort: 4
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: xmlData.InnsenderFnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "235285" : "236911"
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, _attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        return {
          system: "acos",
          template: "mobbeombud-document",
          secure: true,
          parameter: {
            enterpriseRecno: nodeEnv === "production" ? "235285" : "236911",
            documentDate: new Date().toISOString(),
            caseNumber,
            base64,
            documentTitle: "Henvendelse til mobbeombud",
            innsenderSsn: xmlData.InnsenderFnr
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
          company: "HRMU",
          department: "Mestring og utvikling",
          description, // Required. A description of what the statistic element represents
          type: "Henvendelse til mobbeombud", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          skole: xmlData.SkoleNavn
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
