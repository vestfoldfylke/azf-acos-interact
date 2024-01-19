const description = 'Kunstner- og toppidrettsstipend'
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
    string Fnr
    string OrgNr
    string TypeSoker
    string OmProsjektet
    string Kategori // Toppidrettsstipend eller Kunstnerstipend
    string Idrettsgren
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
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
        let caseNumber
        let archiveTitle
        if (flowStatus.parseXml.result.ArchiveData.Kategori === 'Toppidrettsstipend') {
          archiveTitle = `Søknad om idrettsstipend - ${xmlData.Idrettsgren}`
          caseNumber = nodeEnv === 'production' ? '24/04614' : '24/00018'
        } else if (flowStatus.parseXml.result.ArchiveData.Kategori === 'Kunstnerstipend') {
          archiveTitle = ` Søknad om kunstnerstipend - ${xmlData.Idrettsgren}`
          caseNumber = nodeEnv === 'production' ? '24/04615' : '24/00017'
        } else {
          throw new Error('Kategori må være enten Toppidrettsstipend eller Kunstnerstipend')
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
                ReferenceNumber: xmlData.Fnr,
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: archiveTitle,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: archiveTitle,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200022' : '200032', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            // ResponsiblePersonEmail: '',
            AccessCode: '5',
            Paragraph: 'Offl. § 5',
            AccessGroup: 'Seksjon Kultur'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-Ekstern-Toppidrettsstipend/Lists/SoknadKunstnerToppidrettsstipend/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/SAMU-Ekstern-Toppidrettsstipend/Lists/SoknadKunstnerToppidrettsstipend/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.ForNavn,
              Kategori: xmlData.Kategori,
              Idrettsgren_x002f_Kunstuttrykk: xmlData.Idrettsgren,
              F_x00f8_dselsdato: xmlData.Fdato,
              Hva: xmlData.Hva,
              S_x00f8_knadssum: xmlData.Soknadssum,
              M_x00e5_lsetting: xmlData.Maalsetting,
              Fjor_x00e5_ret: xmlData.Fjoraaret
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
          type: 'Kunstner- og toppidrettsstipend', // Required. A short searchable type-name that distinguishes the statistic element
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
