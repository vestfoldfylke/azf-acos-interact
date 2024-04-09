const description = 'Svar på høring – Skoleregler for elever ved de videregående skolene i Vestfold'
const { nodeEnv } = require('../config')

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
  string Orgnr
  string Saksnummer
  string DokTittel
  string AnsVirksomhet
  string AnsEpost
  string Tilgangsgruppe
  string Egendefinert1
  string Egendefinert2
  string Egendefinert3
}

}

  */
  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
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
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: xmlData.Fnr,
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Svar på høring – Skoleregler for elever ved de videregående skolene i Vestfold',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200017' : '200020', // Seksjon Kompetanse og pedagogisk utvikling
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'karen.anne.kjendlie@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Svar på høring – Skoleregler for elever ved de videregående skolene i Vestfold',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/11907' : '24/00038'
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Seksjon kompetanse og pedagogisk utvikling',
          description,
          type: 'Svar på høring – Skoleregler for elever ved de videregående skolene i Vestfold', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
