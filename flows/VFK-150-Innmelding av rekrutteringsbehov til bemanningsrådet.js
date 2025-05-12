const description = 'Innmelding av rekrutteringsbehov til bemanningsrådet'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam-HR-Bemanningsrd/Lists/Rekruttering%20bemanningsrd/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam-HR-Bemanningsrd/Lists/Rekruttering%20bemanningsrd/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Informasjon_om_.Innsender.Fornavn1} ${jsonData.Informasjon_om_.Innsender.Etternavn1}`,
              Sektor: jsonData.Informasjon_om_.Stilling.Sektor,
              Seksjon: jsonData.Informasjon_om_.Stilling.Seksjon,
              Rekrutterendeleder: jsonData.Informasjon_om_.Rekrutterende_l,
              Stillingsbenevnelse: jsonData.Informasjon_om_.Stillingsbenevn,
              Stillingstype: jsonData.Informasjon_om_.Fast_midlertidi,
              Kvalifikasjonskrav: jsonData.Informasjon_om_.Kvalifikasjonsk,
              Beskrivelse: jsonData.Informasjon_om_.Beskrivelse_av_,
              Prioritet: jsonData.Informasjon_om_.Prioritet,
              Finansiering: jsonData.Informasjon_om_.Finansiering,
              Kompetansekartlegging: jsonData.Informasjon_om_.Kompetansekartl,
              Evt_x002e_kommentar: jsonData.Informasjon_om_.Eventuelle_komm,
              Telefon: jsonData.Informasjon_om_.Innsender.Telefon1,
              E_x002d_post0: jsonData.Informasjon_om_.Innsender.E_post
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
          department: 'HR',
          description,
          type: 'Innmelding av rekrutteringsbehov til bemanningsrådet' // Required. A short searchable type-name that distinguishes the statistic element
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
