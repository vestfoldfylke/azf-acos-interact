const description = 'Bestillingsskjema til reise for prøvenemnder'
// const { nodeEnv } = require('../config')

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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Reise%20for%20prvenemnder/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Reise%20for%20prvenemnder/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Kontaktopplysninger2.Etternavn_2 || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavn: jsonData.Kontaktopplysninger2.Fornavn_2,
              F_x00f8_dselsdato: jsonData.Kontaktopplysninger2.Fodselsdato_2,
              Adresse: jsonData.Kontaktopplysninger2.Adresse_,
              Postnr: jsonData.Kontaktopplysninger2.Postnr_sted__postnr,
              Poststed: jsonData.Kontaktopplysninger2.Postnr_sted__poststed,
              Mobil: jsonData.Kontaktopplysninger2.Mobil_,
              E_x002d_post: jsonData.Kontaktopplysninger2.E_post_,
              Nemnd: jsonData.Kontaktopplysninger2.Nemnd_,
              Flyreise: jsonData.Fly.Skal_vi_bestille_flyreis,
              Fly_x0020_avreise_x0020_fra: jsonData.Fly.Flyreise_tur__retur.Hvor_reiser_du_fra_,
              Fly_x0020_avreise_x0020_til: jsonData.Fly.Flyreise_tur__retur.Hvor_reiser_du_til_3,
              Fly_x0020_avreise_x0020_dato: jsonData.Fly.Flyreise_tur__retur.Dato_,
              Fly_x0020_avreise_x0020_klokkesl: jsonData.Fly.Flyreise_tur__retur.Klokkeslett_,
              Fly_x0020_avreise_x0020_annen_x0: jsonData.Fly.Flyreise_tur__retur.Annen_info_,
              Fly_x0020_hjemreise_x0020_fra: jsonData.Fly.Flyreise_tur__retur.Hvor_reiser_du_fra_2,
              Fly_x0020_hjemreise_x0020_til: jsonData.Fly.Flyreise_tur__retur.Hvor_reiser_du_til_4,
              Fly_x0020_hjemreise_x0020_dato: jsonData.Fly.Flyreise_tur__retur.Dato_2,
              Fly_x0020_hjemreise_x0020_klokke: jsonData.Fly.Flyreise_tur__retur.Klokkeslett_2,
              Fly_x0020_hjemreise_x0020_annen_: jsonData.Fly.Flyreise_tur__retur.Annen_info_2,
              Togreise: jsonData.Tog.Skal_vi_bestille_togreis,
              Tog_x0020_avreise_x0020_fra: jsonData.Tog.Togreise_tur__retur.Hvor_reiser_du_fra__,
              Tog_x0020_avreise_x0020_til: jsonData.Tog.Togreise_tur__retur.Hvor_reiser_du_til_,
              Tog_x0020_avreise_x0020_dato: jsonData.Tog.Togreise_tur__retur.Dato_3,
              Tog_x0020_avreise_x0020_klokkesl: jsonData.Tog.Togreise_tur__retur.Klokkeslett_3,
              Tog_x0020_avreise_x0020_annen_x0: jsonData.Tog.Togreise_tur__retur.Annen_info_4,
              Tog_x0020_hjemreise_x0020_fra: jsonData.Tog.Togreise_tur__retur.Hvor_reiser_du_fra__2,
              Tog_x0020_hjemreise_x0020_til: jsonData.Tog.Togreise_tur__retur.Hvor_reiser_du_til_2,
              Tog_x0020_hjemreise_x0020_dato: jsonData.Tog.Togreise_tur__retur.Dato_4,
              Tog_x0020_hjemreise_x0020_klokke: jsonData.Tog.Togreise_tur__retur.Klokkeslett_4,
              Tog_x0020_hjemreise_x0020_annen_: jsonData.Tog.Togreise_tur__retur.Annen_info_5,
              Hotell: jsonData.Hotell.Skal_vi_bestille_hotell_,
              Hotell_x0020_sted: jsonData.Hotell.Om_oppholdet.Sted_,
              Hotell_x0020_fra: jsonData.Hotell.Om_oppholdet.Fra_til__from,
              Hotell_x0020_til: jsonData.Hotell.Om_oppholdet.Fra_til__to,
              Hotell_x0020_annen_x0020_info: jsonData.Hotell.Om_oppholdet.Annen_info_3,
              Hensikt_x0020_med_x0020_reisen: jsonData.Hensikt.Hva_er_hensikt_med_reise,
              Hvem_x0020_har_x0020_godkjent_x0: jsonData.Hensikt.Hvem_fra_fag__og_yrkesop,
              Kandidat_x0020_fornavn: jsonData.Hensikt.Kontaktopplysninger_om_k.Fornavn_,
              Kandidat_x0020_etternavn: jsonData.Hensikt.Kontaktopplysninger_om_k.Etternavn_,
              Kandidat_x0020_f_x00f8_dselsdato: jsonData.Hensikt.Kontaktopplysninger_om_k.Fodselsdato_,
              Kandidat_x0020_l_x00e6_refag: jsonData.Hensikt.Kontaktopplysninger_om_k.Larefag_,
              Kandidat_x0020_pr_x00f8_vedato_x: jsonData.Hensikt.Kontaktopplysninger_om_k.Provedato_fra_til__from,
              Kandidat_x0020_pr_x00f8_vedato_x0: jsonData.Hensikt.Kontaktopplysninger_om_k.Provedato_fra_til__to,
              Annet: jsonData.Hensikt.Annet_
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
          company: 'Opplæring',
          department: 'Fagopplæring',
          description,
          type: 'Lokal kompetanseutvikling for fag- og yrkesopplæringen (DEKOMP-Y)' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // documentNumber:  // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
