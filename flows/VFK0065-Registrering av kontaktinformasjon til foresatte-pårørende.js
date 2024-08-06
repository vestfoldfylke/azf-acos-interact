const description = 'Sender til elevmappe'
// const { nodeEnv } = require('../config')
const { schoolInfo } = require('../lib/data-sources/vfk-schools')
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
      string Fornavn
      string Etternavn
      string Adresse
      string Postnr
      string Poststed
      string Mobilnr
      string Epost
      string AnsVirksomhet
      string AnsEpost
      string Tilgangsgruppe
      string Tittel
      string FiktivtFnr
      string SkoleOrgNr
      string Egendefinert1
      string Egendefinert2
      string Egendefinert3
}
  */

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
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.SkoleOrgNr)
        if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.SkoleOrgNr}`)
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
                Title: 'Kontaktinformasjon',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseNumber: xmlData.SkoleOrgNr,
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OF-VIS-nettverk-Vestfold-Kontaktopplysningerforesatt-prrende/Lists/Kontaktinformasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OF-VIS-nettverk-Vestfold-Kontaktopplysningerforesatt-prrende/Lists/Kontaktinformasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Navn,
              F_x00f8_dselsdato: xmlData.Fdato,
              Skole: xmlData.Skole,
              Klasse: xmlData.Klasse,
              Mobilelev: xmlData.MobilElev,
              E_x002d_postelev: xmlData.EpostElev,
              Navnp_x00e5_r_x00f8_rende1: xmlData.NavnP1,
              Navnp_x00e5_r_x00f8_rende2: xmlData.NavnP2,
              Relasjonp_x00e5_r_x00f8_rende1: xmlData.RelasjonP1,
              Relasjonp_x00e5_r_x00f8_rende2: xmlData.RelasjonP2,
              Mobilnummerp_x00e5_r_x00f8_rende: xmlData.MobilP1,
              Mobilp_x00e5_r_x00f8_rende2: xmlData.MobilP2,
              E_x002d_postp_x00e5_r_x00f8_rend: xmlData.EpostP1,
              E_x002d_postp_x00e5_r_x00f8_rend0: xmlData.EpostP2
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
