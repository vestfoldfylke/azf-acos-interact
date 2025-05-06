const description = 'Svar på høring - Ordensregler for voksne'
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

  /* XML from Acos:
ArchiveData {
  string navn
  string fnr
  string orgnr
  string typeInnsender
  string innspill
}

  */
  syncPrivatePerson: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Login.UserID
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Hvem_represente === 'Organisasjon/virksomhet'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', '')
        }
      }
    }
  },

  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const jsonData = flowStatus.parseJson.result
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
                ReferenceNumber: jsonData.DialogueInstance.Informasjon_om_.Hvem_represente === 'Privatperson' ? jsonData.SavedValues.Login.UserID : jsonData.DialogueInstance.Informasjon_om_.Organisasjon.Organisasjonsnu.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
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
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200091' : '200148', // Seksjon Voksenopplæring og karriereutvikling - Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            ResponsiblePersonEmail: nodeEnv === 'production' ? 'charlotte.viksand.glad@vestfoldfylke.no' : '',
            Status: 'J',
            AccessCode: 'U',
            Title: 'Høringsinnspill - Ordensregler for videregående opplæring for voksne i Vestfold fylkeskommune',
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/09173' : '25/00024'
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
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Svar%20p%20hring%20%20Ordensregler%20for%20voksne/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring/Lists/Svar%20p%20hring%20%20Ordensregler%20for%20voksne/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: `${jsonData.Informasjon_om_.Innsender.Fornavn1} ${jsonData.Informasjon_om_.Innsender.Etternavn1}`, // husk å bruke internal name på kolonnen
              Telefon: jsonData.Informasjon_om_.Innsender.Telefon1 || 'Privatperson',
              E_x002d_post: jsonData.Informasjon_om_.Innsender.E_post,
              Organisasjonsnavn: jsonData.Informasjon_om_.Organisasjon.Organisasjonsna || 'Privatperson',
              Organisasjonsnummer: jsonData.Informasjon_om_.Organisasjon.Organisasjonsnu,
              Hvorogn_x00e5_r: jsonData.Høring_og_hørin.Har_du_innspill,
              Rettigheter: jsonData.Høring_og_hørin.Har_du_innspill6,
              Plikter: jsonData.Høring_og_hørin.Har_du_innspill7,
              N_x00e6_rv_x00e6_rogfrav_x00e6_r: jsonData.Høring_og_hørin.Har_du_innspill8,
              Orden: jsonData.Høring_og_hørin.Har_du_innspill9,
              Oppf_x00f8_rsel: jsonData.Høring_og_hørin.Har_du_innspill20,
              Tiltakogreaksjoner: jsonData.Høring_og_hørin.Har_du_innspill17,
              Rettigheterogplikter: jsonData.Høring_og_hørin.Har_du_innspill16,
              Ersatning: jsonData.Høring_og_hørin.Har_du_innspill18,
              Lokaleregler: jsonData.Høring_og_hørin.Har_du_innspill19,
              Andrekommentarer: jsonData.Høring_og_hørin.Har_du_andre_in,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber
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
          company: 'Opplæring og tannhelse',
          department: 'Seksjon Voksenopplæring og karriereutvikling',
          description,
          type: 'Svar på høring - Ordensregler for voksne', // Required. A short searchable type-name that distinguishes the statistic element
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
