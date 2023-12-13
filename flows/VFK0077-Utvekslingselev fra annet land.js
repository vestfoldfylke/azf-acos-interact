const description = 'Sender til elevmappe (lager elevmappe basert på at eleven kommer fra utlandet='
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
      mapper: (flowStatus) => { // for å opprette person manuelt uten oppslag i Freg (Eks. utenlandske elever)
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        const dateList = flowStatus.parseXml.result.ArchiveData.Fdato.split('.')
        const newDate = `${dateList[2]}-${dateList[1]}-${dateList[0]}`
        let gender
        if (flowStatus.parseXml.result.ArchiveData.Kjonn === 'Mann') {
          gender = 'm'
        } else if (flowStatus.parseXml.result.ArchiveData.Kjonn === 'Kvinne') {
          gender = 'f'
        } else {
          throw new Error('Kjønn må være enten Mann eller Kvinne')
        }
        const payload = {
          fakeSsn: true,
          manualData: true,
          birthdate: newDate,
          gender,
          firstName: flowStatus.parseXml.result.ArchiveData.Fornavn,
          lastName: flowStatus.parseXml.result.ArchiveData.Etternavn,
          streetAddress: flowStatus.parseXml.result.ArchiveData.Adresse || 'Ukjent adresse',
          zipCode: flowStatus.parseXml.result.ArchiveData.Postnr || '9999',
          zipPlace: flowStatus.parseXml.result.ArchiveData.Poststed || 'Ukjent poststed',
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
            AccessGroup: 'Elev inntak',
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
  /*
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            path: 'sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            listId: 'D1085908-9111-4b6d-84d3-fc8ecd29d398',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorasisjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse

            }
          }
        ]
      }
    }
  },
  */

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
