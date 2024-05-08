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

  /*
  xml fil fra Acos:
    ArchiveData {
      string Orgnr
      string TypeOrg
      string Skole
      string Egendefinert1
      string Egendefinert2
      string Soker
      string Samarbeidspartnere
      string Gjennomforingsperiode
      string Programomrade
      string AndreFylker
      string HvilkeTiltak
      string NavnTiltak
      string HvilkeTema
      string YrkesfaglarerAntall
      string InstruktorAntall
      string AndreDeltakere
      string KurskostnadPrDeltaker
      string AndreKurskostnader
      string Hospitering
      string Annet
      string EnkeltBudsjett
}

  */
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeOrg !== 'Skole' && flowStatus.parseXml.result.ArchiveData.TypeOrg !== 'Prøvenemnd'
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
        if (flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Skole' || flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Opplæringskontor' || flowStatus.parseXml.result.ArchiveData.TypeOrg === 'Annet') {
          sender = xmlData.Orgnr.replaceAll(' ', '')
          accessCode = 'U'
          accessGroup = 'Alle'
          paragraph = ''
        } else {
          sender = xmlData.Egendefinert1 // Prøvenemnd (sendes inn som privatperson)
          accessCode = '26'
          accessGroup = 'Fagopplæring'
          paragraph = 'Offl. § 26 femte ledd'
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
                Title: 'Lokal kompetanseutvikling for fag- og yrkesopplæringen (DEKOMP-Y)',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: paragraph,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200016' : '200019', // Seksjon Fag- og yrkesopplæring
            // ResponsiblePersonEmail: '',
            Status: 'J',
            Title: 'Lokal kompetanseutvikling for fag- og yrkesopplæringen (DEKOMP-Y)',
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/00018' : '23/00127'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Lokal%20kompetanseutvikling%20DEKOMPY/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.archive.result.DocumentNumber,
              S_x00f8_ker: xmlData.Soker === '' ? xmlData.Skole : xmlData.Soker,
              Navnp_x00e5_samarbeidspartnere: xmlData.Samarbeidspartnere,
              Erdets_x00f8_ktmidlertilsammepro: xmlData.AndreFylker,
              Hvilketiltaks_x00f8_kesdetom: xmlData.HvilkeTiltak,
              Navnp_x00e5_tiltaket: xmlData.NavnTiltak,
              Gjennomf_x00f8_ringsperiode: xmlData.Gjennomforingsperiode,
              Hvilkettemadekkes: xmlData.HvilkeTema,
              Hvilketprogramomr_x00e5_des_x00f: xmlData.Programomrade,
              Yrkesfagl_x00e6_rereantall: xmlData.YrkesfaglarerAntall,
              Instrukt_x00f8_rantall: xmlData.InstruktorAntall,
              Andredeltakere: xmlData.AndreDeltakere,
              Kurskostnadprdeltaker: xmlData.KurskostnadPrDeltaker,
              Andrekurskostnader: xmlData.AndreKurskostnader,
              Hospitering: xmlData.Hospitering,
              Annet: xmlData.Annet,
              Settoppetenkeltbudsjettmedtotals: xmlData.EnkeltBudsjett
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
          type: 'Lokal kompetanseutvikling for fag- og yrkesopplæringen (DEKOMP-Y)', // Required. A short searchable type-name that distinguishes the statistic element
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
