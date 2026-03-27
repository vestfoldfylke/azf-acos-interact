module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  handleProject: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          service: "ProjectService",
          method: "CreateProject",
          parameter: {
            Title: `Prosjekttittel - ${flowStatus.parseXml.result.someData.name}`,
            ResponsiblePersonEmail: "ein saksbehandlar",
            Contacts: [
              {
                Role: "Kontakt",
                ReferenceNumber: flowStatus.parseXml.result.someData.fnr
              }
            ]
          }
        }
      },
      getProjectParameter: (flowStatus) => {
        return {
          Title: `Prosjektet til Robin -${flowStatus.parseXml.archiveData.lastName}` // check for exisiting project with this title
        }
      },
      getProjectParameter2: (flowStatus) => {
        return {
          ExternalId: flowStatus.parseXml.archiveData.guid // check for exisiting project with external ID
        }
      },
      getProjectParameter3: (_flowStatus) => {
        return {
          ProjectNumber: "23-123" // archive to this project only (project number defined here) (samleprosjekt)
        }
      },
      getProjectParameter4: (flowStatus) => {
        return {
          ProjectNumber: flowStatus.parseXml.someData.projectNumber // archive to this project only (project number from Acos XML) (samlesak)
        }
      }
    }
  }
}
