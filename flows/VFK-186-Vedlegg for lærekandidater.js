const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
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
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const jsonData = flowStatus.parseJson.result
        let skole = false
        if (jsonData.DialogueInstance.Informasjon_om_.Om_skjemaet === 'Jeg fyller ut skjemaet sammen med YFF-lærer, kontaktlærer eller rådgiver') { // Skolen skal være ansvarlig og ha tilgang
          skole = true
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
        const documentData = {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '13',
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
                Title: 'Vedlegg for lærekandidater',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200016' : '200019', // Fagopplæring
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Vedlegg for lærekandidater',
            // UnofficialTitle: '',
            Archive: 'Sensitivt elevdokument',
            CaseNumber: elevmappe.CaseNumber
          }
        }
        if (skole === false) {
          // documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200016' : '200019' // Fagopplæring
          documentData.parameter.AccessGroup = 'Fagopplæring'
        } else if (skole === true) {
          const school = schoolInfo.find(school => school.orgNr.toString() === jsonData.SavedValues.Dataset.Velg_hvilken_sk.Orgnr)
          if (!school) throw new Error(`Could not find any school with orgnr: ${jsonData.SavedValues.Dataset.Velg_hvilken_sk.Orgnr}`)
          // documentData.parameter.ResponsibleEnterpriseNumber = jsonData.SavedValues.Dataset.Velg_hvilken_sk.Orgnr
          documentData.parameter.AccessGroup = school.tilgangsgruppe
        } else {
          throw new Error('Finner ikke ut om dette er fagopplæring eller en skole. Sjekk logikk')
        }
        return documentData
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Vedlegg%20for%20lrekandidater/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Vedlegg%20for%20lrekandidater/AllItems.aspx',
            uploadFormPdf: false,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.UserID.substring(0, 6) || 'Mangler fdato', // husk å bruke internal name på kolonnen
              Fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName,
              Etternavn: flowStatus.parseJson.result.SavedValues.Login.LastName,
              Skole: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Velg_hvilken_sk,
              L_x00e6_refag: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Hvilket_lærefag,
              Doknr360: flowStatus.archive.result.DocumentNumber
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
          department: 'Fag- og yrkesopplæring',
          description,
          type: 'Vedlegg for lærekandidater', // Required. A short searchable type-name that distinguishes the statistic element
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
