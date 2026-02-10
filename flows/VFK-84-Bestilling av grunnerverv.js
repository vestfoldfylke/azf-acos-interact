const description = 'SMM - Bestilling av grunnerverv'
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

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance.Bestilling
        if (!jsonData.Om_prosjektet.Prosjektnummer_for_timef) throw new Error('Prosjektnummer har ikke kommet med fra JSON')
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bestilling%20av%20grunnerverv/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/Bestilling%20av%20grunnerverv/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Om_prosjektet.Prosjektnummer_for_timef, // || 'Mangler prosjektnummer', // husk å bruke internal name på kolonnen
              Prosjektnavn: jsonData.Om_prosjektet.Prosjektnavn,
              Fylkesvegnummer: jsonData.Om_prosjektet.Fylkesvegnummer,
              Strekning: jsonData.Om_prosjektet.Strekning,
              Kommune: jsonData.Om_prosjektet.Kommune,
              Kunbistandiplanfasen: jsonData.Beskrivelse.Gjelder_bestillingen_kun,
              Prosjektbeskrivelse: jsonData.Beskrivelse.Enkel_prosjektbeskrivels,
              Godkjentreguleringsplan: jsonData.Beskrivelse.Har_prosjektet_en_godkje,
              Navnreguleringsplan: jsonData.Beskrivelse.Navn_pa_reguleringsplan,
              Planidentnr_x002e_: jsonData.Beskrivelse.Planident_nummer,
              Antalleiendommer: jsonData.Eiendommer_og_bygninger.Hvor_mange_gards__og_bru,
              Antallboligeiendommer: jsonData.Eiendommer_og_bygninger.Antall_boligeiendommer2,
              Antallbygninger: jsonData.Eiendommer_og_bygninger.Antall_bygninger_som_ska,
              Typebygninger: jsonData.Eiendommer_og_bygninger.Angi_type_bygning_og_ant,
              Dagensarealbruk: jsonData.Dagens_bruk_og_spesielle.Beskriv_dagens_bruk_av_a,
              Spesielleforhold: jsonData.Dagens_bruk_og_spesielle.Finnes_det_spesielle_for,
              Finansiering: jsonData.Finansiering_og_viktige_.Er_finansiering_av_grunn,
              Datoforfinansiering: jsonData.Finansiering_og_viktige_.Dato_for_finansiering_av,
              Datoforleveranse: jsonData.Finansiering_og_viktige_.Dato_for_leveranse_av_w_,
              Datoforutlysning: jsonData.Finansiering_og_viktige_._nsket_dato_for_utlylsni,
              Datoforbyggestart: jsonData.Finansiering_og_viktige_._nsket_dato_for_byggesta,
              Kontaktperson: jsonData.Ledere_og_kontaktpersone.Kontaktperson,
              Prosjekteringsleder: jsonData.Ledere_og_kontaktpersone.Prosjekteringsleder_plan,
              Byggeleder: jsonData.Ledere_og_kontaktpersone.Byggeleder,
              Hovedkontakt: jsonData.Ledere_og_kontaktpersone.Hovedkontakt_for_grunner,
              Estimerttidtilgrunnerverv: jsonData.Beskrivelse.Estimert_tid_til_grunner
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
          department: '',
          description,
          type: 'Bestilling av grunnerverv' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
