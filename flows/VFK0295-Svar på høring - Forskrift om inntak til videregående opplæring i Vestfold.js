const description = 'Svar på høring - Forskrift om inntak til videregående oppløring i Vestfold'
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
  string Fornavn
  string Etternavn
  string Representerer
  string Virksomhet
  string InnspillKap2
  string InnspillKap3
  string InnspillKap4
  string AndreKommentarer
  string Egendefinert1
  string Egendefinert2
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
                Title: 'Høringssvar',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'helle.bergan@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Svar på høring - Forskrift om inntak til videregående opplæring og formidling til læreplass i Vestfold',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/20030' : '24/00058'
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Svar%20p%20hring%20ny%20inntaksforskrift/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Svar%20p%20hring%20ny%20inntaksforskrift/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber, // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Hvisvirksomhet: xmlData.Virksomhet || 'Privatperson',
              Innspilltilendringeneikapittel2_: xmlData.InnspillKap2,
              Innspilltilendringeneikapittel3_: xmlData.InnspillKap3,
              Innspilltilendringeneikapittel4_: xmlData.InnspillKap4,
              Andrekommentarer: xmlData.AndreKommentarer
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Seksjon Sektorstøtte, inntak og eksamen',
          description,
          type: 'Svar på høring - Forskrift om inntak til videregående opplæring og formidling til læreplass i Vestfold', // Required. A short searchable type-name that distinguishes the statistic element
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
