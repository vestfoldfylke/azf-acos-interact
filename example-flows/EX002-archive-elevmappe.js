module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true
  },
  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr,
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },

  // Arkiverer dokumentet i 360 (Her: elevmappa)
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const { nodeEnv, robotEmail } = require('../config')
        return {
          system: 'acos',
          template: 'elevdocument-default',
          parameter: {
            organizationNumber: xmlData.AnsVirksomhet,
            documentDate: new Date().toISOString(),
            caseNumber: elevmappe.CaseNumber,
            studentName: `${xmlData.Fornavn} ${xmlData.Etternavn}`,
            responsibleEmail: nodeEnv === 'production' ? xmlData.AnsEpost : robotEmail,
            accessGroup: xmlData.Tilgangsgruppe,
            studentSsn: xmlData.Fnr,
            base64,
            documentTitle: 'Påmelding til nettundervisning',
            attachments
          }
        }
      }
    }
  }
}
