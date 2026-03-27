const description = "Avtale om videreutdanning"
// const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },

  parseJson: {
    enabled: true,
    options: {
      mapper: (_dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {}
      }
    }
  },

  syncEmployee: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // for å opprette person med fiktivt fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
        return {
          ssn: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
          forceUpdate: false // optional - forces update of privatePerson instead of quick return if it exists
        }
      }
    }
  },

  handleCase: {
    enabled: true,
    options: {
      // no mapper here means that we will not create a case if we do not find an existing one and throw error if case is missing

      getCaseParameter: (flowStatus) => {
        return {
          UnofficialTitle: `Videreutdanning - ${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}` // check for exisiting case with this title
        }
      }
    }
  },

  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const p360Attachments = attachments.map((att) => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: "F",
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: "DocumentService",
          method: "CreateDocument",
          parameter: {
            AccessCode: "26",
            // AccessGroup: '', Automatisk tilgangsgruppe
            Category: "Dokument inn",
            Contacts: [
              {
                ReferenceNumber: flowStatus.parseJson.result.SavedValues.Integration.Hent_manuell_entra_bruker.extension_0fe49c4c681d427aa4cad2252aba12f5_employeeNumber,
                Role: "Avsender",
                IsUnofficial: true
              }
              /*,
              {
                ReferenceNumber: `recno: ${flowStatus.syncEmployee.result.archiveManager.recno}`,
                Role: 'Mottaker'
              }
              */
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: "1",
                Format: "pdf",
                Status: "F",
                Title: "Avtale om videreutdanning",
                VersionFormat: "A"
              },
              ...p360Attachments
            ],
            Paragraph: "Offl. § 26 femte ledd",
            ResponsibleEnterpriseRecno: flowStatus.syncEmployee.result.responsibleEnterprise.recno,
            ResponsiblePersonEmail: flowStatus.syncEmployee.result.archiveManager.email,
            Status: "J",
            Title: "Avtale om videreutdanning",
            Archive: "Personaldokument",
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  sharepointGetListItem: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          testListUrl: "https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Videreutdanning/AllItems.aspx",
          prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Videreutdanning/AllItems.aspx",
          searchFilter: `fields/Acos_x002d_refId eq '${flowStatus.parseJson.result.DialogueInstance.Informasjon_om_.Avtale_Id}'`
        }
      }
    }
  },
  // eksempel der man sjekker at man fikk unik match på sharepointGetListItem og oppdaterer den ene raden i lista

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        if (flowStatus.sharepointGetListItem.result.length !== 1)
          throw new Error("Fant ikke unik match i lista når vi kjørte sharepointGetListItem, sjekk searchFilter i jobben eller plukk ut korrekt id i flowStatus-fila")
        const id = flowStatus.sharepointGetListItem.result[0].id
        const date = flowStatus.parseJson.result.Metadata.Submitted.split("-")
        const newDate = `${date[2].slice(0, 2)}.${date[1]}.${date[0]}`
        // merk at du kan også hente ut resten av listeelementets data. For eks. kolonnenavn og verdi i flowstatus.sharepointGetListItem.result[0].fields
        return [
          {
            testListUrl: "https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Videreutdanning/AllItems.aspx",
            prodListUrl: "https://vestfoldfylke.sharepoint.com/sites/Kompetanseforkvalitet/Lists/Videreutdanning/AllItems.aspx",
            testItemId: id,
            prodItemId: id,
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Motattavtale: newDate
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
          company: "Opplæring og tannhelse",
          department: "Kompetanse og pedagogisk utvikling",
          description,
          type: "Avtale om videreutdanning", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || "tilArkiv er false" // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
