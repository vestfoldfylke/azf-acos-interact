const description = 'Tilskudd til idrettsarrangement og regionale idrettsanlegg'
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
    int Aar
    string Type
    string Orgnavn
    string Orgnr
    string ArrAnlNavn
    string GjTidspunkt
    string Sted
    string Kommune
    string TildeltArr
    string Besk
    int Soknadssum
    int SumUtg
    string HvaTilskuddTil
    string Epost
    string Kontonr
}

  */
  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.Orgnr.replaceAll(' ', '')
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
        let caseNumber
        if (flowStatus.parseXml.result.ArchiveData.Type === 'Tilskudd til idrettsarrangement') {
          caseNumber = nodeEnv === 'production' ? '24/24857' : '24/00006'
        } else if (flowStatus.parseXml.result.ArchiveData.Type === 'Tilskudd til regionale idrettsanlegg') {
          caseNumber = nodeEnv === 'production' ? '24/24857' : '24/00007'
        } else {
          throw new Error('Type tilskudd er feil eller har ikke kommet med')
        }
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
                ReferenceNumber: xmlData.Orgnr.replaceAll(' ', ''),
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
                Title: 'Søknad om fylkeskommunale midler til idrettsarrangement',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om fylkeskommunale midler til idrettsarrangement 2024 – ${xmlData.ArrAnlNavn}`,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            AccessCode: 'U',
            Paragraph: '',
            AccessGroup: 'Alle'
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
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-IdrettogfriluftslivVTFK-Sknader-idrettsarrangementogregionaleanlegg/Lists/Sknader/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/KRIF-IdrettogfriluftslivVTFK-Sknader-idrettsarrangementogregionaleanlegg/Lists/Sknader/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Orgnavn,
              Arrangements_x002d_anleggsnavn: xmlData.ArrAnlNavn,
              Gjennomf_x00f8_ringstidspunkt: xmlData.GjTidspunkt,
              Arrangements_x002d__x002f_anlegs: xmlData.Sted,
              Kommune: xmlData.Kommune,
              Tildeltarranegement: xmlData.TildeltArr,
              Beskrivelse: xmlData.Besk,
              Tilskudd: xmlData.HvaTilskuddTil,
              Sumutgifter: xmlData.SumUtg,
              S_x00f8_knadssum: xmlData.Soknadssum,
              E_x002d_post: xmlData.Epost,
              Organisasjonsnummer: xmlData.Orgnr,
              Kontonummerforutetaling: xmlData.Kontonr,
              Tilskuddsordning: xmlData.Type,
              _x00c5_rstall: xmlData.Aar
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
          company: 'Kultur',
          department: '',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskudd til idrettsarrangement og regionale idrettsanlegg', // Required. A short searchable type-name that distinguishes the statistic element
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
