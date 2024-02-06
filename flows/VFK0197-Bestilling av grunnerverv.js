const description = 'SMM - Bestilling av grunnerverv'
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
XML file from Acos:
ArchiveData {
    string Prosjektnummer
    string Prosjektnavn
    string Fylkesvegnummer
    string Strekning
    string Kommune
    string KunBistandIPlanfasen
    string Prosjektbeskrivelse
    string GodkjentReguleringsplan
    string NavnReguleringsplan
    string Planidentnr
    string AntallGrunneiere
    string AntallBoligeiendommer
    string AntallBygninger
    string TypeBygninger
    string DagensArealbruk
    string SpesielleForhold
    string Finansiering
    string DatoForFinansiering
    string DatoForLeveranse
    string DatoForUtlysning
    string DatoForByggestart
    string Kontaktperson
    string Prosjekteringsleder
    string Byggeleder
    string Hovedkontakt
    string EstimertTid
}

*/

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Prosjektnummer) throw new Error('Prosjektnummer har ikke kommet med fra XML')
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bestilling%20av%20grunnerverv/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bestilling%20av%20grunnerverv/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Prosjektnummer, // || 'Mangler prosjektnummer', // husk å bruke internal name på kolonnen
              Prosjektnavn: xmlData.Prosjektnavn,
              Fylkesvegnummer: xmlData.Fylkesvegnummer,
              Strekning: xmlData.Strekning,
              Kommune: xmlData.Kommune,
              Kunbistandiplanfasen: xmlData.KunBistandIPlanfasen,
              Prosjektbeskrivelse: xmlData.Prosjektbeskrivelse,
              Godkjentreguleringsplan: xmlData.GodkjentReguleringsplan,
              Navnreguleringsplan: xmlData.NavnReguleringsplan,
              Planidentnr_x002e_: xmlData.Planidentnr,
              Antalleiendommer: xmlData.AntallGrunneiere,
              Antallboligeiendommer: xmlData.Antallboligeiendommer,
              Antallbygninger: xmlData.Antallbygninger,
              Typebygninger: xmlData.TypeBygninger,
              Dagensarealbruk: xmlData.Dagensarealbruk,
              Spesielleforhold: xmlData.Spesielleforhold,
              Finansiering: xmlData.Finansiering,
              Datoforfinansiering: xmlData.Datoforfinansiering,
              Datoforleveranse: xmlData.Datoforleveranse,
              Datoforutlysning: xmlData.Datoforutlysning,
              Datoforbyggestart: xmlData.Datoforbyggestart,
              Kontaktperson: xmlData.Kontaktperson,
              Prosjekteringsleder: xmlData.Prosjekteringsleder,
              Byggeleder: xmlData.Byggeleder,
              Hovedkontakt: xmlData.Hovedkontakt,
              Estimerttidtilgrunnerverv: xmlData.EstimertTid
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
          company: 'Samferdsel',
          department: '',
          description,
          type: 'Bestilling av grunnerverv', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Fag,
          Skole: xmlData.Skole
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
