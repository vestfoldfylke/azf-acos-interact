const description = 'Sender til Sharepoint'
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
        const xmlData = flowStatus.parseXml.result.Produksjon
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
          searchFilter: `fields/ProdID eq '${xmlData.ProdID}'`
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        const sharepointElements = []
        const reisefolge = Array.isArray(xmlData.Reisefolge) ? xmlData.Reisefolge.Reisefolge : [xmlData.Reisefolge.Reisefolge] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        if (flowStatus.sharepointGetListItem.result.length !== 1) throw new Error('Fant ikke unik match i lista når vi kjørte sharepointGetListItem, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila')
        const id = flowStatus.sharepointGetListItem.result[0]
        for (const person of reisefolge) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.KonsertNavn,
              Artist: person.Navn,
              Artist_x002d_tlf: person.Mobil,
              Henting: xmlData.Henting,
              Kommentartransport: xmlData.TransportKommentar,
              Overnattingsbehov: person.Overnattingsbehov,
              Reiseform: xmlData.Reiseform,
              Reiserfra: xmlData.ReiseFra,
              Spesiellebehov: person.SpesielleBehov,
              ProdID: xmlData.ProdID
            }
          }
          sharepointElements.push(sharepointElement)
        }
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.Produksjon
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'SAMU',
          department: 'MFM',
          description,
          type: 'innmelding av produksjon' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.Produksjon.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
