const description = 'Søknad om utviklingsmidler til formidling av kulturarv'
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

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Hvem_s\u00F8ker_du_p === 'Meg selv'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Privatperson.F\u00F8dselsnummer1
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Hvem_s\u00F8ker_du_p === 'En organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
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
            Project: nodeEnv === 'production' ? '25-152' : '24-2',
            Title: `Søknad om utviklingsmidler til formidling av kulturarv - ${flowStatus.parseJson.result.DialogueInstance.Beskrivelse_av_.Om_prosjektet.Prosjekttittel}`,
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
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200022' : '200032',
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'eira.bjorvik@vestfoldfylke.no' : 'nils.thvedt@vestfoldfylke.no',
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        let sender
        if (jsonData.Informasjon_om_.Hvem_s\u00F8ker_du_p === 'En organisasjon') {
          sender = jsonData.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        } else {
          sender = jsonData.Informasjon_om_.Privatperson.F\u00F8dselsnummer1
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
                Title: 'Søknad om utviklingsmidler til formidling av kulturarv',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om utviklingsmidler til formidling av kulturarv - ${jsonData.Beskrivelse_av_.Om_prosjektet.Prosjekttittel}`,
            // UnofficialTitle: 'Søknad om utsetting av ferskvannsfisk',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            // ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200025' : '200031', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'eira.bjorvik@vestfoldfylke.no' : 'nils.thvedt@vestfoldfylke.no',
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
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        let contactPerson
        if (jsonData.Informasjon_om_.Hvem_s\u00F8ker_du_p === 'En organisasjon') {
          contactPerson = `${jsonData.Informasjon_om_.Kontaktperson1.Fornavn2} ${jsonData.Informasjon_om_.Kontaktperson1.Etternavn2}`
        } else {
          contactPerson = 'søker som privatperson'
        }
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskuddsordning%20formidling%20kulturarv/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-Samfunnsutvikling/Lists/Tilskuddsordning%20formidling%20kulturarv/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: jsonData.Beskrivelse_av_.Om_prosjektet.Prosjekttittel,
              S_x00f8_ker_x0020_p_x00e5__x0020: jsonData.Informasjon_om_.Hvem_s\u00F8ker_du_p,
              Innsender: `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
              Organisasjonsnavn: jsonData.Informasjon_om_.Organisasjon.Organisasjonsna || 'søker som privatperson',
              Kontaktperson: contactPerson,
              Kort_x0020_beskrivelse_x0020_av_: jsonData.Beskrivelse_av_.Om_prosjektet.Kort_beskrivels,
              Full_x0020_beskrivelse_x0020_av_: jsonData.Beskrivelse_av_.Om_prosjektet.Full_beskrivels,
              Formidling: jsonData.Beskrivelse_av_.Om_prosjektet.Beskriv_hvordan1,
              M_x00e5_lgruppe: jsonData.Beskrivelse_av_.Om_prosjektet.Beskriv_m\u00E5lgrup,
              Bidrag_x0020_til_x0020_bevaring_: jsonData.Beskrivelse_av_.M\u00E5l_og_effekter.Beskriv_hvordan,
              S_x00f8_knadsbel_x00f8_p: jsonData.Budsjett__finan.S\u00F8knadsbel\u00F8p2.S\u00F8knadsbel\u00F8p3,
              Sum_x0020_inntekter: jsonData.Budsjett__finan.Sum_inntekter,
              Sum_x0020_utgifter: jsonData.Budsjett__finan.Sum_utgifter,
              Dokumentnummerp360: flowStatus.archive.result.DocumentNumber
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
          type: 'Søknad om utviklingsmidler til formidling av kulturarv', // Required. A short searchable type-name that distinguishes the statistic element
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
