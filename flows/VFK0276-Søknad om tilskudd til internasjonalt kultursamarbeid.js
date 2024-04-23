const description = 'Søknad om tilskudd til internasjonalt kultursamarbeid'
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
  string navnPaProsjekt
  string soker
  string orgNr
  string fnr
  string kortOppsummering
  string kortBeskrivelseAvSoker
  string utfyllendeBeskrivelse
  string samarbeidspartnere
  string prosjektperiode
  string miljoBaerekraft
  string kulturstrategi
  string sumUtgifter
  string soknadssum
  string typeSoker
}

}

  */
  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.typeSoker === 'Privatperson'
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
        return flowStatus.parseXml.result.ArchiveData.typeSoker === 'Organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgNr.replaceAll(' ', '')
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
                ReferenceNumber: xmlData.typeSoker === 'Privatperson' ? xmlData.fnr : xmlData.orgNr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: 'Søknad om tilskudd til internasjonalt kultursamarbeid',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '' : '200031', // Seksjon kultur
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'natashap@vestfoldfylke.no' : '',
            Status: 'J',
            Title: `Søknad om tilskudd til internasjonalt kultursamarbeid - ${xmlData.navnPaProsjekt}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/10628' : '24/00034'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20tilskudd%20til%20internasjonalt%20kultursamarbe/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Sknad%20om%20tilskudd%20til%20internasjonalt%20kultursamarbe/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.navnPaProsjekt || 'Mangler title', // husk å bruke internal name på kolonnen
              S_x00f8_ker: xmlData.navnPaProsjekt,
              Kort_x0020_oppsummering: xmlData.kortOppsummering,
              Kort_x0020_beskrivelse_x0020_av_: xmlData.kortBeskrivelseAvSoker,
              Utfyllende_x0020_beskrivelse: xmlData.utfyllendeBeskrivelse,
              Samarbeidspartnere: xmlData.samarbeidspartnere,
              Prosjektperiode: xmlData.prosjektperiode,
              Milj_x00f8__x0020_og_x0020_b_x00: xmlData.miljoBaerekraft,
              Kulturstrategi: xmlData.kulturstrategi,
              Sum_x0020_utgifter: xmlData.sumUtgifter,
              S_x00f8_knadssum: xmlData.soknadssum,
              Dokumentnummer_x0020_360: flowStatus.archive.result.DocumentNumber
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
          department: 'Seksjon kultur',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om tilskudd til internasjonalt kultursamarbeid', // Required. A short searchable type-name that distinguishes the statistic element
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
