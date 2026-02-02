const description = 'Kunstner- og toppidrettsstipend'
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

  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let caseNumber
        let archiveTitle
        let responsible
        if (jsonData.Informasjon_om_soker2.Fylkeskommunale_stipend.Jeg_soker === 'Toppidrettsstipend') {
          archiveTitle = `Søknad om idrettsstipend - ${jsonData.Informasjon_om_soker2.Klubbtilhorighet___idret}`
          caseNumber = nodeEnv === 'production' ? '26/04126' : '24/00018'
          responsible = 'baard.andresen@vestfoldfylke.no'
        } else if (jsonData.Informasjon_om_soker2.Fylkeskommunale_stipend.Jeg_soker === 'Kunstnerstipend') {
          archiveTitle = `Søknad om kunstnerstipend - ${jsonData.Informasjon_om_soker2.Kunstart___sjanger_}`
          caseNumber = nodeEnv === 'production' ? '26/03967' : '24/00017'
          responsible = 'yvonne.pleym@vestfoldfylke.no'
        } else {
          throw new Error('Kategori må være enten Toppidrettsstipend eller Kunstnerstipend')
        }
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
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: archiveTitle,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: archiveTitle,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? responsible : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: '5',
            Paragraph: 'Offl. § 5',
            AccessGroup: 'Seksjon Kultur'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-Ekstern-Toppidrettsstipend/Lists/SoknadKunstnerToppidrettsstipend/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-Ekstern-Toppidrettsstipend/Lists/SoknadKunstnerToppidrettsstipend/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Informasjon_om_soker2.Kontaktopplysni.Fornavn1} ${jsonData.Informasjon_om_soker2.Kontaktopplysni.Etternavn1}`,
              Kategori: jsonData.Informasjon_om_soker2.Fylkeskommunale_stipend.Jeg_soker,
              Idrettsgren_x002f_Kunstuttrykk: jsonData.Informasjon_om_soker2.Kunstart___sjanger_ || jsonData.Informasjon_om_soker2.Klubbtilhorighet___idret,
              F_x00f8_dselsdato: flowStatus.parseJson.result.SavedValues.Login.UserID.substring(0, 6),
              Hva: jsonData.Soknad_om_stipend.Søknad_om_stipe.Hva_sokes_det_stipend_ti2,
              S_x00f8_knadssum: jsonData.Budsjett.Gruppe4.Soknadssum_til_fylkeskom,
              M_x00e5_lsetting: jsonData.Soknad_om_stipend.Søknad_om_stipe.Malsetting_med_stipendet2,
              Fjor_x00e5_ret: jsonData.Soknad_om_stipend.Søknad_om_stipe.Beskrivelse_av_siste_ars2
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
          department: 'Kulturarv',
          description, // Required. A description of what the statistic element represents
          type: 'Kunstner- og toppidrettsstipend', // Required. A short searchable type-name that distinguishes the statistic element
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
