module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true
  },

  // sjekker om det finnes en skoleskyss-sak på arkivkode og tittel. Dersom ikke, oppretter den saken med metadata fra mapper. Saksnummer returneres uansett.
  handleCase: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: "20-15",
            Title: "En sakstittel",
            UnofficialTitle: "En sakstittel med noe snusk i seg som ikke skal vises til media",
            Status: "B",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Sakarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "035",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              }
            ],
            ResponsibleEnterpriseNumber: "45678912",
            ResponsiblePersonEmail: "fornavn.etternavn@domene.no",
            AccessGroup: "tilgangsgruppe"
          }
        }
      },

      getCaseParameter: (flowStatus) => {
        return {
          ArchiveCode: flowStatus.parseXml.archiveData.fnr, // check for exisiting case with this fnr and case name is Skoleskyss....
          Title: `Skoleskyss-${flowStatus.parseXml.archiveData.firstName} ${flowStatus.parseXml.archiveData.lastName}`
        }
      }
    }
  },

  // Arkiverer dokumentet i 360 (Her: elevmappa)
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const { nodeEnv, robotEmail } = require("../config")
        return {
          system: "acos",
          template: "elevdocument-default",
          parameter: {
            organizationNumber: xmlData.AnsVirksomhet,
            documentDate: new Date().toISOString(),
            caseNumber,
            studentName: `${xmlData.Fornavn} ${xmlData.Etternavn}`,
            responsibleEmail: nodeEnv === "production" ? xmlData.AnsEpost : robotEmail,
            accessGroup: xmlData.Tilgangsgruppe,
            studentSsn: xmlData.Fnr,
            base64,
            documentTitle: "Påmelding til nettundervisning",
            attachments
          }
        }
      }
    }
  }
}
