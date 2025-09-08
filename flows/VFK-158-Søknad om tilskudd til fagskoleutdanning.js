const description = 'Søknad om tilskudd til fagskoleutdanning'
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

  syncEnterprise: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon3.Organisasjonsnu3.replaceAll(' ', '')
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
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
                ReferenceNumber: flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon3.Organisasjonsnu3.replaceAll(' ', ''),
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
                Title: 'Søknad om fagskolemidler',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200091' : '200148', // Seksjon voksenopplæring og karriereutvikling
            // ResponsiblePersonEmail: nodeEnv === 'production' ? '' : '',
            Status: 'J',
            Title: `Søknad om fagskolemidler - ${flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Organisasjon3.Organisasjonsna2}`,
            Archive: 'Saksdokument',
            CaseNumber: nodeEnv === 'production' ? '25/09509' : '24/00059'
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
        const sharepointElements = []
        const tilbudsliste = Array.isArray(jsonData.Informasjon_om_.Tilbud) ? jsonData.Informasjon_om_.Tilbud : [jsonData.Informasjon_om_.Tilbud] // Sjekker om det er mer enn ett tilbud i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const tilbud of tilbudsliste) {
          const sharepointElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-FagskoleforvaltningVFK/Lists/Tilskudd%20til%20fagskoleutdanning%202627/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-FagskoleforvaltningVFK/Lists/Tilskudd%20til%20fagskoleutdanning%202627/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: jsonData.Informasjon_om_.Organisasjon3.Organisasjonsna2 || 'Mangler orgnavn', // husk å bruke internal name på kolonnen
              Omr_x00e5_de: tilbud.Fagområde,
              Tilbudstype: tilbud.Tilbudstype,
              Tilbudsnavn: tilbud.Utdanningsnavn,
              Studiested: tilbud.Studiested,
              Studieform: tilbud.Studieform,
              Informasjonomtilbudutenferdigbeh: tilbud.Informasjon_om_,
              Forventetantallstudieplasser: tilbud.Antall_studiepl,
              Studiepoengtotalt: tilbud.Antall_studiepo2,
              Studiepoengpr_x002e__x00e5_r: tilbud.Antall_studiepo1,
              Varighet: tilbud.Varighet,
              Startm_x00e5_ned: tilbud.Start_måned1,
              Start_x00e5_r: tilbud.Start_år1,
              Sluttm_x00e5_ned: tilbud.Slutt_måned1,
              Slutt_x00e5_r: tilbud.Slutt_år1,
              Skolenummer: jsonData.Informasjon_om_.Skolenummer,
              Studiestednummer: tilbud.Studiestedsnumm,
              Tilbudskode: tilbud.DBH_F_kode,
              NUS_x002d_kode: tilbud.NUS_kode1,
              Dokumentnummeri360: flowStatus.archive.result.DocumentNumber
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OPT-Fagskoleforvaltning',
          department: 'Seksjon voksenopplæring og karriereutvikling',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om tilskudd til fagskoleutdanning', // Required. A short searchable type-name that distinguishes the statistic element
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
