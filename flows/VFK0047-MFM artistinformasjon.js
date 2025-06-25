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
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
          searchFilter: `fields/innmeldingAcosRefId eq '${xmlData.innmeldingAcosRefId}'`
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Produksjon
        if (!flowStatus.sharepointGetListItemProduksjoner.result.length > 1) throw new Error(`Fant mer enn ett listeelement med innmeldingAcosRefId: ${xmlData.innmeldingRefId}`)
        const id = flowStatus.sharepointGetListItemProduksjoner.result[0].id
        const sharepointElements = [
          { // Produksjoner
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Produksjon_x0020__x0028_fra_x002: xmlData.KonsertNavn || 'Mangler konsertnavn', // husk å bruke internal name på kolonnen
              Ut_x00f8_vere: xmlData.UtoverOgInstrument,
              Ut_x00f8_ver_x002d_navn_x002f_tl: `${xmlData.KontaktNavn} - ${xmlData.KontaktTlf}`,
              Ut_x00f8_vere_x002d_post: xmlData.KontaktEpost,
              Tekniske_x0020_merknader: xmlData.TekniskeKrav,
              _x00d8_nsket_x0020_m_x00e5_lgrup: xmlData.Merknader,
              M_x00e5_lgruppe: `${xmlData.MalgruppeFra} - ${xmlData.MalgruppeTil}`
            }
          },
          { // Kommunikasjon
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Artistinfokommunikasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.KonsertNavn || 'Mangler konsertnavn', // husk å bruke internal name på kolonnen
              Kontaktperson: xmlData.KontaktNavn,
              Telefon: xmlData.KontaktTlf,
              e_x002d_post: xmlData.KontaktEpost,
              Ut_x00f8_vere: xmlData.UtoverOgInstrument,
              Link_x0020_til_x0020_nettside: xmlData.LinkWeb,
              Link_x0020_til_x0020_videoklipp: xmlData.linkVideo,
              Kortbeskrivelseavproduksjonen: xmlData.Beskrivelse,
              M_x00e5_lgruppealder: `${xmlData.MalgruppeFra} - ${xmlData.MalgruppeTil}`,
              Kommentar: xmlData.Kommentar,
              Erkonsertenprodusertform_x00e5_l: xmlData.ProdusertForMalgruppa,
              Navnp_x00e5_produsenter: xmlData.ProdusentNavn,
              Konsertlengde_x0028_min_x0029_: xmlData.Konsertlengde,
              Opprigg_x0028_min_x0029_: xmlData.OppriggTid,
              Nedrigg_x0028_min_x0029_: xmlData.NedriggTid,
              Blending: xmlData.Blending,
              Andremerknader: xmlData.Merknader,
              innmeldingAcosRefId: xmlData.innmeldingAcosRefId
            }
          }
        ]
        // Logistikk
        const reisefolge = Array.isArray(xmlData.Reisefolge.Reisefolge) ? xmlData.Reisefolge.Reisefolge : [xmlData.Reisefolge.Reisefolge] // Sjekker om det er mer enn en person i lista (altså et array). Hvis ikke lag et array med det ene elementet
        console.log('reisefolge', reisefolge)
        console.log('reisefolge.length', reisefolge.length)
        if (reisefolge.length === 0) throw new Error(`Fant ikke noe reisefølge med innmeldingAcosRefId: ${xmlData.innmeldingAcosRefId}`)
        for (const person of reisefolge) {
          const reisefolgeElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Logistikkartister/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.KonsertNavn || 'Mangler konsertnavn',
              Artist: person.Navn,
              Artist_x002d_tlf: person.Mobil,
              Artist_x002d_epost: xmlData.KontaktEpost,
              Overnattingsbehov: person.Overnattingsbehov,
              Spesiellebehov: person.SpesielleBehov,
              Kommentar: xmlData.ReisefolgeKommentar,
              Henting: xmlData.Henting,
              Kommentartransport: xmlData.TransportKommentar,
              Reiseform: xmlData.Reiseform,
              Reiserfra: xmlData.ReiseFra,
              innmeldingAcosRefId: xmlData.innmeldingAcosRefId
            }
          }
          sharepointElements.push(reisefolgeElement)
        }
        return sharepointElements
      }
    }
  },

  statistics: {
    enabled: false,
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
