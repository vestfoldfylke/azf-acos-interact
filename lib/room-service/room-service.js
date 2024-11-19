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
  let refIdCount = 0
  const willNotRunAgainBlobs = []
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
      refIdCount++
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
  const missingFlowFileStrings = Object.entries(missingFlowFile).map(val => `${val[0]} (${val[1]})`)
  const missingFlowFileFacts = missingFlowFileStrings.length === 0
    ? []
    : [
        {
          name: 'AcosId',
          value: `- ${missingFlowFileStrings.join(' \r- ')}`
        }
      ]
  const blobsWithProblemsFacts = blobsWithProblems.length === 0
    ? []
    : [
        {
          name: 'Blob',
          value: `- ${blobsWithProblems.map(blob => `${blobOptions.containerName}/${blob.path}`).join(' \r- ')}`
        }
      ]
  const willNotRunAgainFacts = willNotRunAgainBlobs.length === 0
    ? []
    : [
        {
          name: 'Acos refId',
          value: `- ${willNotRunAgainBlobs.join(' \r- ')}`
        }
      ]
  let msg
  let colour
  const problems = missingFlowFilesCount + blobsWithProblems.length + willNotRunAgainBlobs.length
  if (problems === 0) {
    msg = 'Alt er tipp topp, tommel opp!'
    colour = '1ea80c'
  } else if (problems > 60) {
    msg = `${problems} feil. Dette er kritisk mange feil og noe må gjøres!`
    colour = 'a80c0c'
  } else if (problems > 30) {
    msg = `${problems} feil. Dette er en del feil altså og noe bør gjøres!`
    colour = 'ab57f35'
  } else if (problems > 10) {
    msg = `${problems} feil. Dette er noen feil og ta en sjekk om du har tid.`
    colour = 'e2ed13'
  } else {
    msg = `${problems} feil. Ta en sjekk om du gidder.`
    colour = 'e2ed13'
  }

  const teamsMsg = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: colour,
    summary: msg,
    title: '<h1 style="color:green;"> Statusrapport - azf-acos-interact </h1>',
    text: '![Alt text for the image](https://cdn.iconscout.com/icon/premium/png-256-thumb/room-service-4114792-3410705.png)',
    sections: [
      {
        activityTitle: `**${missingFlowFilesCount}** innsendte skjema mangler _flow-fil_ eller _flow-fil_ er disabled`,
        activitySubtitle: 'Dette er skjemaer der det ikke er en flowfil som tar hånd om disse, eller flow-fila er disabled. Det må defineres en flowfil eller flowfilen må enables dersom disse skal håndteres. Se [dokumentasjon](https://github.com/vtfk/azf-acos-interact#readme) for mer informasjon.',
        facts: missingFlowFileFacts,
        markdown: true
      },
      {
        activityTitle: `**${blobsWithProblems.length}** blob(er) har problemer`,
        activitySubtitle: 'Dette er blober i blobstorage som ikke har en gyldig plassering (blobene mangler kanskje refId eller AcosId?). Sjekk avlevering og evt. blobstorage.',
        facts: blobsWithProblemsFacts,
        markdown: true
      },
      {
        activityTitle: `**${willNotRunAgainBlobs.length}** blob(er) har har blitt forsøkt maksimalt antall ganger (${retryIntervalMinutes.length}) og vil ikke bli kjørt igjen`,
        activitySubtitle: `Dette er blober som har kjørt (og feilet) sitt maksimale antall ganger (${retryIntervalMinutes.length}). Se etter feil i flow-status.json fila, rett feilene, slett will-not-run-again.json-fila og rediger (eller slett om alt skal kjøres på nytt) flow-status.json og vent på neste kjøring`,
        facts: willNotRunAgainFacts,
        markdown: true
      },
      {
        activityTitle: `I dette øyeblikk ligger det **${refIdCount}** innsendte skjema i ${blobOptions.containerName}.`,
        activitySubtitle: 'Dette er skjemaer som enten venter i kø eller er satt til å ikke bli slettet (doNotRemoveBlobs = true i flowDef-fila)',
        facts: [],
        markdown: true
      },
      {
        text: '![Alt text for the image](https://media.giphy.com/media/NV4cSrRYXXwfUcYnua/giphy.gif)'
      }
    ]
  }
  const headers = { contentType: 'application/vnd.microsoft.teams.card.o365connector' }
  await axios.post(roomServiceTeamsWebhook, teamsMsg, { headers })
}
