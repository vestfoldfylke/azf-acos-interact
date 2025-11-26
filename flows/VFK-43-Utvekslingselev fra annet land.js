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

  syncElevmappe: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person manuelt uten oppslag i Freg (Eks. utenlandske elever)
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        // const dateList = flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Fodselsdato.split('-')
        // const newDate = `${dateList[2]}-${dateList[1]}-${dateList[0]}`
        let gender
        if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Kjonn2 === 'Mann') {
          gender = 'm'
        } else if (flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Kjonn2 === 'Kvinne') {
          gender = 'f'
        } else {
          throw new Error('Kjønn må være enten Mann eller Kvinne')
        }
        const payload = {
          fakeSsn: true,
          manualData: true,
          birthdate: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Fodselsdato,
          gender,
          firstName: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Fornavn,
          lastName: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Etternavn2,
          streetAddress: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Adresse_der_ele || 'Ukjent adresse',
          zipCode: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Postnr__sted_postnr || '9999',
          zipPlace: flowStatus.parseJson.result.DialogueInstance.Opplysninger.Om_eleven.Sted || 'Ukjent poststed',
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
        return payload
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
                Title: 'Utvekslingselev fra annet land - Søknad',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Utvekslingselev fra annet land - Søknad',
            // UnofficialTitle: `Utvekslingselev fra annet land - Søknad - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
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
          type: 'Utvekslingselev fra annet land - Søknad', // Required. A short searchable type-name that distinguishes the statistic element
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
