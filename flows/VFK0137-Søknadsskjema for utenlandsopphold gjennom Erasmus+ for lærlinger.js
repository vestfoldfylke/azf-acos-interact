const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
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
            AccessGroup: 'Erasmus+',
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
                Title: 'Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200017' : '200020', // Seksjon Kompetanse og pedagogisk utvikling
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger',
            // UnofficialTitle: '',
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: '',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Internasjonalisering/Lists/ErasmusSoknad',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr,
              Navn: xmlData.Navn,
              Adresse: xmlData.Adresse,
              Postnr_x002e__x002f_sted: xmlData.PostnrSted,
              Mobilnummer: xmlData.Mobilnr,
              E_x002d_post: xmlData.Epost,
              L_x00e6_refag: xmlData.Laerefag,
              L_x00e6_rekontraktfra: xmlData.LkontraktFra,
              L_x00e6_rekontrakttil: xmlData.LkontraktTil,
              L_x00e6_rested_x002f_arbeidsplas: xmlData.Laerested,
              Navnp_x00e5_veileder: xmlData.LaerestedNavnVeileder,
              Telefonveileder: xmlData.LaerestedTlfVeileder,
              Sterkesider: xmlData.SterkeSider,
              Hvaerdugodp_x00e5__x003f_: xmlData.GodPaa,
              Engelskkarakter: xmlData.Engelskkarakter,
              Fritidsinteresser: xmlData.Fritid,
              Hvorfor: xmlData.Hvorfor,
              Fagligutbytte: xmlData.FagligUtbytte,
              Utfordringer: xmlData.Utfordringer,
              Utenlandserfaring: xmlData.Utenlandserfaring,
              Godesider: xmlData.GodPaa,
              Land: xmlData.Land,
              _x0031__x002e_prioritet: xmlData.Pri1,
              _x0032__x002e_prioritet: xmlData.Pri2,
              Lengdep_x00e5_opphold: xmlData.Lengde,
              Allergier: xmlData.Allergier,
              Sykdom: xmlData.Sykdom,
              Oppl_x00e6_ringskontor: xmlData.OpplKontor,
              Tidligereskolegang: xmlData.Skole,
              Tidligerearbeidserfaring: xmlData.Reserve1

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
          department: 'Seksjon kompetanse og pedagogisk utvikling',
          description,
          type: 'Søknad om utenlandsopphold gjennom Erasmus+ for lærlinger', // Required. A short searchable type-name that distinguishes the statistic element
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
