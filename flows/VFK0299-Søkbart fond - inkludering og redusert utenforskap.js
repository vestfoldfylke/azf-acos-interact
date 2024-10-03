const description = 'Søkbart fond - inkludering og redusert utenforskap'
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
  string TypeArbeid
  string Organisasjonsnavn
  string Periode
  string Onsket_maloppnaelse
  string Samarbeidsaktorer
  string Malgruppe
  string MedvirkningMalgruppe
  string Tittel
  string BeskrivelseAvArbeid
  string HvordanRedusereUtenforskap
  string HvordanEvaluere
  string Videreforing
  string MiljoBarekraft
  string KortOppsummering
  string Flerarig
  string Soknadssum
  string KanGjoennomforesLavereSum
  string HvordanKanGjennomfores
  string AndreInntekter
  string SumInntekter
  string SumUtgifter
  string Orgnr
}

  */

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', '')
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-284' : '24-5',
            Title: 'Søknad om tilskudd - Inkludering og redusert utenforskap',
            // UnofficialTitle: ,
            Status: 'B',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Sakarkiv',
            ArchiveCodes: [
              {
                ArchiveCode: '243',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'F36',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029',
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'tone.helen.jorgensen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessGroup: 'Alle'
          }
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
                ReferenceNumber: xmlData.Orgnr.replaceAll(' ', ''),
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
                Title: 'Inkludering og redusert utenforskap ',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd – Inkludering og redusert utenforskap - ${xmlData.Tittel}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'tone.helen.jorgensen@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Skbart%20fond%20%20inkludering%20og%20redusert%20utenforskap/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Skbart%20fond%20%20inkludering%20og%20redusert%20utenforskap/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Organisasjonsnavn, // husk å bruke internal name på kolonnen
              Type_x0020_arbeid: xmlData.TypeArbeid,
              Tittel: xmlData.Tittel,
              Periode: xmlData.Periode,
              _x00d8_nsket_x0020_m_x00e5_loppn: xmlData.Onsket_maloppnaelse,
              M_x00e5_lgruppe: xmlData.Malgruppe,
              Samarbeidsakt_x00f8_rer: xmlData.Samarbeidsaktorer,
              Medvirkning_x0020_med_x0020_m_x0: xmlData.MedvirkningMalgruppe,
              Beskrivelse_x0020_av_x0020_arbei: xmlData.BeskrivelseAvArbeid,
              Hvordan_x0020_skal_x0020_arbeide: xmlData.HvordanRedusereUtenforskap,
              Hvordan_x0020_evaluere: xmlData.HvordanEvaluere,
              Videref_x00f8_ring: xmlData.Videreforing,
              Milj_x00f8__x0020_og_x0020_b_x00: xmlData.MiljoBarekraft,
              Kort_x0020_oppsummering: xmlData.KortOppsummering,
              Fler_x00e5_rig: xmlData.Flerarig,
              S_x00f8_knadssum: parseInt(xmlData.Soknadssum) || 0,
              Kan_x0020_gjennomf_x00f8_res_x00: xmlData.KanGjoennomforesLavereSum,
              Hvordan_x0020_kan_x0020_det_x002: xmlData.HvordanKanGjennomfores,
              Andre_x0020_inntekter: parseInt(xmlData.AndreInntekter) || 0,
              Sum_x0020_inntekter: parseInt(xmlData.SumInntekter) || 0,
              Sum_x0020_utgifter: parseInt(xmlData.SumUtgifter) || 0,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert enda'
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
          type: 'Søkbart fond - inkludering og redusert utenforskap', // Required. A short searchable type-name that distinguishes the statistic element
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
