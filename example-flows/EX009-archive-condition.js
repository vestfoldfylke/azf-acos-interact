module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  // MERK: condtion-function kan brukes på alle jobber!
  // Synkroniser elevmappe dersom condition returnerer true
  syncElevmappe: {
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === "true"
      },
      mapper: (flowStatus) => {
        // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa dersom condition returnerer true
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      condition: (flowStatus) => {
        // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === "true"
      },
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        return {
          system: "acos",
          template: "elevdocument-default",
          parameter: {
            organizationNumber: xmlData.AnsVirksomhet,
            documentDate: new Date().toISOString(),
            caseNumber: elevmappe.CaseNumber,
            studentName: `${xmlData.Fornavn} ${xmlData.Etternavn}`,
            responsibleEmail: "",
            accessGroup: xmlData.Tilgangsgruppe,
            studentSsn: xmlData.Fnr,
            base64,
            documentTitle: "Bestilling av dokumentasjon for privatister",
            attachments
          }
        }
      }
    }
  }
}
