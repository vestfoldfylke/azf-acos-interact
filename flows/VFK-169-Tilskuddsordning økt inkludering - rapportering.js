const description = 'Regionalt kulturfond Vestfold'
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
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Tilskudd_til_øk.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
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
                ReferenceNumber: jsonData.Tilskudd_til_øk.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
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
                Title: 'Rapportering - Tilskuddsordning for økt inkludering 2024',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Rapportering - Tilskuddsordning for økt inkludering 2024 - ${jsonData.Tilskudd_til_øk.Info_om_prosjek.Navn_på_samarbe}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/13196' : '25/00064',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'yvonne.pleym@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%20%20tilskuddsordning%20for%20kt%20inkludering/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%20%20tilskuddsordning%20for%20kt%20inkludering/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Tilskudd_til_øk.Info_om_prosjek.Navn_på_prosjek, // husk å bruke internal name på kolonnen
              Organisasjon: jsonData.Tilskudd_til_øk.Informasjon_om_.Organisasjon.Organisasjonsna,
              Samarbeidsakt_x00f8_rer: jsonData.Tilskudd_til_øk.Info_om_prosjek.Navn_på_samarbe,
              Gjennomf_x00f8_ring: jsonData.Rapport_og_eval.Rapport.Beskriv_kort_gj,
              Antall_x0020_personer: jsonData.Rapport_og_eval.Rapport.Hvor_mange_pers,
              Alders_x002d__x0020_eller_x0020_: jsonData.Rapport_og_eval.Rapport.Er_det_en_spesi,
              Er_x0020_m_x00e5_let_x0020_n_x00: jsonData.Rapport_og_eval.Evaluering.Ble_målet_med_p,
              Viktigste_x0020_resultat: jsonData.Rapport_og_eval.Evaluering.Hva_er_det_vikt,
              _x00c5_rsak_x0020_til_x0020_at_x: jsonData.Rapport_og_eval.Evaluering.Hva_er_årsak_ti,
              Bidratt_x0020_til_x0020__x00f8_k: jsonData.Rapport_og_eval.Evaluering.Har_tiltaket_bi,
              P_x00e5__x0020_hvilken_x0020_m_x: jsonData.Rapport_og_eval.Evaluering.På_hvilken_måte,
              _x00c5_rsak_x0020_til_x0020_ikke: jsonData.Rapport_og_eval.Evaluering.Hva_er_årsaken_,
              Erfaringer: jsonData.Rapport_og_eval.Evaluering.Hvilke_erfaring,
              Benyttet_x0020_i_x0020_hht_x0020: jsonData.Regnskap.Er_tilskuddet_b,
              Andre_x0020_finansieringskilder: jsonData.Regnskap.Hvilke_andre_fi,
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
          type: 'Regionalt kulturfond Vestfold', // Required. A short searchable type-name that distinguishes the statistic element
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
