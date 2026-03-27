const description = "Arkivering av søknad til Trafikksikkerhetsordningen og opprettelse av et listeelement i SP. Et prosjekt pr. fylke. En sak pr. kommune"
const { nodeEnv } = require("../config")

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (_dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {}
      }
    }
  },

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette/oppdatere en virksomhet i P3360
        return {
          orgnr: flowStatus.parseJson.result.SavedValues.Dataset.Kommune.Orgnr.replaceAll(" ", "")
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const veg =
          jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Kommunal__eller_fylkesve && jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2Vegnummer2
            ? `${jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Kommunal__eller_fylkesve}${jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2Vegnummer2} - `
            : ""
        const vegnavn = jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Vegnavn ? `${jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Vegnavn} - ` : ""
        const tiltakstype = jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Tiltakstype ? `${jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Tiltakstype}` : ""
        const NavnHoldningsskapendeTiltak = jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Navn_pa_holdningsskapend
          ? `Holdningstiltak - ${jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Navn_pa_holdningsskapend}`
          : ""
        const title = `${veg}${vegnavn}${tiltakstype}${NavnHoldningsskapendeTiltak}`
        const municipalityCaseNumbers = [
          {
            name: "Færder kommune",
            caseNo: "25/10645",
            testCaseNo: "24/00050"
          },
          {
            name: "Tønsberg kommune",
            caseNo: "25/10646",
            testCaseNo: "24/00050"
          },
          {
            name: "Sandefjord kommune",
            caseNo: "25/10647",
            testCaseNo: "24/00050"
          },
          {
            name: "Larvik kommune",
            caseNo: "25/10648",
            testCaseNo: "24/00050"
          },
          {
            name: "Horten kommune",
            caseNo: "25/10649",
            testCaseNo: "24/00050"
          },
          {
            name: "Holmestrand kommune",
            caseNo: "25/10650",
            testCaseNo: "24/00050"
          }
        ]
        if (!jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Kommune) {
          throw new Error("Could not find Kommune in xmlData")
        }
        const municipality = municipalityCaseNumbers.find((municipality) => municipality.name.toUpperCase() === jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Kommune.toUpperCase())
        if (!municipality) throw new Error(`Could not find any municipallity in the list named ${jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Kommune}`)
        const p360Attachments = attachments.map((att) => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: "F",
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: "DocumentService",
          method: "CreateDocument",
          parameter: {
            AccessCode: "U",
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Dataset.Kommune.Orgnr.replaceAll(" ", ""),
                Role: "Avsender",
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Søknad om midler til trafikksikkerhetsordningen 2026",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "",
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            ResponsiblePersonEmail: nodeEnv === "production" ? "henriette.auensen@vestfoldfylke.no" : "jorn.roger.skaugen@vestfoldfylke.no",
            Status: "J",
            Title: `Søknad om midler til trafikksikkerhetsordningen 2026 - ${title}`,
            // UnofficialTitle: `Søknad om godkjenning av tidligere bestått videregående opplæring i Norge eller utlandet - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
            Archive: "Saksdokument",
            CaseNumber: nodeEnv === "production" ? municipality.caseNo : municipality.testCaseNo
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
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/TSordningen%202026/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/TSordningen%202026/AllItems.aspx",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Kontaktperson || "Mangler kontaktperson", // husk å bruke internal name på kolonnen
              Kommune: jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Kommune,
              Mobilnummer: jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.Mobilnummer,
              E_x002d_postadresse: jsonData.Bakgrunnsinformasjon.Kontaktinformasjon.E_postadresse,
              Prosjekttype: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Prosjekttype,
              Prosjektnavn: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Navn_pa_prosjektet,
              Vegnr_x002e_: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Vegnummer2,
              HP_x002d_meterfra_x002f_til: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Vegreferanse__strekning_,
              _x00c5_rsd_x00f8_gntrafikk: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2._rsdogntrafikk,
              Fartsgrense: jsonData.Bakgrunnsinformasjon.Bakgrunnsinformasjon2.Fartsgrense_,
              Gjennomf_x00f8_ringstidspunkt: jsonData.Bakgrunnsinformasjon.Tidspunkt_for_gjennomfor,
              Prosjektbegrunnelse: jsonData.Om_prosjektet.Prosjektbegrunnelse.Hvorfor_onsker_kommunen_,
              Problembeskrivelse: jsonData.Om_prosjektet.Problembeskrivelse.Hva_er_dagens_utfordring,
              Foresl_x00e5_ttl_x00f8_sning: jsonData.Om_prosjektet.Trafikksikkerhetstiltak.Beskriv_tiltaket_kommune,
              Forventeteffekt: jsonData.Om_prosjektet.Forventet_effekt_av_tilt.Hvilke_forbedringer_forv,
              Totalkostnad: jsonData.Kostnader.Summering.Beregnet_totalk1,
              Ferdigbyggeplan_x003f_: jsonData.Planstatus_og_ferdigstil.Planstatus.Er_byggeplan_ferdig_,
              Kommentarbyggeplan: jsonData.Planstatus_og_ferdigstil.Planstatus.Forventet_dato_for_ferdi,
              Godkjenttrafikksikkerhetsplan_x0: jsonData.Planstatus_og_ferdigstil.Planstatus.Er_trafikksikkerhetsplan2,
              Kommentartrafikksikkerhetsplan: jsonData.Planstatus_og_ferdigstil.Planstatus.Forventet_dato_for_vedta,
              Beskrevetitiltakslista: jsonData.Planstatus_og_ferdigstil.Planstatus.Er_tiltaket_beskrevet_i_,
              Kommentartiltaksliste: jsonData.Planstatus_og_ferdigstil.Planstatus.Henvisning_til_kapittel_,
              Godkjentreguleringsplan_x003f_: jsonData.Planstatus_og_ferdigstil.Planstatus.Er_reguleringsplanen_god,
              Kommentarreguleringsplan: jsonData.Planstatus_og_ferdigstil.Planstatus.Link_til_godkjent_regule,
              Godkjentreguleringsplan: jsonData.Planstatus_og_ferdigstil.Planstatus.Forventet_dato_for_regul,
              Periodetrafikksikkerhetsplan: jsonData.Planstatus_og_ferdigstil.Planstatus.Periode_for_trafikksikke,
              Forventetprosjektstart: jsonData.Planstatus_og_ferdigstil.Framdrift_og_ferdigstill.Dato_for_forventet_prosj,
              Forventetferdigstillelse: jsonData.Planstatus_og_ferdigstil.Framdrift_og_ferdigstill.Dato_for_forventet_ferdi,
              Prioriteringbarnogunge: jsonData.Om_prosjektet.Prioriteringskriterier.Er_tiltaket_i_et_omrade_,
              PrioriteringUU: jsonData.Om_prosjektet.Prioriteringskriterier.Vil_tiltaket_bedre_sikke,
              Prioriteringhjertesone: jsonData.Om_prosjektet.Prioriteringskriterier.Er_tiltaket_i_et_omrade_2
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
          company: "Samferdsel",
          department: "Strategi og utvikling",
          description, // Required. A description of what the statistic element represents
          type: "TS-ordningen", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
