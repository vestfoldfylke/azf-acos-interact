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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Bestilling%20Dinamo/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/ORG-Organisasjonsektorteam/Lists/Bestilling%20Dinamo/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_.Om_bestillingen.Prosjektnavn,
              Fornavninnsender: jsonData.Informasjon_om_.Navn_på_bestill.Fornavn1 || 'Navn mangler',
              Etternavninnsender: jsonData.Informasjon_om_.Navn_på_bestill.Etternavn1 || 'Etternavn mangler',
              Avdelinginnsender: jsonData.Informasjon_om_.Navn_på_bestill.Avdeling1 || 'Avdeling mangler',
              _x00d8_nsketlevering: jsonData.Informasjon_om_.Om_bestillingen.Ønsket_levering,
              Evt_x002e_kommentarer: jsonData.Informasjon_om_.Andre_viktige_h
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
          company: 'Kommunikasjon',
          department: 'Kommunikasjon og analyse',
          description,
          type: 'Bestille grafiske tjenester', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
