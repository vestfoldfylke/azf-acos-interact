module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {}
  },
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
          Title: `Selfangst-${flowStatus.parseXml.archiveData.lastName}` // check for exisiting case with this title
        }
      },
      getCaseParameter2: (flowStatus) => {
        return {
          ExternalId: flowStatus.parseXml.archiveData.guid // check for exisiting case with external ID
        }
      },
      getCaseParameter3: (flowStatus) => {
        return {
          ArchiveCode: flowStatus.parseXml.archiveData.fnr, // check for exisiting case with this fnr and case name is Skoleskyss....
          Title: `Skoleskyss-${flowStatus.parseXml.archiveData.firstName} ${flowStatus.parseXml.archiveData.lastName}`
        }
      },
      getCaseParameter4: (_flowStatus) => {
        return {
          CaseNumber: "23/12345" // archive to this case only (case number defined here) (samlesak)
        }
      },
      getCaseParameter5: (flowStatus) => {
        return {
          CaseNumber: flowStatus.parseXml.archiveData.caseNumber // archive to this case only (case number from Acos XML) (samlesak)
        }
      }
    }
  }
}
