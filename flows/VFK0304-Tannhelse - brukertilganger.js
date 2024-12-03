const description = 'Oppretter rad i SP liste. Raden blir oppdatert med status-data etterhvert som andre skjema i samme flyt blir avlevert'
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse/Lists/Tilgangsbestillinger/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.nyTilgangNavn || 'Mangler navn', // husk å bruke internal name på kolonnen
              Stillingstittel: xmlData.nyTilgangStillingstittel,
              E_x002d_postadresse: xmlData.nyTilgangEpost,
              Tannklinikk_x0028_er_x0029_: xmlData.nyTilgangTannklinikker,
              Bestiller: xmlData.bestillerNavn,
              Tilgang_x0020_til_x0020_Visma: xmlData.nyTilgangVisma === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              Tilgang_x0020_til_x0020_360: xmlData.nyTilgangP360 === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              Printerkort_x0020_med_x0020_ID: xmlData.nyTilgangPrinterkort === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              Tilgang_x0020_til_x0020_Altinn: xmlData.nyTilgangAltinn === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              Tilgang_x0020_til_x0020_epostmot: xmlData.nyTilgangEpostmottak === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              Tilgangtiltraverseringsdisk: xmlData.nyTilgangTraverseringsdisk === 'true' ? `Bestilt (${xmlData.tidspunkt})` : 'Ikke bestilt',
              guid0: xmlData.guid
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
          type: 'Tannhelse - bestilling av tilganger' // Required. A short searchable type-name that distinguishes the statistic element
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
