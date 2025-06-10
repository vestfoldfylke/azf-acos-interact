const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
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
      bool TilArkiv
      string Fnr
      string Fornavn
      string Etternavn
      string Adresse
      string PostnummerSted
      string Postnr
      string Poststed
      string Mobil
      string Epost
      string Eksamenssted
      string TypeDok
      string TypeAut
      string OnsketMottak
      string Status
      string Saksbehandler
      string Fag
      string AarSemester
      string AltAdresse
      string AnsVirksomhet
    }
  */

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },
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
        const documentData = {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '13',
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
                Title: 'Bestilling av dokumentasjon for privatister',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            Status: 'J',
            Title: 'Bestilling av dokumentasjon for privatister',
            // UnofficialTitle: '',
            Archive: 'Elevdokument',
            CaseNumber: elevmappe.CaseNumber
          }
        }

        if (xmlData.eksamenskontoret === 'true') {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200015' : '200018' // Seksjon Sektorstøtte, inntak og eksamen
          documentData.parameter.AccessGroup = 'Eksamen'
        } else if (xmlData.eksamenskontoret === 'false') {
          const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.AnsVirksomhet)
          if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.AnsVirksomhet}`)
          documentData.parameter.ResponsibleEnterpriseNumber = xmlData.AnsVirksomhet
          documentData.parameter.AccessGroup = school.tilgangsgruppe
        } else {
          throw new Error('Finner ikke ut om dette er eksamenskontoret eller en skole. Sjekk logikk')
        }
        console.log(documentData)
        return documentData
      }
    }

  },
  /*
  // Arkiverer dokumentet i elevmappa
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        let tilgangsgruppe
        let eksamenskontoret = false
        if (flowStatus.parseXml.result.ArchiveData.eksamenskontoret === 'true') {
          eksamenskontoret = true
          tilgangsgruppe = 'Eksamen'
        } else {
          const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.AnsVirksomhet)
          if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.AnsVirksomhet}`)
          tilgangsgruppe = school.tilgangsgruppe
        }

        // if (!eksamenskontoret) {
        //  const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.AnsVirksomhet)
        //  if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.AnsVirksomhet}`)
        // }
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
            AccessGroup: tilgangsgruppe,
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
                Title: 'Bestilling av dokumentasjon for privatister',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            if (eksamenskontoret) {
              ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            } else {
              ResponsibleEnterpriseNumber: xmlData.AnsVirksomhet,
            },
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Bestilling av dokumentasjon for privatister',
            // UnofficialTitle: '',
            Archive: 'Elevdokument',
            CaseNumber: elevmappe.CaseNumber
          }
        }
      }
    }

  },
*/
  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  sharepointList: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.eksamenskontoret === 'true' // de som skal til skolene skal ikke i lista
      },
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Privatistdokumentasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Privatistdokumentasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr,
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: xmlData.PostnummerSted,
              Mobilnummer: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorisasjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode_x0028_semester_x: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse,
              Avgangs_x00e5_r: xmlData.avgAr,
              Utdanningsprogram: xmlData.utdProg,
              Spr_x00e5_k: xmlData.sprak,
              Bestillingen_x0020_gjelder_x0020: xmlData.bestGjelder
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
          department: 'Eksamen',
          description,
          type: 'Bestilling av dokumentasjon for privatister', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
