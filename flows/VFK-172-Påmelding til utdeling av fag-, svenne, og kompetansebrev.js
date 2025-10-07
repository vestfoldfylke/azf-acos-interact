const description = 'Påmelding til utdeling av fag-, svenne- og kompetansebrev' // Katarina
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Pmelding%20til%20utdeling%20av%20fag%20svenne%20og%20kompetansebrev/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Pmelding%20til%20utdeling%20av%20fag%20svenne%20og%20kompetansebrev/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.LastName || 'Mangler etternavn', // husk å bruke internal name på kolonnen
              Fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName || 'Mangler fornavn',
              Telefon: jsonData.Velkommen_til_u.Privatperson.Telefon1,
              Epost: jsonData.Velkommen_til_u.Privatperson.E_post,
              L_x00e6_refag: jsonData.Velkommen_til_u.Privatperson.Lærefag,
              Deltagelse: jsonData.Velkommen_til_u.Invitasjon_til_.Kommer_du_12__n,
              Samtykke: jsonData.Velkommen_til_u.Invitasjon_til_.Samtykke_til_fo
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
          company: 'Opplæring og tannhelse',
          department: 'fag- og yrkesopplæring',
          description, // Required. A description of what the statistic element represents
          type: 'Påmelding til utdeling av fag-, svenne- og kompetansebrev' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
