const description = 'Bruk av vei og sideareal'
// const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
ArchiveData {
  string TypeSoker
  string InnsenderFnr
  string InnsenderNavn
  string InnsenderEpost
  string InnsenderTelefon
  string OrgKontaktperson
  string OrgKontaktpersonEpost
  string OrgKontaktpersonTelefon
  string OrgNr
  string OrgNavn
  string HvorAdresse
  string HvorKommune
  string Bruksomrade
  string VeiarealBerort
  string VeiobjekterBerort
  string PeriodeFra
  string PeriodeTil
  string Egendefinert1
  string Egendefinert2
  string Egendefinert3
}

  */
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bruk%20av%20vei%20og%20sideareal/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bruk%20av%20vei%20og%20sideareal/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.refId || 'Mangler title', // husk å bruke internal name på kolonnen
              Types_x00f8_ker: xmlData.TypeSoker,
              Organisasjonsnummer: xmlData.OrgNr,
              Organisasjonsnavn: xmlData.OrgNavn,
              Kontaktperson_x0028_organisasjon: xmlData.OrgKontaktperson,
              KontaktpersonE_x002d_post_x0028_: xmlData.OrgKontaktpersonEpost,
              Kontaktpersontelefon_x0028_organ: xmlData.OrgKontaktpersonTelefon,
              Kontaktperson_x0028_privat_x0029: xmlData.InnsenderNavn,
              KontaktpersonE_x002d_post_x0028_0: xmlData.InnsenderEpost,
              Kontaktpersontelefon_x0028_priva: xmlData.InnsenderTelefon,
              Hvor_x0028_adresse_x0029_: xmlData.HvorAdresse,
              Hvor_x0028_kommune_x0029_: xmlData.HvorKommune,
              Bruksomr_x00e5_de: xmlData.Bruksomrade,
              Ber_x00f8_rtveiareal: xmlData.VeiarealBerort,
              Ber_x00f8_rteveiobjekter: xmlData.VeiobjekterBerort,
              Beskrivelse: xmlData.Egendefinert3,
              Gjennomf_x00f8_ringsperiodefra: xmlData.PeriodeFra,
              Gjennomf_x00f8_ringsperiodetil: xmlData.PeriodeTil
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
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Seksjon veiforvaltning',
          description, // Required. A description of what the statistic element represents
          type: 'Bruk av vei og sideareal' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // documentNumber:  // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
