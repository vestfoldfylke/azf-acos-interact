const description = 'Oppdaterer rad i SP liste.'
// const { nodeEnv } = require('../config')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  sharepointGetListItem: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
          searchFilter: `fields/guid0 eq '${xmlData.guid}'` // guid blir sendt med fra første skjema og lagret i lista. Denne raden søker vi etter her
        }
      }
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (flowStatus.sharepointGetListItem.result.length !== 1) throw new Error('Fant ikke unik match i lista når vi kjørte sharepointGetListItem, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila')
        const id = flowStatus.sharepointGetListItem.result[0].id
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: false,
            uploadFormAttachments: false,
            fields: {
              Tilgang_x0020_til_x0020_FIKS: `Utført (${xmlData.utfortAvTidspunkt})`
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
          company: 'Tannhelse',
          department: 'Tannhelse',
          description,
          type: 'Tannhelse - bestilling av tilganger - FIKS' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber // || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
