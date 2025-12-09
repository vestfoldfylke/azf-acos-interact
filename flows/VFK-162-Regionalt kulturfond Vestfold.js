const description = 'Regionalt kulturfond Vestfold'
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon1.Organisasjonsnu1.replaceAll(' ', '')
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
            Project: nodeEnv === 'production' ? '25-176' : '25-4',
            Title: `Regionalt Kulturfond Vestfold - ${jsonData.Beskrivelse_av_.Om_prosjektet.Søknadskategori} - ${jsonData.Beskrivelse_av_.Om_prosjektet.Navn_på_prosjek} - ${jsonData.Informasjon_om_.Organisasjon1.Organisasjonsna1}`,
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
  // Arkiverer dokumentet i 360
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
                ReferenceNumber: jsonData.Informasjon_om_.Organisasjon1.Organisasjonsnu1.replaceAll(' ', ''),
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
                Title: 'Søknad om midler fra Regionalt Kulturfond Vestfold',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om midler fra Regionalt Kulturfond Vestfold - ${jsonData.Beskrivelse_av_.Om_prosjektet.Søknadskategori} - ${jsonData.Beskrivelse_av_.Om_prosjektet.Navn_på_prosjek}`,
            // UnofficialTitle: 'Søknad om utsetting av ferskvannsfisk',
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Regionalt%20kulturfond%202026/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Regionalt%20kulturfond%202026/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Informasjon_om_.Organisasjon1.Organisasjonsna1, // husk å bruke internal name på kolonnen
              Organisasjonsnummer: jsonData.Informasjon_om_.Organisasjon1.Organisasjonsnu1,
              Kontaktperson_x0020_fornavn: jsonData.Informasjon_om_.Kontaktperson1.Fornavn2,
              Kontaktperson_x0020_etternavn: jsonData.Informasjon_om_.Kontaktperson1.Etternavn2,
              e_x002d_post: jsonData.Informasjon_om_.Kontaktperson1.E_post1,
              Kategori: jsonData.Beskrivelse_av_.Om_prosjektet.Søknadskategori,
              Navn_x0020_p_x00e5__x0020_prosje: jsonData.Beskrivelse_av_.Om_prosjektet.Navn_på_prosjek,
              Kort_x0020_beskrivelse: jsonData.Beskrivelse_av_.Om_prosjektet.Kort_beskrivels,
              Prosjektperiode_x0020_fra: jsonData.Beskrivelse_av_.Om_prosjektet.Prosjektperiode,
              Prosjektperiode_x0020_til: jsonData.Beskrivelse_av_.Om_prosjektet.Prosjektperiode1,
              Samarbeidspartnere: jsonData.Beskrivelse_av_.Om_prosjektet.Samarbeidspartn,
              M_x00e5_lgruppe: jsonData.Beskrivelse_av_.Om_prosjektet.Målgruppe_for_p,
              Fullstendig_x0020_beskrivelse: jsonData.Beskrivelse_av_.Om_prosjektet.Fullstendig_bes,
              M_x00e5_lsetting: jsonData.Beskrivelse_av_.Mål_og_effekter.Beskriv_prosjek,
              Medvirkning: jsonData.Beskrivelse_av_.Mål_og_effekter.Medvirkning_fra,
              _x00d8_kt_x0020_kvalitet: jsonData.Beskrivelse_av_.Mål_og_effekter.Hvordan_bidrar_,
              _x00d8_kt_x0020_samarbeid: jsonData.Beskrivelse_av_.Mål_og_effekter.Hvordan_bidrar_3,
              _x00d8_kt_x0020_bredde: jsonData.Beskrivelse_av_.Mål_og_effekter.Hvordan_bidrar_4,
              Evaluering: jsonData.Beskrivelse_av_.Mål_og_effekter.Evaluering,
              Milj_x00f8__x0020_og_x0020_b_x00: jsonData.Beskrivelse_av_.Mål_og_effekter.Miljø_og_bærekr,
              S_x00f8_knadsbel_x00f8_p: jsonData.Budsjett__finan.Søknadsbeløp2.Søknadsbeløp3,
              Kontonummer: jsonData.Budsjett__finan.Søknadsbeløp2.Kontonummer,
              Sum_x0020_inntekter: jsonData.Budsjett__finan.Sum_inntekter,
              Sum_x0020_utgifter: jsonData.Budsjett__finan.Sum_utgifter,
              Dokumentnummer_x0020_i_x0020_p36: flowStatus.archive.result.DocumentNumber,
              Acos_x0020_RefId: flowStatus.parseJson.result.Metadata.ReferenceId.Value || 'Ingen Acos RefId',
              Kommune: jsonData.Beskrivelse_av_.Om_prosjektet.Hvor_foregår_ak || 'Ingen kommuner valgt'
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
          type: 'Regionalt kulturfond Vestfold', // Required. A short searchable type-name that distinguishes the statistic element
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
