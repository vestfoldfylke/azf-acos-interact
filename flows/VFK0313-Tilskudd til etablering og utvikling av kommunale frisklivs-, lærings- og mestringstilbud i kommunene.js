const description = 'Tilskudd til etablering og utvikling av kommunale frisklivs-, lærings- og mestringstilbud i kommunene'
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
                Title: 'Søknad om tilskudd',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd – ${xmlData.prosjektNavn} - ${xmlData.navnKommune}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/25933' : '24/00108',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '' : '', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'anne.slaatten@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20%20frisklivs%20lrings%20og%20mestringstilbud%20i%20ko/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20%20frisklivs%20lrings%20og%20mestringstilbud%20i%20ko/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.orgnavn, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: xmlData.orgnr,
              Kommune: xmlData.navnKommune,
              Kommunens_x0020_e_x002d_post: xmlData.kommuneEpost,
              Utfyller: xmlData.utfyllerNavn,
              Utfyllers_x0020_e_x002d_post: xmlData.utfyllerEpost,
              Utfyllers_x0020_mobiltelefonnr: xmlData.utfyllerTelefon,
              Faglig_x0020_ansvarlig: xmlData.fagligAnsvarligNavn,
              Prosjektnavn: xmlData.prosjektNavn,
              Kort_x0020_beskrivelse: xmlData.prosjektKortBeskrivelse,
              Prosjekt_x0020_nytt_x0020_av_x00: xmlData.prosjektNyttAvAret,
              Prosjekt_x0020_tidligere_x0020_s: xmlData.prosjektTidlStotte,
              Antall_x0020__x00e5_r: xmlData.prosjektTidlStotteAr,
              Problemstilling_x0020_og_x0020_b: xmlData.prosjektProblemstilling,
              M_x00e5_l: xmlData.prosjektMal,
              M_x00e5_lgruppe: xmlData.prosjektMalgruppe,
              Prosjektorganisering: xmlData.prosjektOrganisering,
              Innhold: xmlData.prosjektInnhold,
              Brukermedvirkning: xmlData.prosjektBrukermedvirkning,
              Samarbeidspartnere: xmlData.prosjektSamarbeidspartnere,
              Risikofaktorer: xmlData.prosjektRisikofaktorer,
              Overf_x00f8_ringsverdi: xmlData.prosjektOverforingsverdi,
              Implementering: xmlData.prosjektPlanImplementering,
              S_x00f8_knadsbel_x00f8_p: parseInt(xmlData.okonomiSoknadssum) || 0,
              Sum_x0020_inntekter: parseInt(xmlData.okonomiSumInntekter) || 0,
              Sum_x0020_utgifter: parseInt(xmlData.okonomiSumUtgifter) || 0,
              Dokumentnummer_x0020_P360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert enda'
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
          department: 'Seksjon folkehelse',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskudd til etablering og utvikling av kommunale frisklivs-, lærings- og mestringstilbud i kommunene', // Required. A short searchable type-name that distinguishes the statistic element
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
