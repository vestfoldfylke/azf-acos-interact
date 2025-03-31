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
  sharepointGetListItemProduksjoner: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
          searchFilter: `fields/ProdID eq '${xmlData.ProdID}'`
        }
      }
    }
  },

  sharepointListProduksjoner: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.KonsertNavn || 'Mangler konsertnavn', // husk å bruke internal name på kolonnen
              Elevpublikum: xmlData.Elevpublikum,
              M_x00e5_lgruppe: `${xmlData.MalgruppeFra} - ${xmlData.MalgruppeTil}`,
              Ut_x00f8_vere: xmlData.UtoverOgInstrument
            }
          }
        ]
      }
    }
  },
  sharepointGetListItemKommunikasjon: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
          searchFilter: `fields/ProdID eq '${xmlData.ProdID}'`
        }
      }
    }
  },

  sharepointListKommunikasjon: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.KonsertNavn || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Andremerknader: xmlData.TekniskeKrav,
              Blending: xmlData.Blending,
              Erkonsertenprodusertform_x00e5_l: xmlData.ProdusertForMalgruppa,
              Kommentar: xmlData.Kommentar,
              Konsertlengde_x0028_min_x0029_: xmlData.Konsertlengde,
              Kontaktperson: xmlData.KontaktNavn,
              Kortbeskrivelseavproduksjonen: xmlData.Beskrivelse,
              Link_x0020_til_x0020_nettside: xmlData.LinkWeb,
              Link_x0020_til_x0020_videoklipp: xmlData.linkVideo,
              M_x00e5_lgruppealder: `${xmlData.MalgruppeFra} - ${xmlData.MalgruppeTil}`,
              Navnp_x00e5_produsenter: xmlData.ProdusentNavn,
              Nedrigg_x0028_min_x0029_: xmlData.NedriggTid,
              Opprigg_x0028_min_x0029_: xmlData.OppriggTid,
              Telefon: xmlData.KontaktTlf,
              Ut_x00f8_vere: xmlData.UtoverOgInstrument,
              e_x002d_post: xmlData.KontaktEpost
            }
          }
        ]
      }
    }
  },

  sharepointGetListItemLogistikk: {
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

  sharepointListLogistikk: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        const sharepointElements = []
        const reisefolge = Array.isArray(xmlData.Reisefolge) ? xmlData.Reisefolge.Reisefolge : [xmlData.Reisefolge.Reisefolge] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        if (flowStatus.sharepointGetListItemLogistikk.result.length !== 1) throw new Error('Fant ikke unik match i lista når vi kjørte sharepointGetListItemLogistikk, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila')
        const id = flowStatus.sharepointGetListItemLogistikk.result[0].id
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
