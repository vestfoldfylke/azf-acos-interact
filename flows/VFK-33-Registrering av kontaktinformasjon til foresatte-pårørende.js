const description = 'Sender til elevmappe'
// const { nodeEnv } = require('../config')
const { schoolInfo } = require('../lib/data-sources/vfk-schools')
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

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const school = schoolInfo.find(school => school.orgNr.toString() === jsonData.SavedValues.Dataset.Skole1.Orgnr)
        if (!school) throw new Error(`Could not find any school with orgNr: ${jsonData.SavedValues.Dataset.Skole1.Orgnr}`)
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
            AccessCode: '13',
            AccessGroup: school.tilgangsgruppe,
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Login.UserID,
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Kontaktinformasjon',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseNumber: jsonData.SavedValues.Dataset.Skole1.Orgnr,
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Kontaktinformasjon',
            // UnofficialTitle: `Kontaktinformasjon - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
            Archive: 'Elevdokument',
            CaseNumber: elevmappe.CaseNumber
          }
        }
      }
    }

  },

  signOff: {
    enabled: true
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OF-VIS-nettverk-Vestfold-Kontaktopplysningerforesatt-prrende/Lists/Kontaktinformasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OF-VIS-nettverk-Vestfold-Kontaktopplysningerforesatt-prrende/Lists/Kontaktinformasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Informasjon_om_1.Informasjon_om_2.Fornavn4} ${jsonData.Informasjon_om_1.Informasjon_om_2.Etternavn2}`,
              F_x00f8_dselsdato: jsonData.Informasjon_om_1.Informasjon_om_2.Fodselsnummer1.substring(0, 6) || 'Mangler fdato',
              Skole: jsonData.Informasjon_om_1.Skole_og_klasse1.Skole1,
              Klasse: jsonData.Informasjon_om_1.Skole_og_klasse1.Klasse1,
              Mobilelev: jsonData.Informasjon_om_1.Informasjon_om_2.Mobiltelefonnr4,
              E_x002d_postelev: jsonData.Informasjon_om_1.Informasjon_om_2.Epost1,
              Navnp_x00e5_r_x00f8_rende1: `${jsonData.Informasjon_om_2.Informasjon_om_3.Fornavn2} ${jsonData.Informasjon_om_2.Informasjon_om_3.Etternavn}`,
              Navnp_x00e5_r_x00f8_rende2: `${jsonData.Informasjon_om_2.Informasjon_om_1.Fornavn3} ${jsonData.Informasjon_om_2.Informasjon_om_1.Etternavn1}`,
              Relasjonp_x00e5_r_x00f8_rende1: jsonData.Informasjon_om_2.Hvilken_relasjo,
              Relasjonp_x00e5_r_x00f8_rende2: jsonData.Informasjon_om_2.Hvilken_relasjo1,
              Mobilnummerp_x00e5_r_x00f8_rende: jsonData.Informasjon_om_2.Informasjon_om_3.Mobiltelefonnr2,
              Mobilp_x00e5_r_x00f8_rende2: jsonData.Informasjon_om_2.Informasjon_om_1.Mobiltelefonnr3,
              E_x002d_postp_x00e5_r_x00f8_rend: '',
              E_x002d_postp_x00e5_r_x00f8_rend0: '',
              F_x00f8_dselsnummerp_x00e5_r_x00: jsonData.Informasjon_om_2.Informasjon_om_3.Fødselsnummer,
              F_x00f8_dselsnummerp_x00e5_r_x000: jsonData.Informasjon_om_2.Informasjon_om_1.Fødselsnummer1
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
          company: 'Opplæring',
          department: '',
          description,
          type: 'Kontaktinformasjon', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber //  || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
