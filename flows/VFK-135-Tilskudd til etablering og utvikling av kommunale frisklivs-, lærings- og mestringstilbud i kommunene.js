const description = 'Tilskudd til etablering og utvikling av kommunale frisklivs-, lærings- og mestringstilbud i kommunene'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_soker.Soker.Organisasjon.Organisasjon_orgnr.replaceAll(' ', '')
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
                ReferenceNumber: jsonData.Informasjon_om_soker.Soker.Organisasjon.Organisasjon_orgnr.replaceAll(' ', ''),
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
            Title: `Søknad om tilskudd - ${jsonData.Informasjon_om_prosjekt.Prosjekt.Navn_på_prosjek} - ${jsonData.Informasjon_om_soker.Soker.Organisasjon.Organisasjon_orgnavn}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/17465' : '24/00108',
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20%20frisklivs%20lrings%20og%20mestringstilbud%20i%20ko/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20%20frisklivs%20lrings%20og%20mestringstilbud%20i%20ko/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_soker.Soker.Organisasjon.Organisasjon_orgnavn, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: jsonData.Informasjon_om_soker.Soker.Organisasjon.Organisasjon_orgnr.replaceAll(' ', ''),
              // Kommune: xmlData.navnKommune,
              Kommunens_x0020_e_x002d_post: jsonData.Informasjon_om_soker.Soker.Kommunens_e_postadresse,
              Utfyller: `${jsonData.Informasjon_om_soker.Utfyller.Fornavn} ${jsonData.Informasjon_om_soker.Utfyller.Etternavn}`,
              Utfyllers_x0020_e_x002d_post: jsonData.Informasjon_om_soker.Utfyller.E_post__arbeid_,
              Utfyllers_x0020_mobiltelefonnr: jsonData.Informasjon_om_soker.Utfyller.Telefon,
              Faglig_x0020_ansvarlig: `${jsonData.Informasjon_om_soker.Faglig_ansvarlig.Fornavn2} ${jsonData.Informasjon_om_soker.Faglig_ansvarlig.Etternavn2}`,
              Prosjektnavn: jsonData.Informasjon_om_prosjekt.Prosjekt.Navn_på_prosjek,
              Kort_x0020_beskrivelse: jsonData.Informasjon_om_prosjekt.Prosjekt.Kort_oppsummeri,
              Prosjekt_x0020_nytt_x0020_av_x00: jsonData.Informasjon_om_prosjekt.Prosjekt.Er_prosjektet_nytt_av_ar,
              Prosjekt_x0020_tidligere_x0020_s: jsonData.Informasjon_om_prosjekt.Prosjekt.Har_prosjektet_fatt_stot,
              Antall_x0020__x00e5_r: jsonData.Informasjon_om_prosjekt.Prosjekt.Hvor_mange_ar_har_prosje,
              Problemstilling_x0020_og_x0020_b: jsonData.Informasjon_om_prosjekt.Prosjekt.Hva_er_bakgrunn,
              M_x00e5_l: jsonData.Informasjon_om_prosjekt.Prosjekt.Hva_ønsker_dere,
              M_x00e5_lgruppe: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_malgruppen_for_p,
              M_x00e5_l_x0020_om_x0020__x00e5_: jsonData.Informasjon_om_prosjekt.Prosjekt.Hvor_mange_pers,
              Prosjektorganisering: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_prosjek,
              Innhold: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_innhold,
              Brukermedvirkning: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_hvordan,
              Samarbeidspartnere: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_hvilke_,
              Risikofaktorer: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_vurdering_av_ris,
              Overf_x00f8_ringsverdi: jsonData.Informasjon_om_prosjekt.Prosjekt.Hvordan_skal_er,
              Implementering: jsonData.Informasjon_om_prosjekt.Prosjekt.Beskriv_en_plan,
              S_x00f8_knadsbel_x00f8_p: jsonData.Budsjett.Inntekter.Nye_tilskuddsmi || 0,
              Sum_x0020_inntekter: jsonData.Budsjett.Inntekter.Sum_inntekter || 0,
              Sum_x0020_utgifter: jsonData.Budsjett.Utgifter.Sum_kostnader || 0,
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
