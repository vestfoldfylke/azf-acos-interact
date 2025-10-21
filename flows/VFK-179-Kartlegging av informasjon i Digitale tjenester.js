// const description = 'Kartlegging av informasjon i Digitale tjenester'
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
        const jsonData = flowStatus.parseJson.result
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/KommunikasjonsstausDT/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/KommunikasjonsstausDT/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.SavedValues.Login.FirstName} ${jsonData.SavedValues.Login.LastName}`,
              Rolle: jsonData.DialogueInstance.Informasjon_om_.Din_rolle.Beskriv_kort_di,
              Informasjonskanaler: jsonData.DialogueInstance.Informasjon_om_.Din_rolle.Hvilke_informas,
              Hvordanmottasinfo: jsonData.DialogueInstance.Informasjon_om_.Formell_og_ufor.Hvordan_mottar_,
              Erinforelevant: jsonData.DialogueInstance.Informasjon_om_.Formell_og_ufor.Opplever_du_at_,
              Uformelldeling: jsonData.DialogueInstance.Informasjon_om_.Formell_og_ufor.Er_det_vanlig_a,
              Digitaleverkt_x00f8_ysombenyttes: jsonData.DialogueInstance.Informasjon_om_.Verktøy_og_tekn.Hvilke_digitale,
              Fungererverkt_x00f8_yene: jsonData.DialogueInstance.Informasjon_om_.Verktøy_og_tekn.Fungerer_disse_,
              Hensiktsmessig: jsonData.DialogueInstance.Informasjon_om_.Verktøy_og_tekn.Er_det_noen_ver,
              Tilgjengelighet: jsonData.DialogueInstance.Informasjon_om_.Tilgjengelighet.Er_det_noen_typ,
              Sviktetinfoflyt: jsonData.DialogueInstance.Informasjon_om_.Utfordringer_og.Kan_du_beskrive,
              _x00c5_rsak: jsonData.DialogueInstance.Informasjon_om_.Utfordringer_og.Hva_tror_du_er_,
              Savn: jsonData.DialogueInstance.Informasjon_om_.Utfordringer_og.Er_det_noe_du_s1
            }
          }
        ]
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
