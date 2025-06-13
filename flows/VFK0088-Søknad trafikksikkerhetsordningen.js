const description = 'Arkivering av søknad til Trafikksikkerhetsordningen og opprettelse av et listeelement i SP. Et prosjekt pr. fylke. En sak pr. kommune'
const { nodeEnv } = require('../config')

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
  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.KommuneOrgNr.replaceAll(' ', '')
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const veg = xmlData.Vegtype && xmlData.Vegnr ? `${xmlData.Vegtype}${xmlData.Vegnr} - ` : ''
        const vegnavn = xmlData.Vegnavn ? `${xmlData.Vegnavn} - ` : ''
        const tiltakstype = xmlData.Tiltakstype ? `${xmlData.Tiltakstype}` : ''
        const NavnHoldningsskapendeTiltak = xmlData.NavnHoldningsskapendeTiltak ? `Holdningstiltak - ${xmlData.NavnHoldningsskapendeTiltak}` : ''
        const title = `${veg}${vegnavn}${tiltakstype}${NavnHoldningsskapendeTiltak}`
        const municipalityCaseNumbers = [
          {
            name: 'Færder kommune',
            caseNo: '25/10645',
            testCaseNo: '24/00050'
          },
          {
            name: 'Tønsberg kommune',
            caseNo: '25/10646',
            testCaseNo: '24/00050'
          },
          {
            name: 'Sandefjord kommune',
            caseNo: '25/10647',
            testCaseNo: '24/00050'
          },
          {
            name: 'Larvik kommune',
            caseNo: '25/10648',
            testCaseNo: '24/00050'
          },
          {
            name: 'Horten kommune',
            caseNo: '25/10649',
            testCaseNo: '24/00050'
          },
          {
            name: 'Holmestrand kommune',
            caseNo: '25/10650',
            testCaseNo: '24/00050'
          }
        ]
        if (!xmlData.Kommune) {
          throw new Error('Could not find Kommune in xmlData')
        }
        const municipality = municipalityCaseNumbers.find(municipality => municipality.name.toUpperCase() === xmlData.Kommune.toUpperCase())
        if (!municipality) throw new Error(`Could not find any municipallity in the list named ${xmlData.Kommune}`)
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
            AccessCode: 'U',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseXml.result.ArchiveData.KommuneOrgNr.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad om midler til trafikksikkerhetsordningen 2026',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: '',
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200015' : '200018', // Seksjon Sektorstøtte, inntak og eksamen
            ResponsiblePersonEmail: 'henriette.auensen@vestfoldfylke.no',
            Status: 'J',
            Title: `Søknad om midler til trafikksikkerhetsordningen 2026 - ${title}`,
            // UnofficialTitle: `Søknad om godkjenning av tidligere bestått videregående opplæring i Norge eller utlandet - ${xmlData.Fornavn} ${xmlData.Etternavn}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? municipality.caseNo : municipality.testCaseNo
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/TSordningen%202026/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/TSordningen%202026/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Kontaktperson || 'Mangler kontaktperson', // husk å bruke internal name på kolonnen
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
              Prioriteringhjertesone: xmlData.PrioriteringHjertesone
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
          department: 'Strategi og utvikling',
          description, // Required. A description of what the statistic element represents
          type: 'TS-ordningen', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          Kommune: xmlData.Kommune,
          Prosjektnavn: xmlData.Prosjektnavn
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
