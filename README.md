# azf-acos-interact
Azure functions for handling Acos files

## Definisjoner
### flow
Dette er beskrivelse av hvordan et avlevert skjema skal håndteres. Flow'en beskriver hvilke jobber som skal kjøres. I tillegg inneholder den konfigurasjoner for skjema.
Alle flower skal inneholde et config-objekt der man kan skru av og på flowen. Eks: 
```js
{
  config: {
    enabled: true
  }
}
```
Enabled vil styre om flyten skal kjøres eller ikke.
### job
En job er en definisjon og konfigurasjon av en oppgave som skal utføres på det avleverte skjemaet. En flow kan inneholde mange jobber. [Se hvilke jobber man kan bruke her](#jobber-som-kan-brukes). En typisk jobb er satt opp på dette formatet: 
```js
{
  jobName: {
    enabled: true,
    options: {
      opt1: 'data',
      opt2: (flowStatus) => { console.log('ett eller annet') }
    }
  }
}
```
### flowStatus.json
Dette er en json-fil som opprettes automatisk og inneholder status over hva som er kjørt og hva som gjenstår, og metadata om skjema og jobbene. 
En typisk flowStatus.json:
```json
{
  "createdTimeStamp": "2023-06-20T10:45:36.958Z",
  "finished": false,
  "failed": true,
  "refId": "1285709",
  "acosId": "skjemaId",
  "acosName": "",
  "blobDir": "skjemaid/refid",
  "runs": 2,
  "nextRun": "2023-06-20T10:47:54.105Z",
  "job1": {
    "jobFinished": true,
    "result": {
      "somedata": {
        "nesteddatafromthejob": 254
      }
    }
  },
  "job2": {
    "jobFinished": false,
    "error": "something went wrong"
  }
}
```
Man kan manipulere nextRun (sett tidligere dato) og runs (sett lavere siffer).

## Sette opp ny skjemaavlevering:
1. Opprett en ny js-flowfil i ./flows på formen `{AcosId}-{Navn på skjema}.js` Det enkleste er å kopiere fra et lignende skjema som er i drift og gi dette et nytt navn.
2. Sette opp jobbene som skal kjøres i filen som ble laget i pkt. 1. Eksempel på ulike jobber finner du i mappen ./example-flows
3. Test lokalt. Rett feil og sett i prod (commit -> push -> jrelease *patch || minor || major*)


## Jobber som kan brukes
Jobbene er listet opp i rekkefølgen de vil bli kjørt
### parseXml
Denne jobben gjør om XML fra Acos-avleveringen til JSON. Jobben leser også XML-metadata-fila fra Acos og henter ut vedleggsmetadata. Denne jobben må være med.

### syncElevmappe
Denne jobben får inn fødselsnummer eller annen persondata (kan også generere opp fiktive fødselsnummer), oppretter eller oppdaterer elevmappe for elev. Returnerer persondata og saksnummer. [Se eksempler her](./example-flows/EX001-elevmappe.js)

### syncPrivatePerson
Denne jobben får inn fødselsnummer eller annen persondata (kan også generere opp fiktive fødselsnummer), oppretter eller oppdaterer privatperson i arkiv. Returnerer persondata og recno. Denne jobben kan du også kjøre så mange ganger du vil i løpet av en flow. Bare bruk "syncPrivatePerson" som prefix i jobbnavnet. [Se eksempler her](./example-flows/EX003-sync-private-person.js)

### syncEmployee
Denne jobben får inn fødselsnummer og UPN, oppretter eller oppdaterer personalprosjekt i arkiv. Returnerer persondata, tilgangsgrupper og prosjektnummer. [Se eksempler her](./example-flows/EX004-sync-employee.js)

### syncEnterprise
Denne jobben får inn orgnr, oppretter eller oppdaterer virksomhet i arkiv. Returnerer virksomhetsdata og recno. [Se eksempler her](./example-flows/EX014-sync-enterprise.js)

### handleProject
Denne jobben får inn metadata for et prosjekt, og eventuelt en getProject-parameter for å se om et prosjekt finnes allerede før den oppretter. Returnerer prosjektnummer og recno. 
[Se eksempler her](./example-flows/EX013-handle-project.js)

### handleCase
Denne jobben får inn metadata for en sak, og eventuelt en getCase-parameter for å se om en sak finnes allerede før den oppretter. Returnerer saksnummer. 
[Se eksempler her](./example-flows/EX005-handle-case.js)

### archive
Denne jobben får inn metadata for dokument eller en template-henvisning til azf-archive, Returnerer dokumentnummer. 
[Se eksempler her](./example-flows/EX010-archive-handle-case.js)

### signOff
Denne jobben krever at archive er kjørt først. Den henter dokumentnummer fra denne jobben og avskriver dokumentet med koden TO (Tatt til orientering). [Se eksempler her](./example-flows/EX006-sign-off-and-close-case.js)
### closeCase
Denne jobben krever at handleCase er kjørt først. Den henter saksnummer fra denne jobben og lukker saken. [Se eksempler her](./example-flows/EX006-sign-off-and-close-case.js)

### sharepointList
Denne jobben oppretter listeelementer i gitte lister i SharePoint. [Se eksempler her](./example-flows/EX008-sharepoint-list.js)

### statistics
Denne jobben genererer statistikkelementer i statistikkdatabasen. [Se eksempler her](./example-flows/EX011-statistics.js)

### groundControl
Denne jobben kopierer blob-filene (pdf, vedlegg, xml, og flowstatus) over til GROUND_CONTROL_STORAGE_ACCOUNT_CONNECTION_STRING GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, der filene igjen blir plukket ned til server on-prem. Dersom du trenger lokal avlevering (til lokal server on-prem), setter du groundControl til enabled. Jobben som henter ned filer til lokalt finner du i [./ground-control](./ground-control/index.js), og du kan lese mer om den i egen [readme](./ground-control/readme.md)

### failOnPurpose
Denne jobben fører til at flyten stopper. Settes til enabled om du ønsker at flyten stopper før finishFlow kjøres (til testing).

### finishFlow
finishFlow vil alltid være enabled. Denne sletter blobene hvis man ikke setter `doNotRemoveBlobs: true` i flowConfig'en. Eks: 
```js
{
  config: {
    doNotRemoveBlobs: true
  }
}
```
## flow-helpers.js
En fil som eksporterer enkle funksjoner som du kanskje har bruk for i andre flow filer. 

### getSchoolYear
Denne funksjonen returnerer skoleår på dette formatet: 2023/2024. 
Du kan sende med et dato objekt om du ønsker å få skole året for en spesifikk dato. 

## Retry håndtering
Styres av miljøvariabelen retryIntervalMinutes. Legges inn på formatet '{antall minutter for første retry}, {osv}'

Eks: '5,60,240' (første retry etter 5 minutter, deretter 60 minutter, og til slutt 240 minutter. Totalt blir det fire kjøringer (inkludert den første)). Flere kan legges til hvis ønskelig.

## roomService
roomService er en egen timertrigger som kjører tre ganger om dagen. Den sjekker:
- innsendte skjema som mangler flow-fil (Denne vil komme dersom det er satt opp en avlevering fra Acos uten at det er laget noen flow-fil. Løses ved å opprette en flow-fil)
- blober med problemer (Dette er blober i blobstorage som ikke har en gyldig plassering (blobene mangler kanskje refId eller AcosId?). Sjekk avlevering og evt. blobstorage)
- blober som har blitt forsøkt maks antall ganger (retryIntervalMinutes.length() er forsøkt.)
- skjema som ligger i containeren i dette øyeblikk. (Dette er skjemaer som enten venter i kø eller er satt til å ikke bli slettet (doNotRemoveBlobs = true i flowDef-fila))

## Deploy to Azure
- Create Azure Function on an App Service Plan
- Enable authentication on Azure Function and create or connect to an App Registration
  - The App registration created will be used for requests towards other Azure AD protected resources
  - Give the App registration application API permissions for
    - Microsoft Graph
      - Sites.ReadWrite.All
      - User.Read
    - SharePoint
      - Sites.ReadWrite.All
    - Archive API
     - Archive
  - Remember to grant admin consent for the permissions
- Make sure you have a valid certificate that can be used for SharePoint requests. Can be [created as a self-signed certificate in an Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/certificates/quick-create-portal#add-a-certificate-to-key-vault)
  - Upload certificate as pfx to an Azure Key Vault (if you did not create it there)
  - Upload the public key for the certificate to the App registration (to be used for SharePoint requests) Download in CER format in Key Vault
  - Create a client secret on the App registration (to be used for Graph requests)
  - Enable Managed Identity (System assigned) on the Azure Function and give it access to secrets from Key Vault (Access policies). Get and List on Secret permissions
- Set up the Azure Function configuration corresponding to you local.settings.json
  - First set up the certificate in the configuration
    - Get the reference to the certificate from Key Vault (copy the Secret identifier from the certificate) [use Key Vault references](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references?tabs=azure-cli)
    - create an application setting called SP_PFX_BASE64 and paste in the value (@Microsoft.KeyVault(SecretUri={Secret Identifier you have copied}))
        - if you always want the Azure function to fetch the latest version of the certificate / secret, remove the id from the Secret Identifier uri. Example: https://myvault.vault.azure.net/secrets/mysecret/
    - save the configuration and check that the connection to Key Vault is valid (save, refresh page and see connection status inside the key)
  - then the rest:
```json

{
  "IsEncrypted": false,
  "Values": {
    "STORAGE_ACCOUNT_CONNECTION_STRING": "connection string to storage account",
    "STORAGE_ACCOUNT_CONTAINER_NAME": "name of blob storage container",
    "RETRY_INTERVALS_MINUTES": "1,5,30,240", // number of retry intervals in minutes
    "ARCHIVE_SCOPE": "archive scope",
    "ARCHIVE_URL": "archive api url",
    "STATISTICS_API_KEY": "api key",
    "STATISTICS_URL": "url to statistics api",
    "APP_REG_CLIENT_ID": "app registration client id",
    "APP_REG_CLIENT_SECRET": "app registration client secret",
    "APP_REG_TENANT_ID": "your tenant id",
    "GRAPH_SCOPE": "graph scope",
    "GRAPH_URL": "url to graph",
    "SP_TENANT_NAME": "name of sharePoint tenant",
    "SP_PFX_BASE64": "reference to the certificate in key vault",
    "SP_PFX_THUMBPRINT": "certificate thumbprint",
    "NODE_ENV": "dev or production", 
    "ROBOT_EMAIL": "robot@domene.no",
    "TEAMS_WEBHOOK_URL": "teams webhook url",
    "ROOMSERVICE_TEAMS_WEBHOOK_URL": "webhook url for roomservice reports",
    "PAPERTRAIL_HOST": "papertrail.example.com/v1/log", // optional. NODE_ENV must be production for logging to PaperTrail
    "PAPERTRAIL_TOKEN": "jvkuvuyoufyofo8ygo8f609fo7ouyvcio7=" // optional
  }
}
```
- deploy the code with your preferred method
