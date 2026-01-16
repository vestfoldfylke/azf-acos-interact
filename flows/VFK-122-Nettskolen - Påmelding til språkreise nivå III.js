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
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        // const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.SkoleOrgNr)
        // if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.SkoleOrgNr}`)
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '13',
            AccessGroup: 'Nettskolen',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.SavedValues.Login.UserID,
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
                Title: 'Påmelding',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200341' : '200208', // Horten vgs nettskolen
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Påmelding til språkreise nivå III',
            // UnofficialTitle: `Påmelding til språkreise nivå III`,
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
        const jsonData = flowStatus.parseJson.result
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Pmelding%20til%20sprkreise%20niv%20III/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Pmelding%20til%20sprkreise%20niv%20III/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.SavedValues.Login.LastName,
              Fornavn: jsonData.SavedValues.Login.FirstName,
              Fag: jsonData.DialogueInstance.Påmelding.Fag.Svaret_gjelder_faget,
              Deltagelse: jsonData.DialogueInstance.Påmelding.Fag.Jeg_bekrefter_at_jeg_ska,
              Bekreftelse_x0020_ved_x0020_avme: jsonData.DialogueInstance.Påmelding.Bekreftelse1.Jeg_har_forståt,
              Bekreftelse_x0020_av_x0020_regle: jsonData.DialogueInstance.Påmelding.Bekreftelse1.Jeg_bekrefter_a,
              Over_x0020_18: jsonData.DialogueInstance.Påmelding.Bekreftelse1.Jeg_er_over_18_ar_pa_rei,
              Bekreftelse_x0020_fra_x0020_fore: jsonData.DialogueInstance.Påmelding.Bekreftelse1.Dersom_jeg_ikke_er_over_
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
          type: 'Påmelding til språkreise nivå III', // Required. A short searchable type-name that distinguishes the statistic element
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
