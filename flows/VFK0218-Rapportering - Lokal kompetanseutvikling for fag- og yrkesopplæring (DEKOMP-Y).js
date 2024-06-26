const description = 'Sender til samlesak'
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

  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Opplæringskontor'
      },
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', '')
        }
      }
    }
  },
  syncPrivatePerson: { // Jobname is valid as long as it starts with "syncPrivatePerson"
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Prøvenemnd'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Egendefinert1,
          forceUpdate: true // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },
  // Arkiverer dokumentet i samlesak
  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        let sender
        let accessCode
        let accessGroup
        let paragraph
        if (flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Prøvenemnd') {
          sender = xmlData.Egendefinert1
          accessCode = '26'
          accessGroup = 'Fagopplæring'
          paragraph = 'Offl. § 26 femte ledd'
        } else {
          sender = xmlData.Orgnr.replaceAll(' ', '')
          accessCode = 'U'
          accessGroup = 'Alle'
          paragraph = ''
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
            AccessCode: accessCode,
            AccessGroup: accessGroup,
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: sender,
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
                Title: 'Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: paragraph,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)',
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/00158' : '23/00128'
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
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Rapportering%20%20lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Rapportering%20%20lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.archive?.result?.DocumentNumber || 'Dokumentnummer mangler', // husk å bruke internal name på kolonnen
              Navn_x0020_p_x00e5__x0020_skole_: xmlData.NavnSkoleEllerKontor,
              Navn_x0020_p_x00e5__x0020_samarb: xmlData.Samarbeidspartnere,
              Gjennomf_x00f8_ringsperiode: xmlData.Gjennomforingsperiode,
              Hvilke_x0020_tiltak_x0020_skal_x: xmlData.HvilkeTiltak,
              Hvor_x0020_mye_x0020_midler_x002: xmlData.Midler,
              Hvor_x0020_mye_x0020_av_x0020_mi: xmlData.MidlerBenyttet,
              Dersom_x0020_det_x0020_er_x0020_: xmlData.UbrukteMidler,
              Egenfinansiering: xmlData.Egenfinansiering,
              Velg_x0020_tema: xmlData.HvilkeTema,
              Velg_x0020_utdanningsprogram: xmlData.Utdanningsprogram,
              Yrkesfagl_x00e6_rere: xmlData.YrkesfaglarerAntall,
              Avdelingsledere: xmlData.AvdelingslederAntall,
              Andre_x0020_ansatte_x0020_i_x002: xmlData.AndreAnsatteSkole,
              Faglig_x0020_ledere_x0020_og_x00: xmlData.FagligLedereOgInstruktorer,
              Oppl_x00e6_ringskontor: xmlData.Opplaringskontor,
              Pr_x00f8_venemnder: xmlData.Provenemder,
              Andre_x0020_m_x00e5_lgrupper: xmlData.AndreMalgrupper,
              Navnp_x00e5_densomrapporterer: xmlData.NavnPaDenSomRapporterer,
              Eposttildensomrapporterer: xmlData.EpostPaDenSomRapporterer,
              Navnp_x00e5_deltakere: xmlData.NavnPaDeltagere
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
          type: 'Rapportering - Lokal kompetanseutvikling for fag- og yrkesopplæring (DEKOMP-Y)', // Required. A short searchable type-name that distinguishes the statistic element
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
