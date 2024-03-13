const description = 'Varsling til skoleeier §§ alvorlige 9A-4 og 5 saker'
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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Varsling%20til%20skoleeier%20i%20skolemiljsaker/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Varsling%20til%20skoleeier%20i%20skolemiljsaker/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `Sak meldt inn av: ${xmlData.personNavn}` || 'Mangler title', // husk å bruke internal name på kolonnen
              Haster_x0020_saken: xmlData.hasterSaken || ' ',
              Oppf_x00f8_lging: xmlData.oppfolging || ' ',
              Sakstype: xmlData.sakstype || ' ',
              Dato_x0020_for_x0020_varsling: xmlData.dato || ' ',
              Saksnummer: xmlData.saksnummer || ' ',
              Skole: xmlData.personSkole || ' ',
              Kontaktperson: xmlData.kontaktpersonNavn || ' ',
              Kontaktperson_x0020_telefonnumme: xmlData.kontaktPersonTlf || ' ',
              Vold: xmlData.saksTypeVold || 'Nei',
              Digital_x0020_mobbing: xmlData.saksTypeDigitalMobbing || 'Nei',
              P_x00e5_g_x00e5_tt_x0020_over_x0: xmlData.saksTypeLangTid || 'Nei',
              Trusler: xmlData.saksTypeTrusler || 'Nei',
              Annet: xmlData.saksTypeAnnet || 'Nei',
              Enkeltelev_x0020_jente: xmlData.hvemGjelderSakenJente || ' ',
              enkeltelev_x0020_gutt: xmlData.hvemGjelderSakenGutt || ' ',
              Klasse: xmlData.hvemGjelderSakenKlasse || ' ',
              Meldt_x0020_inn_x0020_av: xmlData.personEpost || ' ',
              Er_x0020_det_x0020_registrert_x0: xmlData.tqm || ' '
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OPT',
          department: 'Pedagogisk støtte og utvikling',
          description,
          type: 'Varsling til skoleeier i skolemiljøsaker', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Sakstype: xmlData.saksType
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
