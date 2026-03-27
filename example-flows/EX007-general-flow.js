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
          system: "acos",
          template: "create-test-case",
          parameter: {}
        }
      },
      getCaseParameter4: (_flowStatus) => {
        return {
          CaseNumber: "23/12345" // archive to this case only (case number defined here) (samlesak)
        }
      }
    }
  },
  archive: {
    // archive må kjøres for å kunne kjøre signOff og closeCase (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          system: "acos",
          template: "create-test-document",
          parameter: {
            ssn: flowStatus.parseXml.result.Fnr,
            caseNumber: flowStatus.caseHandler.result.CaseNumber,
            base64,
            attachments
          }
        }
      }
    }
  },
  signOff: {
    enabled: true
  },
  closeCase: {
    enabled: true
  }
}
