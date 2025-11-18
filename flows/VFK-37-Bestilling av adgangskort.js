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
        const typeOfOrder = jsonData.Informasjon_om_bruker2.Bestilling.Bestillingen_gjelder
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OKO-konomi/Lists/Adgangskort%20%20bestillinger/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OKO-konomi/Lists/Adgangskort%20%20bestillinger/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Informasjon_om_bruker2.Gruppe5.Navn2,
              Bestillingen_x0020_gjelder: jsonData.Informasjon_om_bruker2.Bestilling.Bestillingen_gjelder,
              Navn_x0020_p_x00e5__x0020_nytils: jsonData.Nyansatt.Informasjon_om_bruker.Navn_pa_nytilsatt__forna,
              Seksjon_x0020__x0028_nytilsatt_x: jsonData.Nyansatt.Informasjon_om_bruker.Seksjon,
              Oppstartsdato_x0020__x0028_nytil: jsonData.Nyansatt.Informasjon_om_bruker.Oppstartsdato,
              Navn_x0020__x0028_mistet_x0020_k: (typeOfOrder === 'Mistet kort') ? jsonData.Mistet_kort.Informasjon_om_ansatt.Navn3 : '',
              Navn_x0020__x0028_printerkort_x0: jsonData.Printerkort_for_tannhels2.Informasjon_om_bruker3.Navn_pa_ansatt__fornavn_
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
          type: 'Bestilling av adgangskort' // Required. A short searchable type-name that distinguishes the statistic element
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
