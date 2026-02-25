const description = 'Sender til elevmappe'
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
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => {
        return {
          ssn: flowStatus.parseJson.result.DialogueInstance.Kandidaten.Soknaden_gjelder_.Fodselsnummer
        }
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Innsender_av_s\u00F8.L\u00E6rebedrift__Sa.Organisasjon4.Organisasjonsnu3.replaceAll(' ', '')
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.Innsender_av_s\u00F8.L\u00E6rebedrift__Sa.Organisasjon4.Organisasjonsnu3.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad om støtte til stimuleringsmidler bedrift',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: `Søknad om støtte til stimuleringsmidler bedrift - ${jsonData.Innsender_av_s\u00F8.L\u00E6rebedrift__Sa.Organisasjon4.Organisasjonsna}`,
            // UnofficialTitle: '',
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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20stimuleringsmidler%202026/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20stimuleringsmidler%202026/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber || 'Mangler dokumentnummer', // husk å bruke internal name på kolonnen
              L_x00e6_rebedrift_x0020__x002f__: jsonData.Innsender_av_s\u00F8.L\u00E6rebedrift__Sa.Organisasjon4.Organisasjonsna,
              Kontaktperson: jsonData.Innsender_av_s\u00F8.L\u00E6rebedrift__Sa.Kontaktperson_f,
              Navn_x0020_p_x00e5__x0020_medlem: jsonData.Innsender_av_s\u00F8.Organisasjon5.Navn_p\u00E5_medlems1,
              Navn_x0020_p_x00e5__x0020_l_x00e: jsonData.Kandidaten.Soknaden_gjelder_.Navn_p\u00E5_l\u00E6rling,
              F_x00f8_dselsnummer: jsonData.Kandidaten.Soknaden_gjelder_.Fodselsnummer,
              L_x00e6_refag: jsonData.Kandidaten.Soknaden_gjelder_.Larefag,
              Hva_x0020_s_x00f8_kes_x0020_det_: jsonData.Stimuleringsmid.Hva_det_sokes_om_,
              Navn_x0020_p_x00e5__x0020_fagr_x: jsonData.Innsender_av_s\u00F8.Navn_p\u00E5_fagr\u00E5dg || 'ikke vært i kontakt med fagrådgiver',
              Hvor_x0020_mye_x0020_s_x00f8_kes: jsonData.Stimuleringsmid.Hvor_mye_sokes_det_om_.toString()
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
          department: 'Fagopplæring',
          description,
          type: 'Søknad om tilrettelegging på fag, svenne eller kompetanseprøve', // Required. A short searchable type-name that distinguishes the statistic element
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
