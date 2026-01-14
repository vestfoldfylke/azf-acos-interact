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
  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person med fiktivt fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
          forceUpdate: false // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },
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
            AccessGroup: 'Seksjon Virksomhetsstyring',
            Category: 'Internt notat uten oppfølging',
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Registrering av droner og kamera',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            AccessCode: '14',
            Paragraph: 'Offl. § 14',
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            // ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: 'J',
            Title: `Registrering av droner og kamera - ${jsonData.Informasjon_om_.Virksomhet}`,
            UnofficialTitle: `Registrering av droner og kamera - ${jsonData.Informasjon_om_.Virksomhet}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/06771' : '25/00016'
          }
        }
      }
    }
  },
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const sharepointElements = []
        const cameraList = jsonData.Registrering_av.Kamera
        const droneList = jsonData.Registrering_av1.Drone
        if (cameraList.length === 0 && droneList.length === 0) throw new Error('Ingen kamera eller droner i JSON filen')
        if (jsonData.Informasjon_om_.Hva_skal_regist.includes('Kamera')) {
          for (const row of cameraList) {
            let anlegg
            if (row.Gjelder_registr !== 'Enkeltkamera') {
              anlegg = true
            }
            const sharepointCameraElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Kameraivfk/AllItems.aspx',
              prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Kameraivfk/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: anlegg ? row.Navn___nummer_p : row.Kameranummer___,
                Fornavn: jsonData.Informasjon_om_.Fornavn1,
                Etternavn: jsonData.Informasjon_om_.Etternavn1,
                E_x002d_post: jsonData.Informasjon_om_.E_post,
                Telefon: jsonData.Informasjon_om_.Telefon1,
                Enhetsnavn: jsonData.Informasjon_om_.Enhetsnavn,
                Virksomhet: jsonData.Informasjon_om_.Virksomhet,
                Arbeidssted: jsonData.Informasjon_om_.Arbeidssted,
                Systemeier: jsonData.Informasjon_om_.Systemeier,
                Hvilkenseksjontilh_x00f8_rerkame: jsonData.Informasjon_om_.Hvilken_seksjon,
                Hvaskalregistreres: jsonData.Informasjon_om_.Hva_skal_regist,
                Kameranavn: row.Kameranummer___,
                Form_x00e5_letmedkameraet: row.Form\u00E5let_med_\u00E5_,
                Gjelderregistreringenenkeltkamer: row.Gjelder_registr,
                Navn_x002f_nummerp_x00e5_kameraa: row.Navn___nummer_p,
                Plasseringavanlegg: row.Plassering_av_a,
                Hvormangekameraerbest_x00e5_ranl: Number(row.Hvor_mange_kame),
                Typekamera: row.Type_kamera,
                Kameraetstypeogmodell: row.Kameraets_type_,
                Etablerings_x00e5_r: row.Etableringsår,
                Systemansvarligforprogramvare: row.Systemansvarlig,
                Navnp_x00e5_programvare: row.Navn_på_program,
                Systemansvarligforkamera: row.Systemansvarlig,
                Plassering: row.Plassering,
                Erkameraendelavskallsikring_x003: row.Er_kamera_en_de,
                Hvordanaktiveresskallsikringen_x: row.Hvordan_aktiver,
                Gj_x00f8_resdetopptak_x003f_: row.Gjøres_det_oppt,
                N_x00e5_rgj_x00f8_resdetopptak_x: row.Når_gjøres_det_,
                Filmesdetlive_x003f_: row.Filmes_det_live,
                N_x00e5_rfilmesdet_x003f_: row.Når_filmes_det_,
                Hvaerikameraetssynsfelt_x003f_: row.Hva_er_i_kamera,
                Aktivereskamerakunvedbevegelser_: row.Aktiveres_kamer,
                Hvorlagresfilm_x002c_opptakogbil: row.Hvor_lagres_fil,
                Hvemhartilgangtillivebilder_x003: row.Hvem_har_tilgan6,
                Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
              }
            }
            sharepointElements.push(sharepointCameraElement)
          }
        }
        if (jsonData.Informasjon_om_.Hva_skal_regist.includes('Drone')) {
          for (const row2 of droneList) {
            const sharepointDroneElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Dronerivfk/AllItems.aspx',
              prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Dronerivfk/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: row2.Dronenummer1 || 'Mangler dronenummer',
                Fornavn: jsonData.Informasjon_om_.Fornavn1,
                Etternavn: jsonData.Informasjon_om_.Etternavn1,
                E_x002d_post: jsonData.Informasjon_om_.E_post,
                Telefon: jsonData.Informasjon_om_.Telefon1,
                Enhetsnavn: jsonData.Informasjon_om_.Enhetsnavn,
                Virksomhet: jsonData.Informasjon_om_.Virksomhet,
                Arbeidssted: jsonData.Informasjon_om_.Arbeidssted,
                Systemeier: jsonData.Informasjon_om_.Systemeier,
                Hvaskalregistreres: jsonData.Informasjon_om_.Hva_skal_regist,
                // Dronenavn: row2.Dronenavn,
                Serienummer: row2.Serienummer,
                Form_x00e5_letmed_x00e5_brukedro: row2.Formålet_med_å_1,
                Dronenummer: row2.Dronenummer1,
                Type_x002f_modell: row2.Type_modell,
                Etablerings_x00e5_r: row2.Etableringsår3,
                Seksjon: row2.Seksjon,
                Systemansvarligfordronen: row2.Systemansvarlig3,
                Brukavprogramvare: row2.Bruk_av_program1,
                Geografiskbruksomr_x00e5_de_x002: row2.Sted_område_som,
                Harpilotentattdronesertifikat_x0: row2.Har_piloten_tat,
                N_x00e5_r_x0020_planlegges_x0020: row2.Når_planlegges_1,
                HarpilotenregistrertsegunderVest: row2.Har_piloten_reg,
                Hvorlagresfilm_x002c_opptakogbil: row2.Hvor_lagres_opp2,
                Hvemhartilgangtillivebilder_x003: row2.Hvem_har_tilgan7,
                Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
              }
            }
            sharepointElements.push(sharepointDroneElement)
          }
        }
        return sharepointElements
      }
    }
  },
  groundControl: {
    enabled: false // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  failOnPurpose: {
    enabled: false
  }
}
