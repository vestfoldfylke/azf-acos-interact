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
  string Fornavn
  string Etternavn
  string Adresse
  string Postnr
  string Sted
  string ElevAnnen
  string ReisenGjelder
  string AvreisedatoTil
  string AvreisedatoFra
  string Reisemate
  string Egendefinert1
  string Egendefinert2
}
  */

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.ElevAnnen === 'Elev'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },
  // synkroniserer person hvis det ikke er en elev
  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.ElevAnnen !== 'Elev'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa eller annen sak dersom det ikke er elev
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.ElevAnnen === 'Elev'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe?.result.elevmappe
        let caseNumber = ''
        let archive = 'Saksdokument'
        if (xmlData.ElevAnnen !== 'Elev') {
          if (nodeEnv === 'production') {
            caseNumber = '24/23483'
          } else {
            caseNumber = '24/00075'
          }
        } else { // Elev er avsender
          caseNumber = elevmappe.CaseNumber
          archive = 'Elevdokument'
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
            AccessCode: '26',
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
                Title: 'Reiseregning',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 26 femte ledd',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200341' : '200208', // Horten vgs nettskolen
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Dokumentasjon på reisekostnader',
            UnofficialTitle: `Dokumentasjon på reisekostnader - ${xmlData.ReisenGjelder}`,
            Archive: archive,
            CaseNumber: caseNumber
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Reiseregninger%20elever/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Reiseregninger%20elever/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: new Date().toISOString().substring(0, 10),
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Elev_x0020__x002f__x0020_annen: xmlData.ElevAnnen,
              Reisen_x0020_gjelder: xmlData.ReisenGjelder,
              Avreise_x0020_data_x0020__x0028_: xmlData.AvreisedatoTil,
              Avreise_x0020_dato_x0020__x0028_: xmlData.AvreisedatoFra,
              Reisem_x00e5_te: xmlData.ReisemateTil,
              Reisem_x00e5_te_x0020__x0028_fra: xmlData.ReisemateFra,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Poststed: xmlData.Sted,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber
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
          department: 'Nettskolen',
          description,
          type: 'Reiseregning elever', // Required. A short searchable type-name that distinguishes the statistic element
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
