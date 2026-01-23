const description = 'Bestille grafiske tjenester. Eier: Christian Brekke, kommunikasjon'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam-DOKogPOL-TopSecret/Lists/Tilgang%20til%20historisk%20personaldokumentasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam-DOKogPOL-TopSecret/Lists/Tilgang%20til%20historisk%20personaldokumentasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.LastName,
              Innsender_x0020_fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName || 'Navn mangler',
              Innsender_x0020_e_x002d_post: flowStatus.parseJson.result.SavedValues.Login.Email || 'E-post mangler',
              Innsender_x0020_tittel: flowStatus.parseJson.result.SavedValues.Login.AzureAD.JobTitle || 'Tittel mangler',
              Innsender_x0020_virksomhet: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.companyName || 'Virksomhet mangler',
              Innsender_x0020_seksjon: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.department || 'Seksjon mangler',
              Hvem_x0020_skal_x0020_ha_x0020_t: jsonData.Tilgang_til_his.Hvem_skal_ha_ti,
              Tilgang_x0020_navn: jsonData.Tilgang_til_his.Hvem_skal_ha_ti === 'Meg selv' ? `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}` : jsonData.Tilgang_til_his.Informasjon_om_.Navn_på_ansatt,
              Tilgang_x0020_e_x002d_post: jsonData.Tilgang_til_his.Hvem_skal_ha_ti === 'Meg selv' ? flowStatus.parseJson.result.SavedValues.Login.Email : jsonData.Tilgang_til_his.Informasjon_om_.E_post,
              Navn_x0020_p_x00e5__x0020_ansatt: jsonData.Tilgang_til_his.Bestilling.Navn_på_ansatt_,
              F_x00f8_dselsnummer: jsonData.Tilgang_til_his.Bestilling.Fødselsnummer_p,
              Type_x0020_info: jsonData.Tilgang_til_his.Bestilling.Hvilken_type_in,
              Form_x00e5_l: jsonData.Tilgang_til_his.Bestilling.Beskriv_formåle,
              _x00d8_nsket_x0020_tidsrom: jsonData.Tilgang_til_his.Bestilling.Hvilket_tidsrom
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
          company: 'Organisasjon',
          department: 'Arkiv og politisk støtte',
          description,
          type: 'Bestille tilgang til historisk arkiv' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
