const description = 'Sender til Sharepoint'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OKO-konomi/Lists/Visitkort%20%20bestillinger/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OKO-konomi/Lists/Visitkort%20%20bestillinger/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Bestilling.Norsk.Navn,
              Type_x0020_kort: jsonData.Bestilling.Type_kort.Velg_type_visit,
              Ansvarsnummer: jsonData.Bestilling.Type_kort.ID_nummer_ansvarsnummer_,
              Stillingstittel: jsonData.Bestilling.Norsk.Stillingstittel,
              Seksjon: jsonData.Bestilling.Norsk.Seksjon,
              Mobil: jsonData.Bestilling.Norsk.Mobiltelefonnummer,
              E_x002d_post: jsonData.Bestilling.Norsk.E_post,
              Name: jsonData.Bestilling.Engelsk.Name,
              Title0: jsonData.Bestilling.Engelsk.Title,
              Department: jsonData.Bestilling.Engelsk.Department,
              Mobile: jsonData.Bestilling.Engelsk.Mobile,
              E_x002d_mail: jsonData.Bestilling.Engelsk.E_mail
              // Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
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
          company: 'Økonomi',
          department: 'Økonomi',
          description,
          type: 'Bestilling av visittkort' // Required. A short searchable type-name that distinguishes the statistic element
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
