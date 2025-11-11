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
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Innsender_av_reiseregnin === 'Elev'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },
  // synkroniserer person hvis det ikke er en elev
  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Innsender_av_reiseregnin !== 'Elev'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
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
        const elevmappe = flowStatus.syncElevmappe?.result.elevmappe
        let caseNumber = ''
        let archive = 'Saksdokument'
        if (flowStatus.parseJson.result.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Innsender_av_reiseregnin !== 'Elev') {
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
            UnofficialTitle: `Dokumentasjon på reisekostnader - ${flowStatus.parseJson.result.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Reisen_gjelder}`,
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
        const jsonData = flowStatus.parseJson.result
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Reiseregninger%20elever/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/HORV-Nettskolenadm/Lists/Reiseregninger%20elever/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: new Date().toISOString().substring(0, 10),
              Fornavn: jsonData.SavedValues.Login.FirstName,
              Etternavn: jsonData.SavedValues.Login.LastName,
              Elev_x0020__x002f__x0020_annen: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Innsender_av_reiseregnin !== 'Elev' ? 'Annen' : 'Elev',
              Reisen_x0020_gjelder: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon.Reisen_gjelder,
              Avreise_x0020_data_x0020__x0028_: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon_til.Avreise_dato,
              Avreise_x0020_dato_x0020__x0028_: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon_fra.Avreise_dato2,
              Reisem_x00e5_te: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon_til.Reisemate,
              Reisem_x00e5_te_x0020__x0028_fra: jsonData.DialogueInstance.Reiseinformasjon2.Reiseinformasjon_fra.Reisemate2,
              Adresse: jsonData.SavedValues.Login.Address,
              Postnummer: jsonData.SavedValues.Login.PostalCode,
              Poststed: jsonData.SavedValues.Login.PostalArea,
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
