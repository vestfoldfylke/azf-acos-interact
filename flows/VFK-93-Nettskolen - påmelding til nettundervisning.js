const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
// const { schoolInfo } = require('../lib/data-sources/vfk-schools')
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
        let fnr
        if (flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Informasjon_om_utfyller.Jeg_fyller_ut === 'på vegne av meg selv (jeg er elev)') {
          fnr = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Informasjon_om_utfyller.Fodselsnummer
        } else {
          fnr = flowStatus.parseJson.result.DialogueInstance.Informasjon_om_elev.Informasjon_om_eleven.Fodselsnummer2
        }
        return {
          ssn: fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa
  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
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
            AccessGroup: 'Nettskolen',
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
                Title: 'Påmelding til nettundervisning',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200341' : '200208', // Horten vgs nettskolen
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Påmelding til nettundervisning',
            UnofficialTitle: 'Påmelding til nettundervisning',
            Archive: 'Elevdokument',
            CaseNumber: elevmappe.CaseNumber
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
        let utfyllerErElev
        if (jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Jeg_fyller_ut === 'på vegne av meg selv (jeg er elev)') {
          utfyllerErElev = true
        } else {
          utfyllerErElev = false
        }
        let vgs
        if (jsonData.Informasjon_om_elev.Bakgrunnsinform.I_hvilket_fylke_bor_elev === 'Vestfold') {
          if (jsonData.Informasjon_om_elev.Bakgrunnsinform.Hvilken_skole_gar_eleven === 'Annen skole (for eks. OT)') {
            vgs = jsonData.Informasjon_om_elev.Bakgrunnsinform.Skolenavn
          } else {
            vgs = jsonData.Informasjon_om_elev.Bakgrunnsinform.Hvilken_skole_gar_eleven2
          }
        } else {
          vgs = jsonData.Informasjon_om_elev.Bakgrunnsinform.Hvilken_skole_gar_eleven
        }
        const sharepointElements = []
        const fagString = jsonData.Fag.Fag.Velg_fag
        const fagliste = fagString.split(',').map(fag => fag.trim())
        // const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Paameldingnettundervisning1/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Paameldingnettundervisning1/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Fodselsnummer : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Fodselsnummer2,
              Fornavnelev: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Fornavn : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Fornavn2,
              Etternavnelev: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Etternavn : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Etternavn2,
              Fylke: jsonData.Informasjon_om_elev.Bakgrunnsinform.I_hvilket_fylke_bor_elev,
              Skole: vgs,
              Elevensmobilnr_x002e_: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Mobilnummer : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Mobiltelefonnr,
              Elevensadresse: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Adresse : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Adresse2,
              Elevenspostnr_x002e_: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Postnummer_sted_postnr : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Postnr_sted_postnr,
              Elevenspoststed: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Postnummer_sted_poststed : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Postnr_sted_poststed,
              Elevense_x002d_post: utfyllerErElev ? jsonData.Informasjon_om_elev.Informasjon_om_utfyller.E_postadresse : jsonData.Informasjon_om_elev.Informasjon_om_eleven.Epost,
              Utfyltav: jsonData.Informasjon_om_elev.Informasjon_om_utfyller.Jeg_fyller_ut,
              Kontaktpersonensfornavn: jsonData.Informasjon_om_elev.Informasjon_om_kontaktpe.Fornavn3,
              Kontaktpersonensetternavn: jsonData.Informasjon_om_elev.Informasjon_om_kontaktpe.Etternavn3,
              Foresatt1fornavn: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Fornavn4,
              Foresatt1etternavn: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Etternavn4,
              Foresatt1mobilnr_x002e_: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Mobilnummer2,
              Foresatt1e_x002d_post: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.E_postadresse2,
              Foresatt1adresse: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Adresse3,
              Foresatt1postnr_x002e_: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Postnummer_sted2_postnr,
              Foresatt1poststed: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt.Postnummer_sted2_poststed,
              Foresatt2fornavn: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Fornavn5,
              Foresatt2etternavn: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Etternavn5,
              Foresatt2mobilnr_x002e_: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Mobilnummer3,
              Foresatt2e_x002d_post: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.E_postadresse3,
              Foresatt2adresse: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Adresse4,
              Foresatt2postnr_x002e_: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Postnummer_sted3_postnr,
              Foresatt2poststed: jsonData.Informasjon_om_elev.Opplysninger_om_foresatt2.Postnummer_sted3_poststed,
              Fylkeskommunensfakturaadresse: jsonData.Informasjon_om_elev.Bakgrunnsinform.Fylkeskommunens_fakturaa,
              Skolensfakturainformasjon: jsonData.Informasjon_om_elev.Bakgrunnsinform.Skolens_fakturainformasj,
              Fag: fag
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
  },
  groundControl: {
    enabled: false // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Nettskolen',
          description,
          type: 'Nettskolen - påmelding til nettundervisning', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber // || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
