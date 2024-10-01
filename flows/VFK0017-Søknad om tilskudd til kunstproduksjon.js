const description = 'Søknad om støtte til kunstproduksjon'
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
    string OrgNr
    string TypeSoker
    string OmProsjektet
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'Privatperson'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'Organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', '')
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
                ReferenceNumber: xmlData.TypeSoker === 'Privatperson' ? xmlData.Fnr : xmlData.Orgnr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad - tilskudd til kunstproduksjon',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd til kunstproduksjon - ${xmlData.Tilskuddsordning}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/22498' : '24/00066',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'yvonne.pleym@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: 'U'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20sttte%20til%20kunstproduksjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20sttte%20til%20kunstproduksjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Soker, // husk å bruke internal name på kolonnen
              Tilskuddsordning: xmlData.Tilskuddsordning,
              Prosjektnavn: xmlData.Prosjektnavn,
              Prosjektbeskrivelse: xmlData.Prosjektbeskrivelse,
              S_x00f8_knadssum: xmlData.Soknadssum,
              Totalkostnad: xmlData.Totalkostnad,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samfunnsutvikling',
          department: 'Kultur',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om støtte til kunstproduksjon', // Required. A short searchable type-name that distinguishes the statistic element
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
