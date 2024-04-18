const description = 'Bestillingsskjema til reise for prøvenemnder'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Reise%20for%20prvenemnder/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Reise%20for%20prvenemnder/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.InnsenderEtternavn || 'Mangler title', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.InnsenderFornavn,
              F_x00f8_dselsdato: xmlData.InnsenderFdato,
              Adresse: xmlData.InnsenderAdresse,
              Postnr: xmlData.InnsenderPostnr,
              Poststed: xmlData.InnsenderSted,
              Mobil: xmlData.InnsenderTelefon,
              E_x002d_post: xmlData.InnsenderEpost,
              Nemnd: xmlData.InnsenderEpost,
              Flyreise: xmlData.InnsenderTelefon,
              Fly_x0020_avreise_x0020_fra: xmlData.FlyAvreiseFra,
              Fly_x0020_avreise_x0020_til: xmlData.FlyAvreiseTil,
              Fly_x0020_avreise_x0020_dato: xmlData.FlyAvreiseDato,
              Fly_x0020_avreise_x0020_klokkesl: xmlData.FlyAvreiseKlokkeslett,
              Fly_x0020_avreise_x0020_annen_x0: xmlData.FlyAvreiseAnnenInfo,
              Fly_x0020_hjemreise_x0020_fra: xmlData.FlyHjemreiseFra,
              Fly_x0020_hjemreise_x0020_til: xmlData.FlyHjemreiseTil,
              Fly_x0020_hjemreise_x0020_dato: xmlData.FlyHjemreiseDato,
              Fly_x0020_hjemreise_x0020_klokke: xmlData.FlyHjemreiseKlokkeslett,
              Fly_x0020_hjemreise_x0020_annen_: xmlData.FlyHjemreiseAnnenInfo,
              Togreise: xmlData.Togreise,
              Tog_x0020_avreise_x0020_fra: xmlData.TogAvreiseFra,
              Tog_x0020_avreise_x0020_til: xmlData.TogAvreiseTil,
              Tog_x0020_avreise_x0020_dato: xmlData.TogAvreiseDato,
              Tog_x0020_avreise_x0020_klokkesl: xmlData.TogAvreiseKlokkeslett,
              Tog_x0020_avreise_x0020_annen_x0: xmlData.TogAvreiseAnnenInfo,
              Tog_x0020_hjemreise_x0020_fra: xmlData.TogHjemreiseFra,
              Tog_x0020_hjemreise_x0020_til: xmlData.TogHjemreiseTil,
              Tog_x0020_hjemreise_x0020_dato: xmlData.TogHjemreiseDato,
              Tog_x0020_hjemreise_x0020_klokke: xmlData.TogHjemreiseKlokkeslett,
              Tog_x0020_hjemreise_x0020_annen_: xmlData.TogHjemreiseAnnenInfo,
              Hotell: xmlData.Hotell,
              Hotell_x0020_sted: xmlData.HotellSted,
              Hotell_x0020_fra: xmlData.HotellFra,
              Hotell_x0020_til: xmlData.HotellTil,
              Hotell_x0020_annen_x0020_info: xmlData.HotellAnnenInfo,
              Hensikt_x0020_med_x0020_reisen: xmlData.HensiktMedReisen,
              Hvem_x0020_har_x0020_godkjent_x0: xmlData.HvemHarGodkjent,
              Kandidat_x0020_fornavn: xmlData.KandidatFornavn,
              Kandidat_x0020_etternavn: xmlData.KandidatFornavn,
              Kandidat_x0020_f_x00f8_dselsdato: xmlData.KandidatFdato,
              Kandidat_x0020_l_x00e6_refag: xmlData.KandidatLarefag,
              Kandidat_x0020_pr_x00f8_vedato_x: xmlData.KandidatProvedatoFra,
              Kandidat_x0020_pr_x00f8_vedato_x0: xmlData.KandidatProvedatoTil,
              Annet: xmlData.KandidatAnnet
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
          company: 'Opplæring',
          department: 'Fagopplæring',
          description,
          type: 'Lokal kompetanseutvikling for fag- og yrkesopplæringen (DEKOMP-Y)' // Required. A short searchable type-name that distinguishes the statistic element
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
