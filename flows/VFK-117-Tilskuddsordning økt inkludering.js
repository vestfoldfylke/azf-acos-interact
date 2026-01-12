const description = 'Tilskuddsordning økt inkludering'
const { nodeEnv } = require('../config')

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

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_soker4.Informasjon_om_soker3.Organisasjon1.Organisasjonsnu1.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '25-179' : '25-8',
            Title: `Tilskuddsordning økt inkludering 2026 - ${jsonData.Informasjon_om_prosjekt.Gruppe.Navn_pa_prosjekt2} - ${jsonData.Informasjon_om_soker4.Informasjon_om_soker3.Organisasjon1.Organisasjonsna1}`,
            // UnofficialTitle: ,
            Status: 'B',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Sakarkiv',
            ArchiveCodes: [
              {
                ArchiveCode: '243',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'C00',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'yvonne.pleym@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessGroup: 'Alle'
          }
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.Informasjon_om_soker4.Informasjon_om_soker3.Organisasjon1.Organisasjonsnu1.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad - Tilskuddsordning for økt inkludering',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad - Tilskuddsordning for økt inkludering - ${jsonData.Informasjon_om_soker4.Informasjon_om_soker3.Organisasjon1.Organisasjonsna1}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'yvonne.pleym@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: 'U'
            // Paragraph: 'Offl. § 26 femte ledd',
            // AccessGroup: 'Seksjon Kulturarv'
          }
        }
      }
    }

  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskuddsordning%20kt%20inkludering/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskuddsordning%20kt%20inkludering/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive?.result?.DocumentNumber || 'Ikke arkivert', // husk å bruke internal name på kolonnen
              S_x00f8_ker: jsonData.Informasjon_om_soker4.Informasjon_om_soker3.Organisasjon1.Organisasjonsna1,
              Prosjektnavn: jsonData.Informasjon_om_prosjekt.Gruppe.Navn_pa_prosjekt2,
              Prosjektperiode: jsonData.Informasjon_om_prosjekt.Gruppe.Prosjektperiode2,
              Hvor_x0020_gjennomf_x00f8_res_x0: jsonData.Informasjon_om_prosjekt.Gruppe.Hvor_gjennomfør,
              M_x00e5_logm_x00e5_lgruppe: jsonData.Informasjon_om_prosjekt.Gruppe.Prosjektets_mal_og_malgr2,
              Medvirkning: jsonData.Informasjon_om_prosjekt.Gruppe.Medvirkning_med_malgrupp2,
              Beskrivelse: jsonData.Informasjon_om_prosjekt.Gruppe.Beskrivelse_av_prosjekt_2,
              Evaluering: jsonData.Informasjon_om_prosjekt.Gruppe.Evaluering_2,
              Videref_x00f8_ring: jsonData.Informasjon_om_prosjekt.Gruppe.Videreforing2,
              Milj_x00f8__x0020_og_x0020_b_x00: jsonData.Informasjon_om_prosjekt.Gruppe.Miljo_og_barekraft2,
              Hvor_x0020_mange_x0020_personer: jsonData.Informasjon_om_prosjekt.Gruppe.Hvor_mange_pers,
              Kortoppsummeringavprosjektet: jsonData.Prosjektoppsummering.Oppsummering_av_prosjekt.Kort_oppsummering_av_pro2,
              S_x00f8_knadssum: jsonData._konomi.Søknadssum_førs.Soknadssum_til_fylkeskom,
              S_x00f8_knadssum_x0020__x00e5_r_: jsonData._konomi.Søknadssum_andr.Soknadssum_til_
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samfunnsutvikling',
          department: 'Kultur',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskuddsordning for økt inkludering', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive?.result?.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
