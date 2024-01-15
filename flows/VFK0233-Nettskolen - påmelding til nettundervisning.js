const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
// const { schoolInfo } = require('../lib/data-sources/vfk-schools')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
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
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            testListUrl: '',
            prodListUrl: '',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Etternavn || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavns_x00f8_ker: xmlData.Fornavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: xmlData.PostnrSted,
              Mobilnummer: xmlData.Mobilnr,
              E_x002d_postadresse: xmlData.Epost,
              Bostedsfylke: xmlData.Fylke,
              Kurstidspunkt: xmlData.Kurstidspunkt,
              Fagvalg: fag.Fagnavn
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
  },
  groundControl: {
    enabled: true // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
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
