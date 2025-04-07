/**
 * @typedef {Object} ParseJsonResult
 * @property {Object} Metadata
 * @property {Object} Metadata.UserIdentifier
 * @property {string} Metadata.UserIdentifier.Value
 * @property {Object} Metadata.DialogueId
 * @property {string} Metadata.DialogueId.Value
 * @property {Object} Metadata.DialogueName
 * @property {string} Metadata.DialogueName.Value
 * @property {Object} Metadata.ReferenceId
 * @property {string} Metadata.ReferenceId.Value
 * @property {string} Metadata.Created
 * @property {string} Metadata.Updated
 * @property {string} Metadata.Submitted
 * @property {string} Metadata.TimezoneId
 * 
 * @property {Object} DialogueInstance
 * 
 * @property {Object} SavedValues
 * @property {Object} SavedValues.Logic
 * @property {Object} SavedValues.Integration
 * 
 * @property {Object} Login Login data fra acos bruker
 * @property {string} Login.UserId
 * @property {string} Login.FirstName
 * @property {string} Login.LastName
 * @property {string} Login.MiddleName
 * @property {string} Login.Address
 * @property {string} Login.PostalCode
 * @property {string} Login.PostalArea
 * @property {string} Login.Telephone
 * @property {string} Login.Email
 * @property {string} Login.LoginProvider
 * @property {Object} [Login.AzureAD]
 * @property {string} Login.AzureAD.Department
 * @property {string} Login.AzureAD.EmployeeID
 * @property {string} Login.AzureAD.Address
 * @property {string} Login.AzureAD.BusinessPhones
 * @property {string} Login.AzureAD.Telephone
 * @property {string} Login.AzureAD.Email
 * @property {string} Login.AzureAD.StreetNumber
 * @property {string} Login.AzureAD.StreetName
 * @property {string} Login.AzureAD.PostalArea
 * @property {string} Login.AzureAD.PostalCode
 * @property {string} Login.AzureAD.HouseLetter
 * @property {string} Login.AzureAD.JobTitle
 * @property {string} Login.AzureAD.OnPremisesSamAccountName
 * @property {Object} Login.AzureAD.Manager
 * @property {string} Login.AzureAD.Manager.UPN
 * @property {string} Login.AzureAD.Manager.FirstName
 * @property {string} Login.AzureAD.Manager.MiddleName
 * @property {string} Login.AzureAD.Manager.LastName
 * @property {string} Login.AzureAD.Manager.BusinessPhones
 * @property {string} Login.AzureAD.Manager.MobilePhone
 * @property {string} Login.AzureAD.Manager.Email
 * 
 * @property {Object} [Login.IDPorten] TODO
 * 
 * @property {Object} [mapped]
 * 
 * @property {Object} jsonFile
 * @property {string} jsonFile.name
 * @property {string} jsonFile.path
 * @property {string} jsonFile.type
 * @property {string} jsonFile.createdOn
 * @property {string} jsonFile.lastModified
 * 
 * @property {Object[]} files
 * @property {string} files[].name
 * @property {string} files[].path
 * @property {string} files[].type
 * @property {string} files[].desc
 * 
 */

/**
 * @typedef {Object} FlowJobResult
 * @property {boolean} jobFinished - Whether the job is finished or not
 */

/**
 * @typedef {Object} FlowStatus
 * @property {string} createdTimeStamp - The time the flow was created
 * @property {boolean} finished - Whether the flow is finished or not
 * @property {boolean} failed - Whether the flow has failed or not
 * @property {string} refId - The reference ID of the form
 * @property {string} acosId - The ACOS ID of the form
 * @property {string} acosName - The name of the form
 * @property {string} blobDir - The path to the blobs for this form
 * @property {number} runs - The number of runs for this form
 * @property {string} nextRun - The next run time for this form
 * @property {string} [waitingForJob] - If the flow is waiting for a specific job before it can continue
 * @property {FlowJobResult} [parseJson] - The result of the parseJson job
 * @property {ParseJsonResult} parseJson.result - The result of the parseJson job

 */

module.exports = {}

