const description = 'Sender til elevmappe (lager elevmappe basert på at eleven kommer fra utlandet='
const { nodeEnv } = require('../config')
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
      mapper: (flowStatus) => { // for å opprette person manuelt uten oppslag i Freg (Eks. utenlandske elever)
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Har_du_norsk_fodselsnumm === 'Nei') {
          const dateList = flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Fodselsdato.split('.')
          const newDate = `${dateList[2]}-${dateList[1]}-${dateList[0]}`
          let gender
          if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Kjonn === 'Mann') {
            gender = 'm'
          } else if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Kjonn === 'Kvinne') {
            gender = 'f'
          } else {
            throw new Error('Kjønn må være enten Mann eller Kvinne')
          }
          const payload = {
            fakeSsn: true,
            manualData: true,
            birthdate: newDate,
            gender,
            firstName: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Fornavn,
            lastName: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Etternavn,
            streetAddress: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Adresse || 'Ukjent adresse',
            zipCode: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Postnr_sted_postnr || '9999',
            zipPlace: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Poststed || 'Ukjent poststed',
            forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
          }
          return payload
        } else if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Har_du_norsk_fodselsnumm === 'Ja') {
          return {
            ssn: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_soker.Norsk_fodselsnummer
          }
        } else throw new Error('norskFnr må være Ja eller Nei')
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
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
            AccessGroup: 'Elev inntak',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: flowStatus.syncElevmappe.result.privatePerson.ssn,
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
                Title: 'Minoritetsspråklig som søker videregående opplæring',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Minoritetsspråklig som søker videregående opplæring',
            // UnofficialTitle: `Minoritetsspråklig som søker videregående opplæring - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
            Archive: 'Sensitivt elevdokument',
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

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'Sektorstøtte, inntak og eksamen',
          description,
          type: 'Minoritetsspråklig som søker videregående opplæring', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
