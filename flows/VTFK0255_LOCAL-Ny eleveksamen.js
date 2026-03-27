const description = "Påmelding til ny privatisteksamen etter UDIRs eksamensfadese 2023, oppretter rad i SharePoint liste for seksjonen"
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {}
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error("Postnr har ikke kommet med fra XML")
        return [
          {
            testSiteId: "c68676a9-b44a-4c27-ad28-5fd5c7dc18ac",
            testPath: "sites/OF-Seksjonforinntakeksamenogvoksenopplring/Lists/Nyprivatisteksamen%20%20TEST/AllItems.aspx",
            testListId: "7caa8101-f96d-4bbd-9eca-8526a22fdd2a",
            prodSiteId: "c68676a9-b44a-4c27-ad28-5fd5c7dc18ac",
            prodPath: "sites/OF-Seksjonforinntakeksamenogvoksenopplring/Lists/Nyprivatisteksamen/AllItems.aspx",
            prodListId: "e1e94c1d-cbef-49af-99d9-65206cf58eaf",
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Fnr || "Mangler fnr", // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Poststed: xmlData.Poststed,
              Mobil: xmlData.Mobilnr,
              E_x002d_post: xmlData.Epost,
              Fag: xmlData.Fag
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
          company: "OF",
          department: "EKSAMEN",
          description,
          type: "Ny privatisteksamen-UDIR fadese", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Fag
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
