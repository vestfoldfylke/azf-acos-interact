const { list, get } = require('@vtfk/azure-blob-client')
const { storageAccount, retryIntervalMinutes, willNotRunAgainFilename } = require('../config')
const runFlow = require('../lib/run-flow')
const { readdirSync } = require('fs')
const { logger, logConfig } = require('@vtfk/logger')

// takes in a list of blobs, sorts them on acosRefId and returns object indexed on acosRefId with corresponding blobs as value for the refId
const createRefIdCollections = (bloblist) => {
  const collections = {}
  for (const blob of bloblist) {
    const pathList = blob.path.split('/')
    if (pathList.length < 3) {
      // logger('error', ['Blob has illegal path. Must use folder strategy in Acos avlevering', `${storageAccount.containerName}/${blob.path}`, 'please correct in Acos avlevering and move the blob files to right strategy if they need to be handled'])
      continue
    }
    const refId = pathList[1]
    if (!collections[refId] || !Array.isArray(collections[refId])) {
      collections[refId] = []
    }
    collections[refId].push(blob)
  }
  return collections
}

const mapFlowFile = (filename) => {
  const filenameList = filename.split('-')
  if (filenameList.length < 2) {
    logger('error', ['Flowfile with filename', filename, 'is not on valid format. Must be {acosId}-{acosName}.js'])
    filenameList.push('unknownAcosName')
  }
  return {
    filepath: `../flows/${filename}`,
    filename,
    acosId: filenameList[0],
    acosName: filenameList.slice(1, filenameList.length).join('-').replace('.js', '')
  }
}

const dispatcher = async () => {
  let processedRefIds = 0

  logger('info', ['Running dispatcher'])
  const blobOptions = {
    connectionString: storageAccount.connectionString,
    containerName: storageAccount.containerName
  }

  logger('info', ['Getting all enabled flow definitions from ./flows'])
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  const flows = []
  for (const schema of schemaNames) {
    try {
      const file = require(schema.filepath)
      if (file.config.enabled) {
        flows.push({ ...file, acosId: schema.acosId, acosName: schema.acosName })
      }
    } catch (error) {
      logger('error', ['Could not require schema flow file', schema.filepath, 'please verify that schema flow file is valid', error.toString(), error])
    }
  }
  logger('info', [`Got ${flows.length} enabled flow definitions`])
  let refIdCollections
  for (const flowDef of flows) {
    logConfig({
      prefix: 'azf-acos-interact - Dispatcher'
    })
    logger('info', ['Getting blobs for', flowDef.acosId, flowDef.acosName])
    try {
      const blobs = await list(flowDef.acosId, blobOptions)
      refIdCollections = createRefIdCollections(blobs)
    } catch (error) {
      logger('error', ['Could not get blobs', error.toString(), error])
    }

    for (const [refId, blobs] of Object.entries(refIdCollections)) {
      logConfig({
        prefix: 'azf-acos-interact - Dispatcher'
      })
      let flowStatus
      if (blobs.length === 0) throw new Error(`Ingen blober for ${refId} Dette skal ikke skje!`)
      const blobPathList = blobs[0].path.split('/')
      const blobDir = blobPathList.slice(0, blobPathList.length - 1).join('/')
      try {
        const flowStatusBlob = blobs.find(blob => blob.name === `${refId}-flow-status.json`)
        const now = new Date()
        if (!flowStatusBlob) {
          logger('info', ['Could not find flowStatusBlob. Probably first run.', 'Creating new', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
          flowStatus = {
            createdTimeStamp: now,
            finished: false,
            failed: false,
            refId,
            acosId: flowDef.acosId,
            acosName: flowDef.acosName,
            blobDir,
            runs: 0,
            nextRun: now.toISOString()
          }
        } else {
          const doNotRunAgainBlob = blobs.find(blob => blob.name === `${refId}-${willNotRunAgainFilename}.json`)
          if (doNotRunAgainBlob) {
            // logger('warn', ['Blob will not run again', `Found ${refId}-${willNotRunAgainFilename}.json. Will not run it`, 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue // blob has failed too many times
          }
          const { data } = await get(flowStatusBlob.path, blobOptions)
          flowStatus = JSON.parse(data)
          if (now < new Date(flowStatus.nextRun)) {
            logger('info', ['Not ready for retry', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue
          }
          if (flowStatus.runs >= retryIntervalMinutes.length) {
            logger('error', [`Noen har tukla! Blob will not run again and is missing ${willNotRunAgainFilename}. Runs`, `${flowStatus.runs}/${retryIntervalMinutes.length}`, 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue // blob has failed too many times
          }
          if (flowStatus.finished) {
            // logger('warn', ['Blob is already finished and will not run again', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue
          }
          logger('info', ['Found flowStatusBlob.', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])

          flowStatus.failed = false // Blob is now ready to run again
        }
      } catch (error) {
        logger('error', ['Failed when creating or getting flow status', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId, error.toString(), error])
        continue
      }
      await logger('info', ['Running flow', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
      try {
        await runFlow(flowDef, flowStatus, blobs)
      } catch (error) {
        logger('error', ["Flow failed. There's something wrong! Can you hear me Major Tom? Please wake up and do something! Now!", 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId, error.toString(), error])
      }
      processedRefIds++
    }
  }
  logger('info', ['Dispatcher finished', 'Processed refIds', processedRefIds])
  return 'run finished'
}

module.exports = { dispatcher, mapFlowFile, createRefIdCollections }
