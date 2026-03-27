const description = "Varsling til skoleeier §§ alvorlige 9A-4 og 5 saker"
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.user
        return [
          {
            testSiteId: "427960b4-519d-45da-970a-869c3a88d1b4",
            testPath: "sites/OF-Pedagogisksttteogutvikling/Lists/Varsling til skoleeier i skolemiljsaker/AllItems.aspx",
            testListId: "b257290a-2a26-4b11-9356-7c36d697ea76",
            prodSiteId: "427960b4-519d-45da-970a-869c3a88d1b4",
            prodPath: "sites/OF-Pedagogisksttteogutvikling/Lists/Varsling til skoleeier i skolemiljsaker/AllItems.aspx",
            prodListId: "b257290a-2a26-4b11-9356-7c36d697ea76",
            uploadFormPdf: true, // Spørmsål til Nils, Laster denne opp formen til sharepoint listen?
            uploadFormAttachments: false,
            fields: {
              Title: `Sak meldt inn av: ${xmlData.personNavn}` || "Mangler title", // husk å bruke internal name på kolonnen
              Hastersaken_x003f_: xmlData.hasterSaken || " ",
              Oppf_x00f8_lging: xmlData.oppfolging || " ",
              Sakstype: xmlData.saksType || " ",
              Datoforvarsling: xmlData.dato || " ",
              Saksnummer: xmlData.saksNummer || " ",
              Skole: xmlData.personSkole || " ",
              Kontaktperson: xmlData.kontaktpersonNavn || " ",
              Kontaktpersontelefonnummer: xmlData.kontaktPersonTlf || " ",
              Vold: xmlData.saksTypeVold || "Nei",
              Digitalmobbing: xmlData.saksTypeDigitalMobbing || "Nei",
              P_x00e5_g_x00e5_ttoverlangtid: xmlData.saksTypeLangTid || "Nei",
              Trusler: xmlData.saksTypeTrusler || "Nei",
              Annet: xmlData.saksTypeAnnet || "Nei",
              EnkeltelevJente: xmlData.hvemGjelderSakenJente || " ",
              EnkeltelevGutt: xmlData.hvemGjelderSakenGutt || " ",
              Klasse: xmlData.hvemGjelderSakenKlasse || " ",
              Meldtinnav: xmlData.personEpost || " ",
              Er_x0020_det_x0020_registrert_x0: xmlData.tqm || " "
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
        const xmlData = flowStatus.parseXml.result.user
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "OF",
          department: "Pedagogisk støtte og utvikling",
          description,
          type: "Varsling til skoleeier i skolemiljøsaker", // Required. A short searchable type-name that distinguishes the statistic element
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
