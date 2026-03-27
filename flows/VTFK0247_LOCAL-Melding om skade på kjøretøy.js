const description = "Melding om skade på kjøretøy. Skal opprettes en ny sak pr skjema"
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
string Fnr
string Fornavn
string Etternavn
string Adresse
string Postnr
string Poststed
string Mobilnr
string Epost
string AnsVirksomhet // not in use
string AnsEpost // not in use
string Tilgangsgruppe // not in use
string Tittel // not in use
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
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
            Title: "Melding om skade på kjøretøy",
            Status: "B",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.2",
            AccessGroup: "Drift og vedlikehold",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Sakarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "271",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "Q13",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            Contacts: [
              {
                Role: "Sakspart",
                ReferenceNumber: xmlData.Fnr,
                IsUnofficial: true
              }
            ],
            ResponsibleEnterpriseNumber: nodeEnv === "production" ? "70300" : "70300"
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
          parameter: {
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
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
                Title: "Skade på kjøretøy",
                VersionFormat: "A"
              }
            ],
            Status: "J",
            DocumentDate: new Date().toISOString(),
            Title: "Skade på kjøretøy",
            UnofficialTitle: "Skade på kjøretøy",
            Archive: "Saksdokument",
            CaseNumber: caseNumber,
            ResponsibleEnterpriseNumber: nodeEnv === "production" ? "70300" : "70300",
            AccessCode: "13",
            Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.2",
            AccessGroup: "Drift og vedlikehold"
          }
        }
        /*
        return {
          system: 'acos',
          template: 'skade-på-kjøretøy-document',
          secure: false,
          parameter: {
            enterpriseRecno: nodeEnv === 'production' ? '200009' : '200009',
            documentDate: new Date().toISOString(),
            caseNumber,
            base64,
            ssn: xmlData.Fnr
          }
        }
        */
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
          company: "SMM",
          department: "Drift og vedlikehold",
          description, // Required. A description of what the statistic element represents
          type: "Skade på kjøretøy", // Required. A short searchable type-name that distinguishes the statistic element
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
