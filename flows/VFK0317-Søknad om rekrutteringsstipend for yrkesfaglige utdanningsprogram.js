const description = 'Søknad om rekrutteringsstipend for yrkesfaglige utdanningsprogram'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.fnr
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
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: xmlData.fnr,
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
                Title: 'Søknad om rekrutteringsstipend for yrkesfaglige utdanningsprogram',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200017' : '200020', // Seksjon Kompetanse og pedagogisk utvikling
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'tonje.hareide@vestfoldfylke.no' : '',
            Status: 'J',
            Title: 'Søknad om rekrutteringsstipend for yrkesfaglige utdanningsprogram',
            UnofficialTitle: 'Søknad om rekrutteringsstipend for yrkesfaglige utdanningsprogram',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/03094' : '25/00001',
            AccessGroup: 'Seksjon Kompetanse og pedagogisk utvikling'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Sknad%20rekrutteringsstipend/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Sknad%20rekrutteringsstipend/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.fnr || 'Mangler fødselsnummer', // husk å bruke internal name på kolonnen
              Etternavn: xmlData.etternavn,
              Fornavn: xmlData.fornavn,
              Bostedskommune: xmlData.bostedskommune,
              E_x002d_postadresse: xmlData.epost,
              S_x00f8_knadstype: xmlData.soknadstype,
              Begrunnelse: xmlData.begrunnelse,
              Dokumentnummeri360: flowStatus.archive?.result?.DocumentNumber || 'Mangler dokumentnummer i 360'
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
          department: 'Seksjon kompetanse og pedagogisk utvikling',
          description,
          type: 'Søknad om rekrutteringsstipend for yrkesfaglige utdanningsprogram', // Required. A short searchable type-name that distinguishes the statistic element
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
