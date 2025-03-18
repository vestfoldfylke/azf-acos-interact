const description = 'Svar på høring - Regional plan for mobilitet'
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
  string navn
  string mobil
  string fnr
  string epost
  string organisasjon
  string orgnr
  string innspillFormal
  string innspillProsess
  string innspillOrganisering
  string innspillGjennomforing
  string innspillFylkesveier
  string innspillTrafikksikkerhet
  string innspillUniversellUtforming
  string innspillKlimaOgNatur
  string innspillKollektivtrafikk
  string innspillVestfoldbanen
  string innspillGangeOgSykkel
  string innspillDeltMobilitet
  string innspillByerOgBypakker
  string innspillRiksveier
  string innspillHavner
  string innspillGronnJyllandskorridor
  string innspillTorp
  string innspillSamfunnssikkerhetOgBeredskap
  string innspillNyTeknologi
  string innspillOkonomi
  string andreInnspill
  string privatperson
}

  */
  syncPrivatePerson: {
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
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.privatperson === 'Nei'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgnr.replaceAll(' ', '')
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
                ReferenceNumber: xmlData.privatperson === 'Ja' ? xmlData.fnr : xmlData.orgnr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200094' : '200150', // Team infrastruktur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'marit.lindseth@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Høringsinnspill - Forslag til planprogram Regional plan for mobilitet',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/03752' : '25/00011'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Hoerningsssvar%20mobilitet/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Hoerningsssvar%20mobilitet/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.navn, // husk å bruke internal name på kolonnen
              Mobil: xmlData.mobil,
              E_x002d_post: xmlData.epost,
              Organisasjon: xmlData.organisasjon || 'Privatperson',
              Innspilltilform_x00e5_l: xmlData.innspillFormal,
              Innspilltilprosess: xmlData.innspillProsess,
              Innspilltilorganisering: xmlData.innspillOrganisering,
              Innspilltilgjennomf_x00f8_ring: xmlData.innspillGjennomforing,
              Fylkesveier: xmlData.innspillFylkesveier,
              Trafikksikkerhet: xmlData.innspillTrafikksikkerhet,
              Universell_x0020_utforming: xmlData.innspillUniversellUtforming,
              Klimaognatur: xmlData.innspillKlimaOgNatur,
              Kollektivtrafikk: xmlData.innspillKollektivtrafikk,
              Vestfoldbanen: xmlData.innspillVestfoldbanen,
              Gangeogsykkel: xmlData.innspillGangeOgSykkel,
              Deltmobilitet: xmlData.innspillDeltMobilitet,
              Byerogbypakker: xmlData.innspillByerOgBypakker,
              Riksveier: xmlData.innspillRiksveier,
              Havner: xmlData.innspillHavner,
              Gr_x00f8_nnJyllandskorridor: xmlData.innspillGronnJyllandskorridor,
              TORP: xmlData.innspillTorp,
              Samfunnssikkerhetogberedskap: xmlData.innspillSamfunnssikkerhetOgBeredskap,
              Ny_x0020_teknologi: xmlData.innspillNyTeknologi,
              _x00d8_konomi: xmlData.innspillOkonomi,
              Andre_x0020_innspill: xmlData.andreInnspill,
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Infrastruktur og veiforvaltning',
          description,
          type: 'Svar på høring - Regional plan for mobilitet', // Required. A short searchable type-name that distinguishes the statistic element
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
