const description = 'Svar på høring - Regional plan for bærekraftig arealpolitikk'
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
  string innspillFormal
  string innspillProsess
  string innspillOrganisering
  string innspillGjennomforing
  string innspillTemaene
  string andreInnspill
  string privatperson
}

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
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200029', // Seksjon Samfunn og plan. Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'kjersti.visnes.oksenholt@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Høringsinnspill - Revisjon av RPBA 2025 - 2027 - Planprogram',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '24/18974' : '25/00010'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/RPBA-revisjon2025-2026/Lists/Hringssvar%20RPBA/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/RPBA-revisjon2025-2026/Lists/Hringssvar%20RPBA/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.navn, // husk å bruke internal name på kolonnen
              Mobil: xmlData.mobil,
              E_x002d_post: xmlData.epost,
              Organisasjon: xmlData.organisasjon || 'Privatperson',
              Innspill_x0020_til_x0020_form_x0: xmlData.innspillFormal,
              Innspill_x0020_til_x0020_prosess: xmlData.innspillProsess,
              Innspill_x0020_til_x0020_organis: xmlData.innspillOrganisering,
              Innspill_x0020_til_x0020_gjennom: xmlData.innspillGjennomforing,
              Innspill_x0020_til_x0020_temaene: xmlData.innspillTemaene,
              Andre_x0020_innspill: xmlData.andreInnspill,
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
          department: 'Seksjon Samfunn og plan',
          description,
          type: 'Svar på høring - Regional plan for bærekraftig arealpolitikk', // Required. A short searchable type-name that distinguishes the statistic element
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
