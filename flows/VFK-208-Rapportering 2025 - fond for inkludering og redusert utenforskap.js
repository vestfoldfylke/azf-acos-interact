const description = 'Regionalt kulturfond Vestfold'
const { nodeEnv } = require('../config')

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

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Halvårsrapporte.Innsender.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      // no mapper here means that we will not create a case if we do not find an existing one and throw error if case is missing

      getCaseParameter: (flowStatus) => {
        return {
          Title: `Søknad om tilskudd - Inkludering og redusert utenforskap - ${flowStatus.parseJson.result.DialogueInstance.Halvårsrapporte.Innsender.Organisasjon.Organisasjonsna}` // check for exisiting case with this title
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
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
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: jsonData.Halvårsrapporte.Innsender.Organisasjon.Organisasjonsnu.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Halvårsrapport - Inkludering og redusert utenforskap ',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Rapportering 2025 - fond for inkludering og redusert utenforskap - ${jsonData.Halvårsrapporte.Bakgrunn.Navn_på_tiltake}`,
            // UnofficialTitle: '',
            Archive: 'Saksdokument',
            CaseNumber: flowStatus.handleCase.result.CaseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029', // Seksjon Samfunn og plan. Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'elin.gunleiksrud@vestfoldfylke.no' : 'jorn.roger.skaugen@vestfoldfylke.no',
            AccessCode: 'U'
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%202025%20fond%20for%20inkludering%20og%20redusert%20utenforskap/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Rapportering%202025%20fond%20for%20inkludering%20og%20redusert%20utenforskap/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Halvårsrapporte.Innsender.Organisasjon.Organisasjonsnu, // husk å bruke internal name på kolonnen
              Organisasjonsnavn: jsonData.Halvårsrapporte.Innsender.Organisasjon.Organisasjonsna,
              Navntiltakseier: jsonData.Halvårsrapporte.Bakgrunn.Navn_på_tiltake,
              E_x002d_posttiltakseier: jsonData.Halvårsrapporte.Bakgrunn.E_post_tiltakse,
              Navnkontaktperson: jsonData.Halvårsrapporte.Bakgrunn.Navn_på_kontakt,
              E_x002d_postkontaktperson: jsonData.Halvårsrapporte.Bakgrunn.E_post_til_kont,
              // Resultater: jsonData.Rapportering.Resultater.Gi_en_kort_besk6,
              Varighet: jsonData.Halvårsrapporte.Bakgrunn.Prosjektets_var,
              Ett_x00e5_rig_x0020__x002d__x002: jsonData.Halvårsrapporte.Ettårig___Evalu.Hvordan_har_arb, // ettårig - hvordan bidratt til å redusere,
              Ett_x00e5_rig_x0020__x002d__x0020: jsonData.Halvårsrapporte.Ettårig___Evalu.Antall_i_målgru, // Ettårig - Antall innsatsen har nådd ut til
              Ett_x00e5_rig_x0020__x002d__x0021: jsonData.Halvårsrapporte.Ettårig___Evalu.Skal_prosjektet, // Ettårig - implementeres i drift
              Ett_x00e5_rig_x0020__x002d__x0022: jsonData.Halvårsrapporte.Ettårig___Evalu.Hva_er_hindring, // Ettårig - hindringer
              Ett_x00e5_rig_x0020__x002d__x0023: jsonData.Halvårsrapporte.Ettårig___Evalu.Hvilke_erfaring, // Ettårig - erfaringer
              Fler_x00e5_rig_x0020__x002d__x00: jsonData.Halvårsrapporte.Toårig_eller_me.Er_aktiviteter_, // Fler_x00eFlerårig - Igangsatt etter plan
              Fler_x00e5_rig_x0020__x002d__x000: jsonData.Halvårsrapporte.Toårig_eller_me.Beskriv_kort_år, // Flerårig - årsak ikke igangsatt
              Fler_x00e5_rig_x0020__x002d__x001: jsonData.Halvårsrapporte.Toårig_eller_me.Gi_en_kort_besk7, // Flerårig - beskrivelse av aktiviteter
              Fler_x00e5_rig_x0020__x002d__x002: jsonData.Halvårsrapporte.Toårig_eller_me.Gi_en_kort_besk6, // Flerårig - beskrivelse av resultater
              Er_x0020_tilskuddet_x0020_benytt: jsonData.Halvårsrapporte.Regnskap.Er_tilskuddet_b, // Er tilskuddet benyttet i henhold til søknad og budsjett
              Hvorfor_x0020_ikke: jsonData.Halvårsrapporte.Regnskap.Forklar_hvorfor, // Hvorfor ikke
              Dok_x002e_nr_x002e_P360: flowStatus.archive?.result?.DocumentNumber || 'Ikke automatisk arkivert',
              Acos_x0020_RefId: flowStatus.parseJson.result.Metadata.ReferenceId.Value || 'Ingen Acos RefId'
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
          company: 'Samfunnsutvikling',
          department: 'Seksjon Samfunn og plan',
          description, // Required. A description of what the statistic element represents
          type: 'Rapportering - Fond for inkludering og redusert utenforskap', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive?.result?.DocumentNumber // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
