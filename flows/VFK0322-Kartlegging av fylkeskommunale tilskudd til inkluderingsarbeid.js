const description = 'Kartlegging av fylkeskommunale tilskudd til inkluderingsarbeid'
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
  string organisasjonsnavn
  string orgnr
  string kontaktperson
  string epost
  string telefon
  string sektor
  string hvorForegarTiltaket
  string hvorForegarTiltaketAnnet
  bool alderUnder15
  bool alder15_19
  bool alder20_24
  bool alder25_29
  bool alder30_66
  bool alderOver67
  bool alderAlle
  bool malgruppeMinoritet
  bool malgruppeLavSosialStatus
  bool malgruppeUtenforArbeid
  bool malgruppeIngen
  string antallPersoner
  string hvaErGjort
  string hvaErLaert
  string hvaErLurt
  string resultater
  string implementering
  string nettverk
  string samarbeid
}

  */

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
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
                ReferenceNumber: xmlData.orgnr.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Tilbakemelding - tilskudd',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Tilbakemelding - Fylkeskommunale tilskudd til inkluderingsarbeid',
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/05841' : '25/00009',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029',
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'elin.gunleiksrud@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: 'U'
            // Paragraph: 'Offl. § 26 femte ledd',
            // AccessGroup: 'Seksjon Kulturarv'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Kartlegging%20av%20fylkeskommunale%20tilskudd%20til%20inklud/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Kartlegging%20av%20fylkeskommunale%20tilskudd%20til%20inklud/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.organisasjonsnavn, // husk å bruke internal name på kolonnen
              Prosjektnavn_x0020__x002f__x0020: xmlData.prosjektnavn,
              Kontaktperson: xmlData.kontaktperson,
              E_x002d_post: xmlData.epost,
              Telefon: xmlData.telefon,
              Sektor: xmlData.sektor,
              Hvor_x0020_foreg_x00e5_r_x0020_t: xmlData.hvorForegarTiltaket,
              Annet: xmlData.hvorForegarTiltaketAnnet,
              Aldersgruppe_x0020_under_x0020_1: xmlData.alderUnder15 === 'true',
              Aldersgruppe_x0020_15_x002d_19: xmlData.alder15_19 === 'true',
              Aldersgruppe_x0020_20_x002d_24: xmlData.alder20_24 === 'true',
              Aldersgruppe_x0020_25_x002d_29: xmlData.alder25_29 === 'true',
              Aldersgruppe_x0020_30_x002d_66: xmlData.alder30_66 === 'true',
              Aldersgruppe_x0020_over_x0020_67: xmlData.alderOver67 === 'true',
              Alle_x0020_aldersgrupper: xmlData.alderAlle === 'true',
              M_x00e5_lgruppe_x0020_minoritets: xmlData.malgruppeMinoritet === 'true',
              M_x00e5_lgruppe_x0020_lav_x0020_: xmlData.malgruppeLavSosialStatus === 'true',
              M_x00e5_lgruppe_x0020_utenfor_x0: xmlData.malgruppeUtenforArbeid === 'true',
              M_x00e5_lgruppe_x0020_Ingen_x002: xmlData.malgruppeIngen === 'true',
              Antall_x0020_personer_x0020_som_: xmlData.antallPersoner,
              Hva_x0020_er_x0020_gjort: xmlData.hvaErGjort,
              Hva_x0020_er_x0020_l_x00e6_rt: xmlData.hvaErLaert,
              Hva_x0020_er_x0020_lurt: xmlData.hvaErLurt,
              Resultater_x0020_andre_x0020_kan: xmlData.resultater,
              Implementering: xmlData.implementering,
              Behov_x0020_for_x0020_nettverk: xmlData.nettverk,
              Behov_x0020_for_x0020_samarbeid: xmlData.samarbeid,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
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
          department: 'Seksjon samfunn og plan',
          description, // Required. A description of what the statistic element represents
          type: 'Kartlegging av fylkeskommunale tilskudd til inkluderingsarbeid', // Required. A short searchable type-name that distinguishes the statistic element
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
