const description = 'Søknad om tilskudd til verneverdige kulturminner'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'som privatperson'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'på vegne av en organisasjon eller stiftelse'
      },
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.OrgNr.replaceAll(' ', '')
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '25-134' : '24-1',
            Title: `Tilskudd til verneverdige kulturminner 2025 - ${flowStatus.parseXml.result.ArchiveData.NavnKulturminne}`,
            // UnofficialTitle: ,
            Status: 'B',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Sakarkiv',
            ArchiveCodes: [
              {
                ArchiveCode: '223',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'C50',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200022' : '200032',
            // ResponsiblePersonEmail: '',
            AccessGroup: 'Alle'
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        let sender
        if (flowStatus.parseXml.result.ArchiveData.TypeSoker === 'på vegne av en organisasjon eller stiftelse') {
          sender = xmlData.OrgNr.replaceAll(' ', '')
        } else {
          sender = xmlData.Fnr
        }
        // const caseNumber = nodeEnv === 'production' ? 'må fylles inn!' : '23/00115'
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
                ReferenceNumber: sender,
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
                Title: 'Søknad om tilskudd til verneverdige kulturminner',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Tilskudd til verneverdige kulturminner 2025 - ${flowStatus.parseXml.result.ArchiveData.NavnKulturminne}`,
            // UnofficialTitle: 'Søknad om utsetting av ferskvannsfisk',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200022' : '200032', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            // ResponsiblePersonEmail: '',
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            AccessGroup: 'Seksjon Kulturarv'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20verneverdige%20kulturminner%20i%20privat%20ei/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskudd%20til%20verneverdige%20kulturminner%20i%20privat%20ei/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Etternavn || 'Mangler Etternavn', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Postnummer: xmlData.Postnummer,
              Sted: xmlData.Sted,
              Mobilnummer: xmlData.Mobilnummer,
              E_x002d_post: xmlData.Epost,
              Kontonummer: xmlData.Kontonummer,
              S_x00f8_ker_x0020_som: xmlData.SokerSom,
              Organisasjonsnummer: xmlData.OrgNr,
              Organisasjonsnavn: xmlData.OrgNavn,
              Adresse_x0020__x0028_organisasjo: xmlData.OrgAdresse,
              Postnummer_x0020__x0028_organisa: xmlData.OrgPostnummer,
              Poststed_x0020__x0028_organisasj: xmlData.OrgPoststed,
              Navn_x0020_p_x00e5__x0020_kultur: xmlData.KulturminnetNavn,
              Beskrivelse_x0020_av_x0020_kultu: xmlData.KulturminnetBeskrivelse,
              Dagens_x0020_bruk: xmlData.DagensBruk,
              Fremtidig_x0020_bruk: xmlData.FremtidigBruk,
              Eier_x0020_av_x0020_kulturminnet: xmlData.KulturminnetEier,
              Er_x0020_s_x00f8_ker_x0020_eier_: xmlData.ErSokerEier,
              Kommune_x0020__x0028_kulturminne: xmlData.KulturminnetKommune,
              G_x00e5_rds_x002d__x0020_og_x002: xmlData.KulturminnetGardsBruksNr,
              Adresse_x0020__x0028_kulturminne: xmlData.KulturminnetAdresse,
              Postnummer_x0020_og_x0020_sted_x: xmlData.KulturminnetPostNrSted,
              Startdato: xmlData.Startdato,
              Sluttdato: xmlData.Sluttdato,
              Er_x0020_tiltaket_x0020_allerede: xmlData.ErTiltaketUtfort,
              Tiltakstype: xmlData.Tiltakstype,
              Tiltakstype_x0020_restaurering: xmlData.TiltakstypeRestaurering,
              Tiltakstype_x0020_Sikring: xmlData.Tiltakstype_x0020_Sikring,
              Tiltakstype_x0020_tilbakef_x00f8: xmlData.TiltakstypeTilbakeforing,
              Kort_x0020_beskrivelse: xmlData.KortBeskrivelse,
              Navn_x0020_p_x00e5__x0020_ansvar: xmlData.NavnHandverker,
              S_x00f8_knadsbel_x00f8_p: xmlData.Soknadsbelop,
              Andre_x0020_tilskudd: xmlData.AndreTilskudd,
              Egeninnsats_x0020_og_x0020_annen: xmlData.Egeninnsats,
              Sum_x0020_inntekter: xmlData.SumInntekter,
              Sum_x0020_kostnader: xmlData.SumKostnader,
              Offentlig_x0020_st_x00f8_tte: xmlData.OffentligStotte,
              Informasjon_x0020_om_x0020_offen: xmlData.OffentligStotteInfo,
              Dokumentnummer_x0020_360: flowStatus.archive.result.DocumentNumber
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
          department: 'Kulturarv',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskudd til verneverdige kulturminner', // Required. A short searchable type-name that distinguishes the statistic element
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
