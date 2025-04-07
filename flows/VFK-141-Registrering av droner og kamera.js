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
            const sharepointCameraElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Kameraivfk/AllItems.aspx',
              prodListUrl: 'hhttps://vestfoldfylke.sharepoint.com/sites/innsida-varorganisasjon/Lists/Kameraivfk/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: row.Kameranavn || 'Mangler kameranavn',
                Fornavn: jsonData.Informasjon_om_.Fornavn1,
                Etternavn: jsonData.Informasjon_om_.Etternavn1,
                E_x002d_post: jsonData.Informasjon_om_.E_post,
                Telefon: jsonData.Informasjon_om_.Telefon1,
                Enhetsnavn: jsonData.Informasjon_om_.Enhetsnavn,
                Virksomhet: jsonData.Informasjon_om_.Virksomhet,
                Systemeier: jsonData.Informasjon_om_.Systemeier,
                Hvaskalregistreres: jsonData.Informasjon_om_.Hva_skal_regist,
                Kameranavn: row.Kameranavn,
                Typekamera: row.Type_kamera,
                Etablerings_x00e5_r: row.Etableringsår,
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
                Hvordansikresinnsamletpersondata: row.Hvordan_sikres_,
                Hvordanlagresopptakogbilder_x003: row.Hvordan_lagres_,
                Beskrivsletterutinene: row.Beskriv_sletter,
                Hvemhartilgangtillivebilder_x003: row.Hvem_har_tilgan2,
                Hvemhartilgangtilopptak_x003f_: row.Hvem_har_tilgan1,
                Erdetutf_x00f8_rtDPIAsominnehold: row.Er_det_utført_D,
                DatoforDPIA: row.Dato_for_DPIA,
                N_x00e5_rplanleggesDPIAmedROS_x0: row.Når_planlegges_,
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
                Title: row2.Dronenavn || 'Mangler dronenavn',
                Fornavn: jsonData.Informasjon_om_.Fornavn1,
                Etternavn: jsonData.Informasjon_om_.Etternavn1,
                E_x002d_post: jsonData.Informasjon_om_.E_post,
                Telefon: jsonData.Informasjon_om_.Telefon1,
                Enhetsnavn: jsonData.Informasjon_om_.Enhetsnavn,
                Virksomhet: jsonData.Informasjon_om_.Virksomhet,
                Systemeier: jsonData.Informasjon_om_.Systemeier,
                Hvaskalregistreres: jsonData.Informasjon_om_.Hva_skal_regist,
                Dronenavn: row2.Dronenavn,
                Type_x002f_modell: row2.Type_modell,
                Etablerings_x00e5_r: row2.Etableringsår1,
                Ansvarligenhet: row2.Ansvarlig,
                Seksjon: row2.Seksjon,
                Brukavprogramvare: row2.Bruk_av_program,
                Systemansvarligforprogramvaren: row2.Systemansvarlig1,
                Geografiskbruksomr_x00e5_de_x002: row2.Geografisk_bruk1,
                Erdronenregistrertp_x00e5_flydro: row2.Er_dronen_regis,
                N_x00e5_rbledenregistrert_x003f_: row2.Når_ble_den_reg,
                Harpilotentattdronesertifikat_x0: row2.Har_piloten_tat,
                Operat_x00f8_rnummer: row2.Operatørnummer,
                N_x00e5_r_x0020_planlegges_x0020: row2.Når_planlegges_1,
                N_x00e5_rblepilotenregistrert: row2.Når_ble_piloten,
                Gj_x00f8_resdetopptak_x003f_: row2.Gjøres_det_oppt1,
                N_x00e5_rgj_x00f8_resdetopptak_x: row2.Når_gjøres_det_1,
                Filmesdetlive_x003f_: row2.Filmes_det_live1,
                N_x00e5_rfilmesdetlive_x003f_: row2.Når_filmes_det_1,
                Hvaeridronenssynsfelt_x003f_: row2.Hva_er_i_dronen,
                Hvordansikrespersondatasomersaml: row2.Hvordan_sikres_1,
                Hvorlagresfilm_x002c_opptakogbil: row2.Hvor_lagres_fil1,
                Hvordanlagresfilm_x002c_opptakog: row2.Hvordan_lagres_1,
                Beskrivsletterutinene: row2.Beskriv_sletter1,
                Hvemhartilgangtillivebilder_x003: row2.Hvem_har_tilgan5,
                Hvemhartilgangtilopptak_x003f_: row2.Hvem_har_tilgan4,
                Erdetutf_x00f8_rtDPIAsominnehold: row2.Er_det_utført_D1,
                DatoforDPIA: row2.Dato_for_DPIA1,
                N_x00e5_rplanleggesDPIAmedROS_x0: row2.Når_planlegges_2,
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
