const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
const { getSchoolYear } = require('../lib/flow-helpers')
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
          ssn: flowStatus.parseJson.result.DialogueInstance.Kandidaten.Soknaden_gjelder2.Fodselsnummer2
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
          orgnr: flowStatus.parseJson.result.DialogueInstance.Larebedriften.Larebedrift__samarbeidso.Organisasjon.Organisasjon_orgnr.replaceAll(' ', '')
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
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Larebedriften.Larebedrift__samarbeidso.Organisasjon.Organisasjon_orgnr.replaceAll(' ', ''),
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
                Title: 'Søknad om støtte til tilretteleggingsmidler for opplæring i bedrift',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: `Søknad om støtte til tilretteleggingsmidler for opplæring i bedrift - ${getSchoolYear()}`,
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
        let programomrade = ''
        if (jsonData.Belop.Informasjon6.Har_det_vært_gj === 'Nei') programomrade = jsonData.Belop.Informasjon6.Hvilket_programomrade_so
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20tilretteleggingsmidler%20for%20oppl/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20tilretteleggingsmidler%20for%20oppl/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber || 'Mangler dokumentnummer', // husk å bruke internal name på kolonnen
              L_x00e6_rebedrift_x0020__x002f__: jsonData.Larebedriften.Larebedrift__samarbeidso.Organisasjon.Organisasjon_orgnavn,
              Kontaktperson: jsonData.Larebedriften.Larebedrift__samarbeidso.Kontaktperson_i_bedrifte,
              Navn_x0020_p_x00e5__x0020_medlem: jsonData.Larebedriften.Larebedrift__samarbeidso.Organisasjon1.Navn_på_medlems,
              Navn_x0020_p_x00e5__x0020_l_x00e: jsonData.Kandidaten.Soknaden_gjelder2.Navn_pa_larling__praksis,
              F_x00f8_dselsnummer: jsonData.Kandidaten.Soknaden_gjelder2.Fodselsnummer2,
              L_x00e6_refag: jsonData.Kandidaten.Soknaden_gjelder2.Larefag,
              Gjennomf_x00f8_rt_x0020_m_x00f8_: jsonData.Belop.Informasjon6.Har_det_vært_gj,
              Navn_x0020_p_x00e5__x0020_fagr_x: jsonData.Belop.Informasjon6.Navn_pa_fagradgiver_,
              Hvilket_x0020_programomr_x00e5_d: programomrade,
              Periode_x0020_det_x0020_s_x00f8_: `${jsonData.Kandidaten.Soknaden_gjelder2.Perioden_det_sø} - ${jsonData.Kandidaten.Soknaden_gjelder2.Perioden_det_sø1}`,
              Antall_x0020_timer_x0020_pr_x002: jsonData.Belop.Informasjon6.Antall_timer_pr_uke.toString(),
              Antall_x0020_uker_x0020_pr_x0020: jsonData.Belop.Informasjon6.Antall_uker_pr_ar.toString()
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
          type: `Søknad om støtte til tilretteleggingsmidler for opplæring i bedrift - ${getSchoolYear()}`, // Required. A short searchable type-name that distinguishes the statistic element
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
