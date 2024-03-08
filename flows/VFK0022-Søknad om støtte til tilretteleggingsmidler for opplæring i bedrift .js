const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
const { getSchoolYear } = require('../lib/flow-helpers')
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
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.fnr
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        console.log(flowStatus.parseXml.result.ArchiveData.Egendefinert1.replaceAll(' ', ''))
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Egendefinert1.replaceAll(' ', '')
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
            AccessGroup: 'Fagopplæring',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Egendefinert1.replaceAll(' ', ''),
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        let programomrade = ''
        if (xmlData.gjennomfortMote === 'Nei') programomrade = xmlData.programomrade
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20tilretteleggingsmidler%20for%20oppl/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Sknad%20om%20sttte%20til%20tilretteleggingsmidler%20for%20oppl/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber || 'Mangler dokumentnummer', // husk å bruke internal name på kolonnen
              L_x00e6_rebedrift_x0020__x002f__: xmlData.laerebedrift,
              Kontaktperson: xmlData.kontaktperson,
              Navn_x0020_p_x00e5__x0020_medlem: xmlData.medlemsbedrift,
              Navn_x0020_p_x00e5__x0020_l_x00e: xmlData.navnUngdom,
              F_x00f8_dselsnummer: xmlData.fnr,
              L_x00e6_refag: xmlData.laerefag,
              Gjennomf_x00f8_rt_x0020_m_x00f8_: xmlData.gjennomfortMote,
              Navn_x0020_p_x00e5__x0020_fagr_x: xmlData.navnFagradgiver,
              Hvilket_x0020_programomr_x00e5_d: programomrade,
              Periode_x0020_det_x0020_s_x00f8_: xmlData.periode,
              Antall_x0020_timer_x0020_pr_x002: xmlData.antallTimer,
              Antall_x0020_uker_x0020_pr_x0020: xmlData.antallUker
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
