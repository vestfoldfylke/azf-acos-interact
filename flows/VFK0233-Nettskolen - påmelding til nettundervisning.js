const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
// const { schoolInfo } = require('../lib/data-sources/vfk-schools')
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
  /* Felter fra Acos:
ArchiveData {
    string Fnr
    string Tittel
    string Fornavn
    string Etternavn
    string Adresse
    string Postnr
    string Poststed
    string Mobilnr
    string Epost
    string Fylke
    string UtfyltAv
    string KontaktpersonFornavn
    string KontaktpersonEtternavn
    string AnsVirksomhet
    string Tilgangsgruppe
    string Skole
    string Foresatt1Fornavn
    string Foresatt1Etternavn
    string Foresatt1Adresse
    string Foresatt1Postnr
    string Foresatt1Poststed
    string Foresatt2Fornavn
    string Foresatt2Etternavn
    string Foresatt2Adresse
    string Foresatt2Postnr
    string Foresatt2Poststed
    string Foresatt1Mobilnr
    string Foresatt2Mobilnr
    string Foresatt1Epost
    string Foresatt2Epost
    string ElevFdato
    string Samtykke
    string Fakturaadresse
    string Fakturainformasjon
    fagliste[] ValgteFag
      fagliste{
        string Fagnavn
      }

}

  */

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
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
            AccessGroup: 'Elev Horten vgs',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Paameldingnettundervisning1/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Paameldingnettundervisning1/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavnelev: xmlData.Fornavn,
              Etternavnelev: xmlData.Etternavn,
              Fylke: xmlData.Fylke,
              Skole: xmlData.Skole,
              Elevensmobilnr_x002e_: xmlData.Mobilnr,
              Elevensadresse: xmlData.Adresse,
              Elevenspostnr_x002e_: xmlData.Postnr,
              Elevenspoststed: xmlData.Poststed,
              Elevense_x002d_post: xmlData.Epost,
              Utfyltav: xmlData.UtfyltAv,
              Kontaktpersonensfornavn: xmlData.KontaktpersonFornavn,
              Kontaktpersonensetternavn: xmlData.KontaktpersonEtternavn,
              Foresatt1fornavn: xmlData.Foresatt1Fornavn,
              Foresatt1etternavn: xmlData.Foresatt1Etternavn,
              Foresatt1mobilnr_x002e_: xmlData.Foresatt1Mobilnr,
              Foresatt1e_x002d_post: xmlData.Foresatt1Epost,
              Foresatt1adresse: xmlData.Foresatt1Adresse,
              Foresatt1postnr_x002e_: xmlData.Foresatt1Postnr,
              Foresatt1poststed: xmlData.Foresatt1Poststed,
              Foresatt2fornavn: xmlData.Foresatt2fornavn,
              Foresatt2etternavn: xmlData.Foresatt2Etternavn,
              Foresatt2mobilnr_x002e_: xmlData.Foresatt2Mobilnr,
              Foresatt2e_x002d_post: xmlData.Foresatt2Epost,
              Foresatt2adresse: xmlData.Foresatt2Adresse,
              Foresatt2postnr_x002e_: xmlData.Foresatt2Postnr,
              Foresatt2poststed: xmlData.Foresatt2Poststed,
              Fylkeskommunensfakturaadresse: xmlData.Fakturaadresse,
              Skolensfakturainformasjon: xmlData.Fakturainformasjon,
              Fag: fag.Fagnavn
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
