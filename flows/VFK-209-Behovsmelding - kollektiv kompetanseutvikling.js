const description = 'Behovsmelding - kollektiv kompetanseutvikling'
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
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Innsender_og_sa.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
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
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Innsender_og_sa.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
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
                Title: 'Behovsmelding - kollektiv kompetanseutvikling',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: 'Behovsmelding - kollektiv kompetanseutvikling',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '26/04878' : '26/00025',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200017' : '200020', // Seksjon Kompetanse og pedagogisk utvikling - Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: 'tonje.hareide@vestfoldfylke.no',
            AccessCode: 'U',
            Paragraph: '',
            AccessGroup: 'Alle'
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Behovsmelding/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Behovsmelding/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber,
              Organisasjonsnavn: jsonData.Innsender_og_sa.Organisasjon.Organisasjonsna,
              Organisasjonsnummer: jsonData.Innsender_og_sa.Organisasjon.Organisasjonsnu,
              Samarbeidspartner: jsonData.Innsender_og_sa.Samarbeidspartn.map(partner => `${partner.Navn_på_organia} (${partner.Kontaktperson})`).join(', '),
              Tiltak: jsonData.Informasjon_om_1.Hva_slags_tilta,
              M_x00e5_lgruppe: jsonData.Informasjon_om_1.Hvem_er_deltake, // Deltakere
              M_x00e5_l: jsonData.Informasjon_om_1.Hva_er_forvente,
              Forankring: jsonData.Informasjon_om_1.Hvordan_er_tilt,
              S_x00f8_knadsbel_x00f8_p: jsonData.Økonomi_og_andr.Hvilket_beløp_s,
              Egeninnsats: jsonData.Økonomi_og_andr.Legg_inn_en_bes,
              Navnp_x00e5_s_x00f8_ker: `${jsonData.Innsender_og_sa.Innsender.Fornavn1} ${jsonData.Innsender_og_sa.Innsender.Etternavn1}`
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
          company: 'Kultur',
          department: '',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskudd til idrettsarrangement og regionale idrettsanlegg', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