/*
{
  "createdTimeStamp": "2025-04-03T13:08:28.987Z",
  "finished": true,
  "failed": false,
  "refId": "8KS-5Q5",
  "acosId": "VFK-2",
  "acosName": "Testskjema Nils",
  "blobDir": "VFK-2/8KS-5Q5",
  "runs": 0,
  "nextRun": "2025-04-03T13:08:28.987Z",
  "waitingForJob": '',
  "[...jobs]"
}

{
  "createdTimeStamp": "2025-04-03T13:08:28.987Z",
  "finished": true,
  "failed": false,
  "refId": "8KS-5Q5",
  "acosId": "VFK-2",
  "acosName": "Testskjema Nils",
  "blobDir": "VFK-2/8KS-5Q5",
  "runs": 0,
  "nextRun": "2025-04-03T13:08:28.987Z",
  "parseJson": {
    "jobFinished": true,
    "result": {
      "Metadata": {
        "UserIdentifier": {
          "Value": "8cbf33e0-cae9-4b44-9398-d2856805dc4c"
        },
        "DialogueId": {
          "Value": "VFK-2"
        },
        "DialogueName": {
          "Value": "Testskjema Nils"
        },
        "ReferenceId": {
          "Value": "8KS-5Q5"
        },
        "Created": "2025-02-25T07:44:33.1096136+00:00",
        "Updated": "0001-01-01T00:00:00",
        "Submitted": "2025-02-25T07:45:58.5609831Z",
        "TimezoneId": "Europe/Oslo"
      },
      "DialogueInstance": {
        "Informasjon_om_": {
          "Privatperson": {
            "Fødselsnummer1": "",
            "Fornavn1": "Nils Krane",
            "Etternavn1": "Thvedt",
            "Adresse1": "Åsrumveien 433",
            "Postnummer1": "3220",
            "Poststed1": "Sandefjord",
            "Telefon1": "90558291",
            "E_post": "nils.thvedt@vestfoldfylke.no"
          },
          "Tast_inn_UPN": "",
          "Officelocation": null,
          "Fornavn2": "Nils Krane",
          "Etternavn2": "Thvedt",
          "Er_dette_en_rad": "Ja",
          "E_post2": "nils.thvedt@vestfoldfylke.no",
          "Fornavn3": "Ole Kristian",
          "Brukernavn1": "nils.thvedt@vestfoldfylke.no",
          "Avdeling1": "Tjenesteutvikling",
          "Telefon2": "+4790558291",
          "E_post1": "nils.thvedt@vestfoldfylke.no",
          "Organisasjon": {
            "Organisasjonsna": "TULL & TOOLS INVEST AS",
            "Organisasjonsnu": "999639186",
            "Gatenavn_og__nu": "",
            "Postnummer2": null,
            "Poststed2": null,
            "Gatenavn_og__nu1": "Eldorlia 19",
            "Postnummer3": "1435",
            "Poststed3": "ÅS"
          },
          "Velg_flere": "Første valg, Atter et valg",
          "Legg_til_liste": [
            {
              "fornavn": "Jens",
              "Etternavn3": "Jensen"
            },
            {
              "fornavn": "Jørgen",
              "Etternavn3": "Jørgensen"
            },
            {
              "fornavn": "Nils ",
              "Etternavn3": "Nilsen"
            }
          ]
        }
      },
      "SavedValues": {
        "Logic": {},
        "Integration": {
          "Test_med_bruk_av_Graph_WS": {
            "OfficeLocation": null
          }
        },
        "Login": {
          "UserID": "nils.thvedt@vestfoldfylke.no",
          "FirstName": "Nils Krane",
          "MiddleName": null,
          "LastName": "Thvedt",
          "Address": " ",
          "PostalCode": ".",
          "PostalArea": "VFK",
          "Telephone": "+4790558291",
          "Email": "nils.thvedt@vestfoldfylke.no",
          "LoginProvider": "AzureAD",
          "AzureAD": {
            "Department": "Tjenesteutvikling",
            "EmployeeID": null,
            "Address": " ",
            "BusinessPhones": "",
            "Telephone": "+4790558291",
            "Email": "nils.thvedt@vestfoldfylke.no",
            "StreetNumber": null,
            "StreetName": null,
            "PostalArea": "VFK",
            "PostalCode": ".",
            "HouseLetter": "",
            "JobTitle": "Rådgiver",
            "OnPremisesSamAccountName": "nil1607",
            "Manager": {
              "UPN": "ole.kristian.nes@vestfoldfylke.no",
              "FirstName": "Ole Kristian",
              "MiddleName": "",
              "LastName": "Næs",
              "BusinessPhones": "+4790931460",
              "MobilePhone": "+4790931460",
              "Email": "ole.kristian.nes@vestfoldfylke.no"
            }
          }
        }
      },
      "mapped": {
        "async": "streng"
      },
      "jsonFile": {
        "name": "8KS-5Q5_data.json",
        "path": "VFK-2/8KS-5Q5/8KS-5Q5_data.json",
        "blobType": "BlockBlob",
        "createdOn": "2025-02-25T07:46:07.000Z",
        "lastModified": "2025-02-25T07:46:07.000Z"
      },
      "files": [
        {
          "name": "Skjema.pdf",
          "path": "VFK-2/8KS-5Q5/Testskjema Nils_8KS-5Q5.pdf",
          "type": "H",
          "desc": "Skjema.pdf"
        }
      ]
    }
  },
  "customJobDritOgMokk": {
    "jobFinished": true,
    "result": "Drit og Møkk"
  },
  "customJobDritOgMokk2": {
    "jobFinished": true,
    "result": "Drit og Møkk 2"
  },
  "finishFlow": {
    "jobFinished": false
  }
}

*/