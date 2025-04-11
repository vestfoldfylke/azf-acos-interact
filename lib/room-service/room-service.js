const { list } = require('@vtfk/azure-blob-client')
const { storageAccount, willNotRunAgainFilename, roomServiceTeamsWebhook, retryIntervalMinutes } = require('../../config')
const { mapFlowFile } = require('../dispatcher')
const { readdirSync } = require('fs')
const axios = require('axios').default
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}
module.exports = async () => {
  const blobsWithProblems = []
  const blobs = await list('*', blobOptions)
  const sortedBlobs = {}
  for (const blob of blobs) {
    let acosId = 'UKJENT'
    let refId = 'UKJENT'
    const blobPathList = blob.path.split('/')
    if (blobPathList.length < 3) {
      blobsWithProblems.push(blob)
      if (blobPathList.length === 2) acosId = blobPathList[0]
    } else {
      acosId = blobPathList[0]
      refId = blobPathList[1]
    }

    if (!sortedBlobs[acosId]) sortedBlobs[acosId] = {}
    if (!sortedBlobs[acosId][refId]) sortedBlobs[acosId][refId] = []
    sortedBlobs[acosId][refId].push(blob)
  }
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  // sjekker at det ikke finnes blober med AcosId som ikke har en flow
  const missingFlowFile = {}
  let missingFlowFilesCount = 0
  const willNotRunAgainBlobs = []
  const formsInAvlevering = []
  for (const acosId of Object.keys(sortedBlobs)) {
    const existingFlowFile = schemaNames.find(flow => flow.acosId === acosId)
    if (!existingFlowFile) {
      missingFlowFilesCount++
    } else {
      const flowFile = require(`../../flows/${existingFlowFile.filename}`)
      if (!flowFile.config || !flowFile.config.enabled) {
        missingFlowFilesCount++
      }
    }
    for (const [refId, blobs] of Object.entries(sortedBlobs[acosId])) {
      formsInAvlevering.push(`${blobOptions.containerName}/${acosId}/${refId}`)
      if (blobs.some(blob => blob.name === `${refId}-${willNotRunAgainFilename}.json`)) willNotRunAgainBlobs.push(`${blobOptions.containerName}/${acosId}/${refId}`)
      if (!existingFlowFile) {
        missingFlowFile[acosId] = missingFlowFile[acosId] + 1 || 1
      } else {
        const flowFile = require(`../../flows/${existingFlowFile.filename}`)
        if (!flowFile.config || !flowFile.config.enabled) {
          missingFlowFile[acosId] = missingFlowFile[acosId] + 1 || 1
        }
      }
    }
  }
  const utenlandsreisendeForms = sortedBlobs['VFK-142'] || {}
  const utenlandsreisendeFormsCount = Object.keys(utenlandsreisendeForms).length
  const missingFlowFileStrings = Object.entries(missingFlowFile).map(val => `${val[0]} (${val[1]})`)
  const missingFlowFileFacts = missingFlowFileStrings.length === 0
    ? []
    : [
        {
          title: 'AcosId',
          value: `- ${missingFlowFileStrings.join(' \r- ')}`
        }
      ]
  const blobsWithProblemsFacts = blobsWithProblems.length === 0
    ? []
    : [
        {
          title: 'Blob',
          value: `- ${blobsWithProblems.map(blob => `${blobOptions.containerName}/${blob.path}`).join(' \r- ')}`
        }
      ]
  const willNotRunAgainFacts = willNotRunAgainBlobs.length === 0
    ? []
    : [
        {
          title: 'Acos refId',
          value: `- ${willNotRunAgainBlobs.join(' \r- ')}`
        }
      ]
  const formsInAvleveringWithoutUtenlandsreisende = formsInAvlevering.filter(form => !form.includes('VFK-142'))
  const waitingRefIdsFacts = formsInAvleveringWithoutUtenlandsreisende.length === 0
    ? []
    : [
        {
          title: 'Acos refId',
          value: `- ${formsInAvleveringWithoutUtenlandsreisende.join(' \r- ')}`
        }
      ]
  let colour
  const problems = missingFlowFilesCount + blobsWithProblems.length + willNotRunAgainBlobs.length
  if (problems === 0) {
    colour = 'good'
  } else if (problems > 60) {
    colour = 'attention'
  } else if (problems > 30) {
    colour = 'attention'
  } else if (problems > 10) {
    colour = 'warning'
  } else {
    colour = 'warning'
  }

  const teamsMsg = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.5',
          msteams: { width: 'full' },
          body: [
            {
              type: 'TextBlock',
              text: 'Statusrapport - azf-acos-interact',
              wrap: true,
              style: 'heading',
              color: colour
            },
            {
              type: 'TextBlock',
              text: `**${missingFlowFilesCount}** innsendte skjema mangler _flow-fil_ eller _flow-fil_ er disabled`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Dette er skjemaer der det ikke er en flowfil som tar hånd om disse, eller flow-fila er disabled. Det må defineres en flowfil eller flowfilen må enables dersom disse skal håndteres. Se [dokumentasjon](https://github.com/vtfk/azf-acos-interact#readme) for mer informasjon.',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: missingFlowFileFacts
            },
            {
              type: 'TextBlock',
              text: `**${blobsWithProblems.length}** blob(er) har problemer`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Dette er blober i blobstorage som ikke har en gyldig plassering (blobene mangler kanskje refId eller AcosId?). Sjekk avlevering og evt. blobstorage.',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: blobsWithProblemsFacts
            },
            {
              type: 'TextBlock',
              text: `**${willNotRunAgainBlobs.length}** blob(er) har har blitt forsøkt maksimalt antall ganger (${retryIntervalMinutes.length}) og vil ikke bli kjørt igjen`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: `Dette er blober som har kjørt (og feilet) sitt maksimale antall ganger (${retryIntervalMinutes.length}). Se etter feil i flow-status.json fila, rett feilene, slett will-not-run-again.json-fila og rediger (eller slett om alt skal kjøres på nytt) flow-status.json og vent på neste kjøring`,
              wrap: true
            },
            {
              type: 'FactSet',
              facts: willNotRunAgainFacts
            },
            {
              type: 'TextBlock',
              text: `I dette øyeblikk ligger det **${formsInAvlevering.length - utenlandsreisendeFormsCount}** innsendte skjema i ${blobOptions.containerName}.`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Dette er skjemaer som enten venter i kø eller er satt til å ikke bli slettet (doNotRemoveBlobs = true i flowDef-fila)',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: waitingRefIdsFacts
            },
            {
              type: 'TextBlock',
              text: `I dette øyeblikk venter vi på **${utenlandsreisendeFormsCount}** som enten skal dra til eller komme hjem fra utenlandsreise.`,
              wrap: true,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'Disse vil bli slettet når folk kommer hjem fra reise. De er skrellet for sensitive data, så det er ingen vits i å prøve å hacke',
              wrap: true
            },
            {
              type: 'Image',
              url: 'https://media.giphy.com/media/NV4cSrRYXXwfUcYnua/giphy.gif',
              horizontalAlignment: 'Center'
            }
          ]
        }
      }
    ]
  }

  const headers = { contentType: 'application/vnd.microsoft.teams.card.o365connector' }
  await axios.post(roomServiceTeamsWebhook, teamsMsg, { headers })
}
