const description = 'Søknad om midler til ABC for god psykisk helse'
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const ordning = jsonData.DialogueInstance.Beskrivelse_av_.Vi_søker_om_til.split(' ')[0] // henter første ordet som er navnet på ordningen
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
                Role: 'Avsender',
                ReferenceNumber: jsonData.DialogueInstance.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad om midler',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029', // Seksjon Samfunn og plan. Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'anne.slaatten@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: `Søknad om tilskuddsmidler - ABC for god psykisk helse - ${ordning}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/04622' : '25/00025'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/ABCsknad/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/ABCsknad/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_.Organisasjon.Organisasjonsna,
              Organisasjonsnummer: jsonData.Informasjon_om_.Organisasjon.Organisasjonsnu || 'Orgnummer mangler',
              Navnp_x00e5_kontaktperson: jsonData.Informasjon_om_.Kontaktinformas.Navn_på_kontakt,
              Rollekontaktperson: jsonData.Informasjon_om_.Kontaktinformas.Rolle,
              Mobil: jsonData.Informasjon_om_.Kontaktinformas.Mobilnummer,
              E_x002d_post: jsonData.Informasjon_om_.Kontaktinformas.E_postadresse,
              Tilskuddstype: jsonData.Beskrivelse_av_.Vi_søker_om_til.split(' ')[0], // henter første ordet som er navnet på ordningen
              Navnp_x00e5_tiltaket: jsonData.Beskrivelse_av_.Navn_på_arrange,
              M_x00e5_l: jsonData.Beskrivelse_av_.Mål_og_målgrupp, // Mål og målgruppe
              Innhold: jsonData.Beskrivelse_av_.Innhold_og_gjen || jsonData.Beskrivelse_av_.Innhold_og_gjen1, // Innhold_og_gjen1 / Innhold_og_gjen
              Tidspunkt: jsonData.Beskrivelse_av_.Tidspunkt, // null?
              Kampanjeperiode_x0020_fra: jsonData.Beskrivelse_av_.Kampanjeperiode,
              Kampanjeperiode_x0020_til: jsonData.Beskrivelse_av_.Kampanjeperiode1,
              Begrunnelse: jsonData.Beskrivelse_av_.Begrunnelse,
              Antall: jsonData.Beskrivelse_av_.Antall,
              Samarbeidspartnere: jsonData.Beskrivelse_av_.Samarbeidspartn,
              Forankring_x0020_i_x0020_ledelse: jsonData.Beskrivelse_av_.Forankring,
              Sum_x0020_kostnader: jsonData.Budsjett_og_fin.Utgifter.Sum_utgifter,
              Sum_x0020_inntekter: jsonData.Budsjett_og_fin.Inntekter.Sum_inntekter,
              S_x00f8_knadsbel_x00f8_p: jsonData.Budsjett_og_fin.Inntekter.Søknadsbeløp,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber
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
          company: 'Samfunnsutvikling',
          department: 'Seksjon Samfunn og plan',
          description,
          type: 'Søknad om midler til ABC for god psykisk helse', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
