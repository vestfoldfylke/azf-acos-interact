const description = 'Regionalt kulturfond Vestfold - rapportering'
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Prosjekt.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
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
                ReferenceNumber: jsonData.Prosjekt.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
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
                Title: 'Rapportering - Regionalt kulturfond Vestfold',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            // Project: nodeEnv === 'production' ? : '25-4'
            DocumentDate: new Date().toISOString(),
            Title: `Rapportering - Regionalt kulturfond Vestfold - ${jsonData.Prosjekt.Info_om_prosjek.Prosjekttittel}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '26/05972' : '26/00034',
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%20%20Regionalt%20kulturfond%20Vestfold/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%20%20Regionalt%20kulturfond%20Vestfold/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Prosjekt.Info_om_prosjek.Prosjekttittel,
              Kategori: jsonData.Prosjekt.Info_om_prosjek.Velg_kategori,
              Organisasjon: jsonData.Prosjekt.Informasjon_om_.Organisasjon.Organisasjonsna,
              Samarbeidspartnere: jsonData.Rapport_og_eval.Rapport.Hvem_har_dere_s,
              Gjennomf_x00f8_ring: jsonData.Rapport_og_eval.Rapport.Beskriv_kort_gj,
              Hvor: jsonData.Rapport_og_eval.Rapport.Hvor_har_tiltak,
              M_x00e5_lgruppe: jsonData.Rapport_og_eval.Rapport.Hvem_var_m\u00E5lgru,
              Involvering_x0020_fra_x0020_m_x0: jsonData.Rapport_og_eval.Rapport.Har_m\u00E5lgruppen_,
              Antall_x0020_personer: jsonData.Rapport_og_eval.Rapport.Hvor_mange_pers1,
              Er_x0020_m_x00e5_let_x0020_n_x00: jsonData.Rapport_og_eval.Evaluering.Ble_m\u00E5let_med_t,
              Viktigste_x0020_resultat: jsonData.Rapport_og_eval.Evaluering.Hvordan_har_til,
              _x00c5_rsak_x0020_til_x0020_at_x: jsonData.Rapport_og_eval.Evaluering.Hva_er_\u00E5rsak_ti,
              Benyttet_x0020_i_x0020_hht_x0020: jsonData.Regnskap.Er_tilskuddet_b,
              Andre_x0020_finansieringskilder: jsonData.Regnskap.Hvilke_andre_fi,
              Tilskuddsbel_x00f8_p: jsonData.Regnskap.Tilskuddsbel\u00F8p_,
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
