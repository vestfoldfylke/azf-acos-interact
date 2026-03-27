const description = "Arkivering av søknad til Trafikksikkerhetsordningen og opprettelse av et listeelement i SP. Et prosjekt pr. fylke. En sak pr. kommune"
const { nodeEnv, robotEmail } = require("../config")
const telemarkKommuner = [
  "BAMBLE KOMMUNE",
  "DRANGEDAL KOMMUNE",
  "FYRESDAL KOMMUNE",
  "HJARTDAL KOMMUNE",
  "KRAGERØ KOMMUNE",
  "KVITESEID KOMMUNE",
  "MIDT-TELEMARK KOMMUNE",
  "NISSEDAL KOMMUNE",
  "NOME KOMMUNE",
  "NOTODDEN KOMMUNE",
  "PORSGRUNN KOMMUNE",
  "SELJORD KOMMUNE",
  "SILJAN KOMMUNE",
  "SKIEN KOMMUNE",
  "TINN KOMMUNE",
  "TOKKE KOMMUNE",
  "VINJE KOMMUNE"
]

const vestfoldKommuner = ["FÆRDER KOMMUNE", "HOLMESTRAND KOMMUNE", "HORTEN KOMMUNE", "LARVIK KOMMUNE", "SANDEFJORD KOMMUNE", "TØNSBERG KOMMUNE"]

