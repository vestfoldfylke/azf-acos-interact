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

  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        let eksamenskontoret
        if (jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_slags_dokumentasjon_3 === 'Jeg trenger kompetansebevis med fag jeg har tatt som privatist før høsten 2021') {
          eksamenskontoret = true
        } else if (jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_slags_dokumentasjon_3 === 'Jeg trenger vitnemål for autorisasjon som helsepersonell') {
          eksamenskontoret = true
        } else eksamenskontoret = false
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

        if (eksamenskontoret === true) {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200015' : '200018' // Seksjon Sektorstøtte, inntak og eksamen
          documentData.parameter.AccessGroup = 'Eksamen'
        } else if (eksamenskontoret === false) {
          const school = schoolInfo.find(school => school.orgNr.toString() === jsonData.SavedValues.Dataset.Hvilken_skole_gar_eller_.Orgnr)
          if (!school) throw new Error(`Could not find any school with orgnr: ${jsonData.SavedValues.Dataset.Hvilken_skole_gar_eller_.Orgnr}`)
          documentData.parameter.ResponsibleEnterpriseNumber = jsonData.SavedValues.Dataset.Hvilken_skole_gar_eller_.Orgnr
          documentData.parameter.AccessGroup = school.tilgangsgruppe
        } else {
          throw new Error('Finner ikke ut om dette er eksamenskontoret eller en skole. Sjekk logikk')
        }
        // console.log(documentData)
        return documentData
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
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        const jsonData = flowStatus.parseJson.result
        let eksamenskontoret
        if (jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_slags_dokumentasjon_3 === 'Jeg trenger kompetansebevis med fag jeg har tatt som privatist før høsten 2021') {
          eksamenskontoret = true
        } else if (jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_slags_dokumentasjon_3 === 'Jeg trenger vitnemål for autorisasjon som helsepersonell') {
          eksamenskontoret = true
        } else eksamenskontoret = false
        return eksamenskontoret // === true // de som skal til skolene skal ikke i lista
      },
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Privatistdokumentasjon/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Privatistdokumentasjon/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.SavedValues.Login.UserID,
              Fornavn: jsonData.SavedValues.Login.FirstName,
              Etternavn: jsonData.SavedValues.Login.LastName,
              Adresse: jsonData.SavedValues.Login.Address,
              Postnummerogsted: `${jsonData.SavedValues.Login.PostalCode} ${jsonData.SavedValues.Login.PostalArea}`,
              Mobilnummer: jsonData.DialogueInstance.Kontaktopplysninger2.Personinformasj.Mobilnummer,
              E_x002d_postadresse: jsonData.DialogueInstance.Kontaktopplysninger2.Personinformasj.E_postadresse,
              Typedokumentasjon: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_slags_dokumentasjon_3,
              Typeautorisasjon: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hva_trenger_du_,
              Eksamenssted: null,
              Fag: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Skriv_inn_hvilke_t__fag2,
              _x00d8_nsketmottak: null,
              Eksamensperiode_x0028_semester_x: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hvilket_arstall_og_semes,
              Alternativadresse: `${jsonData.DialogueInstance.Kontaktopplysninger2.Alternativ_postadresse.Gateadresse}, ${jsonData.DialogueInstance.Kontaktopplysninger2.Alternativ_postadresse.Postnr} ${jsonData.DialogueInstance.Kontaktopplysninger2.Alternativ_postadresse.Sted}`,
              Avgangs_x00e5_r: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Skriv_inn_avgangsaret_di,
              Utdanningsprogram: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hvilket_utdanni,
              Spr_x00e5_k: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Jeg_trenger_dok,
              Bestillingen_x0020_gjelder_x0020: jsonData.DialogueInstance.Hva_slags_dokumentasjon_2.Hvis_du_har_fle
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
