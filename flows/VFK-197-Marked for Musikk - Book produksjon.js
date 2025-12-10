const description = 'SharePointlogikk for MFM'
// Dette skjemaet brukes for å booke produksjoner fra Alle programforslag-lista ved at Linda trykker på en lenke til skjema med ref-id i query param. Når en produksjon bookes, legges den til i produksjonslista og status i programforslag-lista settes til booket. Booking-skjemaet legges til som vedlegg i begge lister

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

  sharepointGetListItemAlleProgramforslag: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Produksjon_som_
        return {
          testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
          prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
          searchFilter: `fields/acosRefId eq '${jsonData.Acos_RefId}'`
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Produksjon_som_
        if (!flowStatus.sharepointGetListItemAlleProgramforslag.result.length > 1) throw new Error(`Fant mer enn ett listeelement med innmelding-refId: ${jsonData.Acos_RefId}`)
        const alleProgramforslagListItem = flowStatus.sharepointGetListItemAlleProgramforslag.result[0]
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-MarkedforMusikk-MFMprogramrd/Lists/MFM%20Alle%20programforslag/AllItems.aspx',
            testItemId: alleProgramforslagListItem.id,
            prodItemId: alleProgramforslagListItem.id,
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Status: 'Booket'
            }
          },
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-MarkedforMusikk/Lists/Produksjoner/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: alleProgramforslagListItem.fields.Title,
              M_x00e5_lgruppe: `${alleProgramforslagListItem.fields.Alder_x0020_fra} - ${alleProgramforslagListItem.fields.Alder_x0020_til}`,
              Ut_x00f8_vere: alleProgramforslagListItem.fields.Ut_x00f8_vere_x0020_og_x0020_ins || 'Mangler utøvere',
              Kontaktinformasjonfraprogramfors: alleProgramforslagListItem.fields.Kontaktinformasjon || 'Mangler kontaktinformasjon',
              Produksjonsinfo_x0020_sceneansva: alleProgramforslagListItem.fields.Produksjonsinfo || 'Mangler produksjonsinfo',
              innmeldingAcosRefId: jsonData.Acos_RefId
            }
          }
        ]
      }
    }
  },

  statistics: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'SAMU',
          department: 'MFM',
          description,
          type: 'innmelding av produksjon' // Required. A short searchable type-name that distinguishes the statistic element
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
