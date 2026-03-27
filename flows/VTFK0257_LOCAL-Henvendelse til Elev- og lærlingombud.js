const description = "Arkivering av henvendelse til Elev- og lærlingeombud. Skal opprettes en ny sak pr skjema"
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
            UnofficialTitle: `Elevsak - ${xmlData.InnsenderFornavn} ${xmlData.InnsenderEtternavn}`,
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            AccessGroup: "Elev- og lærlingombud",
            JournalUnit: "Elev- og lærlingombud",
            SubArchive: "Elev- og lærlingombud",
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
                ArchiveCode: "16077939907",
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
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "235284" : "236910"
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
          service: "DocumentService",
          method: "CreateDocument",
          secure: true,
          parameter: {
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: xmlData.InnsenderFnr,
                Role: "Avsender",
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Henvendelse til elev- og lærlingombud",
                VersionFormat: "A"
              }
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Henvendelse til elev- og lærlingombud",
            UnofficialTitle: "Henvendelse til elev- og lærlingombud",
            Archive: "Personsensitivt dokument",
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === "production" ? "235284" : "236910",
            documentDate: new Date().toISOString(),
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
            AccessGroup: "Elev- og lærlingombud"
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
          company: "HRMU",
          department: "Mestring og utvikling",
          description, // Required. A description of what the statistic element represents
          type: "Henvendelse til elev- og lærlingombud", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
