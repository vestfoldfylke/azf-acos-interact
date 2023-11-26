const { nodeEnv } = require('../config')
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
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '7',
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.orgNr.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: `Søknad ny lærebedrift ${xmlData.bedriftsnavn}`,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 7d',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            Status: 'J',
            Title: `Søknad ny lærebedrift ${xmlData.bedriftsnavn}`,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  }
}
