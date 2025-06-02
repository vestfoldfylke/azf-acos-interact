const description = 'Sender til elevmappe'
const { schoolInfo } = require('../lib/data-sources/vfk-schools')
// const { nodeEnv } = require('../config')
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
        const jsonData = flowStatus.parseJson.result.SavedValues
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const school = schoolInfo.find(school => school.orgNr.toString() === flowStatus.parseJson.result.SavedValues.Dataset.Skole.Orgnr)
        if (!school) throw new Error(`Could not find any school with orgNr: ${flowStatus.parseJson.result.SavedValues.Dataset.Skole.Orgnr}`)
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
            AccessGroup: flowStatus.parseJson.result.SavedValues.Dataset.Skole.Tilgangsgruppe,
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.Login.UserID,
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
                Title: 'Påmelding til mer opplæring i enkeltfag',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseNumber: school.orgNr,
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Påmelding til mer opplæring i enkeltfag',
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const sharepointElements = []
        const fagliste = jsonData.Påmelding.Fag
        if (fagliste.length === 0) throw new Error('Ingen fag i JSON filen')
        for (const row of fagliste) {
          const sharepointFagElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Meropplring-KPU-internutvikling/Lists/Pmelding%20til%20opplring%20i%20enkeltfag/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Meropplring-KPU-internutvikling/Lists/Pmelding%20til%20opplring%20i%20enkeltfag/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Informasjon_om_.Privatperson.Etternavn1,
              Fornavn: jsonData.Informasjon_om_.Privatperson.Fornavn1,
              Skole: jsonData.Påmelding.Skole,
              Gj_x00f8_r_x0020_i_x0020_dag: jsonData.Bakgrunnsinform.Dagens_status.Hva_gjør_du_i_d,
              S_x00f8_kt_x0020_inntak_x0020_ti: jsonData.Bakgrunnsinform.Har_du_søkt_inn,
              S_x00f8_kt_x0020_hva: jsonData.Bakgrunnsinform.Hva_har_du_søkt,
              Fylt_x0020_ut_x0020_sammen_x0020: jsonData.Bakgrunnsinform.Hvem_har_fylt_u,
              Stilling: jsonData.Bakgrunnsinform.Stilling__rådgi,
              P_x00e5_melding_x0020_fag: row.Hvilket_fag_øns,
              Typeikkebest_x00e5_tt: row.Type_ikke_bestå,
              Kveldstid: jsonData.Påmelding.Informasjon.Kan_du_følge_op,
              Nettundervisning: jsonData.Påmelding.Informasjon.Er_nettundervis,
              AvleggeNUS: jsonData.Bakgrunnsinform.Skal_du_avlegge,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
            }
          }
          sharepointElements.push(sharepointFagElement)
        }
        return sharepointElements
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
          company: 'Opplæring og tannhelse',
          department: 'Seksjon kompetanse og pedagogisk utvikling',
          description,
          type: 'Påmelding til mer opplæring i enkeltfag', // Required. A short searchable type-name that distinguishes the statistic element
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
