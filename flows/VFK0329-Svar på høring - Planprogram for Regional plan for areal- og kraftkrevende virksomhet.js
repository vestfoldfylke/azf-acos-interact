const description = 'Svar på høring - planprogram for Regional plan for areal- og kraftkrevende virksomhet'
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
ArchiveData {
  string navn
  string mobil
  string fnr
  string epost
  string organisasjon
  string orgnr
  string innspillFremdriftsplan
  string innspillOrganisering
  string innspillGjennomforing
  string innspillSaerligAktuelle
  string innspillTemaene
  string andreInnspill
  string privatperson
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.fnr
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.privatperson === 'Nei'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.orgnr.replaceAll(' ', '')
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
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
                Role: 'Avsender',
                ReferenceNumber: xmlData.privatperson === 'Ja' ? xmlData.fnr : xmlData.orgnr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
                Title: 'Høringssvar',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200024' : '200030', // Seksjon Klima og næring. Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            // ResponsiblePersonEmail: nodeEnv === 'production' ? 'kjersti.visnes.oksenholt@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Regional plan for areal- og kraftkrevende virksomhet - Høringsinnspill',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/06820' : '25/00017'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Planforareal-ogkraftkrevendevirksomhetRPAK/Lists/Svar%20p%20hring%20%20planprogram%20for%20Regional%20plan%20for%20ar/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/Planforareal-ogkraftkrevendevirksomhetRPAK/Lists/Svar%20p%20hring%20%20planprogram%20for%20Regional%20plan%20for%20ar/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.navn, // husk å bruke internal name på kolonnen
              Mobil: xmlData.mobil,
              E_x002d_post: xmlData.epost,
              Organisasjon: xmlData.organisasjon || 'Privatperson',
              Innspill_x0020_til_x0020_fremdri: xmlData.innspillFremdriftsplan,
              Innspill_x0020_til_x0020_organis: xmlData.innspillOrganisering,
              Innspill_x0020_til_x0020_temaene: xmlData.innspillGjennomforing,
              Innspill_x0020_til_x0020_temaene0: xmlData.innspillTemaene,
              Andre_x0020_innspill: xmlData.andreInnspill,
              S_x00e6_rlig_x0020_aktuelle_x002: xmlData.innspillSaerligAktuelle,
              Dokumentnummer_x0020_i_x0020_360: flowStatus.archive.result.DocumentNumber
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samfunnsutvikling',
          department: 'Seksjon Klima og næring',
          description,
          type: 'Svar på høring - planprogram for Regional plan for areal- og kraftkrevende virksomhet', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