const getCountyAndProject = (kommune) => {
  let result
  const telemarkProjectNumber = nodeEnv === "production" ? "23-667" : "23-11"
  const vestfoldProjectNumber = nodeEnv === "production" ? "23-666" : "23-10"
  if (telemarkKommuner.includes(kommune)) result = { projectNumber: telemarkProjectNumber, county: "Telemark" }
  if (vestfoldKommuner.includes(kommune)) result = { projectNumber: vestfoldProjectNumber, county: "Vestfold" }
  if (!result) throw new Error(`${kommune} is not a valid kommune`)
  return result
}

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
string Tiltakstype
string NavnHoldningsskapendeTiltak
string Vegtype
string Vegnavn
string Avsender
string Kontaktperson
string AnsvarligEpost
string Kommune
string Mobilnummer
string Epost
string Prosjekttype
string Prosjektnavn
string Innspill_utvikling
string Vegnr
string HPMeter
string Arsdogntrafikk
string Fartsgrense
string Gjennomforingstidspunkt
string Prosjektbegrunnelse
string Problembeskrivelse
string ForeslattLosning
string Trafikksikkerhetstiltak
string ForventetEffekt
string TotalKostnadEksMva
string FerdigByggeplan
string KommentarByggeplan
string ForventetDatoFerdigByggeplan
string GodkjentTSPlan
string TSPlanGyldig
string KommentarTSPlan
string ForventetDatoForVedtak
string BeskrevetITiltakslista
string KommentarTiltaksliste
string HenvisningTilKapTSplan
string GodkjentReguleringsplan
string KommentarReguleringsplan
string LinkTilGodkjentRegPlan
string DatoGodkjentReguleringsplan
string PeriodeTSPlan
string ForventetProsjektstart
string ForventetFerdigstillelse
string PrioriteringBarnOgUnge
string PrioriteringUU
string PrioriteringHjertesone

  */
  // sjekker om kommuen har sak fra før, hvis ja, legg dok i denne saken, hvis ikke lag ny sak for kommunen
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Soknad
        return {
          service: "CaseService",
          method: "CreateCase",
          parameter: {
            CaseType: "Sak",
            Project: getCountyAndProject(xmlData.Kommune).projectNumber,
            Title: `Søknad om midler til trafikksikkerhetsordningen 2024 - ${xmlData.Kommune}`,
            Status: "B",
            JournalUnit: "Sentralarkiv",
            SubArchive: "Sakarkiv",
            ArchiveCodes: [
              {
                ArchiveCode: "---",
                ArchiveType: "FELLESKLASSE PRINSIPP",
                Sort: 1
              },
              {
                ArchiveCode: "Q80",
                ArchiveType: "FAGKLASSE PRINSIPP",
                Sort: 2
              }
            ],
            ResponsibleEnterpriseNumber: xmlData.AnsvarligVirksomhet,
            ResponsiblePersonEmail: nodeEnv === "production" ? xmlData.AnsvarligEpost : robotEmail
          }
        }
      },

      getCaseParameter: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Soknad
        return {
          Title: `Søknad om midler til trafikksikkerhetsordningen 2024 - ${xmlData.Kommune}`,
          Project: getCountyAndProject(xmlData.Kommune).projectNumber
        }
      }
    }
  },
  // Arkiverer dokumentet i 360 (Her: elevmappa)
  archive: {
    // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.Soknad
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const veg = xmlData.Vegtype && xmlData.Vegnr ? `${xmlData.Vegtype}${xmlData.Vegnr} - ` : ""
        const vegnavn = xmlData.Vegnavn ? `${xmlData.Vegnavn} - ` : ""
        const tiltakstype = xmlData.Tiltakstype ? `${xmlData.Tiltakstype}` : ""
        const NavnHoldningsskapendeTiltak = xmlData.NavnHoldningsskapendeTiltak ? `Holdningstiltak - ${xmlData.NavnHoldningsskapendeTiltak}` : ""
        const title = `${veg}${vegnavn}${tiltakstype}${NavnHoldningsskapendeTiltak}`
        return {
          system: "acos",
          template: "ts-ordningen-create-document",
          parameter: {
            orgnr: xmlData.Avsender,
            documentDate: new Date().toISOString(),
            caseNumber,
            responsiblePersonEmail: nodeEnv === "production" ? xmlData.AnsvarligEpost : robotEmail,
            base64,
            title: `Søknad om midler til trafikksikkerhetsordningen 2024 - ${title}`,
            attachments
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
        const xmlData = flowStatus.parseXml.result.Soknad
        return [
          {
            testSiteId: "da8d7ec1-c573-4bc0-8ed6-e1110541f41e",
            testPath: "sites/SMM-alle/Lists/TEST%20%20Trafikksikkerhetsordningen/AllItems.aspx",
            testListId: "01201ac3-3357-430c-9168-de8ab10d5136",
            prodSiteId: "da8d7ec1-c573-4bc0-8ed6-e1110541f41e",
            prodPath: "sites/SMM-alle/Lists/Trafikksikkerhetsordningen%202023/AllItems.aspx",
            prodListId: "91baea84-5263-48fc-800b-29a0c39bf0b2",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Kontaktperson || "Mangler kontaktperson", // husk å bruke internal name på kolonnen
              Kommune: xmlData.Kommune,
              Mobilnummer: xmlData.Mobilnummer,
              E_x002d_postadresse: xmlData.Epost,
              Prosjekttype: xmlData.Prosjekttype,
              Prosjektnavn: xmlData.Prosjektnavn,
              Vegnr_x002e_: xmlData.Vegnr,
              HP_x002d_meterfra_x002f_til: xmlData.HPMeter,
              _x00c5_rsd_x00f8_gntrafikk: xmlData.Arsdogntrafikk,
              Fartsgrense: xmlData.Fartsgrense,
              Gjennomf_x00f8_ringstidspunkt: xmlData.Gjennomføringstidspunkt,
              Prosjektbegrunnelse: xmlData.Prosjektbegrunnelse,
              Problembeskrivelse: xmlData.Problembeskrivelse,
              Foresl_x00e5_ttl_x00f8_sning: xmlData.Trafikksikkerhetstiltak,
              Forventeteffekt: xmlData.ForventetEffekt,
              Totalkostnad: xmlData.TotalKostnadEksMva,
              Ferdigbyggeplan_x003f_: xmlData.FerdigByggeplan,
              Kommentarbyggeplan: xmlData.ForventetDatoFerdigByggeplan,
              Godkjenttrafikksikkerhetsplan_x0: xmlData.TSPlanGyldig,
              Kommentartrafikksikkerhetsplan: xmlData.ForventetDatoForVedtak,
              Beskrevetitiltakslista: xmlData.BeskrevetITiltakslista,
              Kommentartiltaksliste: xmlData.HenvisningTilKapTSplan,
              Godkjentreguleringsplan_x003f_: xmlData.GodkjentReguleringsplan,
              Kommentarreguleringsplan: xmlData.LinkTilGodkjentRegPlan,
              Godkjentreguleringsplan: xmlData.DatoGodkjentReguleringsplan,
              Periodetrafikksikkerhetsplan: xmlData.PeriodeTSPlan,
              Forventetprosjektstart: xmlData.ForventetProsjektstart,
              Forventetferdigstillelse: xmlData.ForventetFerdigstillelse,
              Prioriteringbarnogunge: xmlData.PrioriteringBarnOgUnge,
              PrioriteringUU: xmlData.PrioriteringUU,
              Prioriteringhjertesone: xmlData.PrioriteringHjertesone,
              Fylke: getCountyAndProject(xmlData.Kommune).county
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
        const xmlData = flowStatus.parseXml.result.Soknad
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "SMM",
          department: "Strategi og utvikling",
          description, // Required. A description of what the statistic element represents
          type: "TS-ordningen", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          Kommune: xmlData.Kommune,
          Fylke: getCountyAndProject(xmlData.Kommune).county,
          Prosjektnavn: xmlData.Prosjektnavn
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
