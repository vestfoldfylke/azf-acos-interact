const { list, get, remove } = require('@vtfk/azure-blob-client')
const { storageAccount, retryIntervalMinutes, willNotRunAgainFilename } = require('../config')
const runFlow = require('../lib/run-flow')
const { readdirSync } = require('fs')
const { logger } = require('@vestfoldfylke/loglady')

// takes in a list of blobs, sorts them on acosRefId and returns object indexed on acosRefId with corresponding blobs as value for the refId
const createRefIdCollections = (bloblist) => {
  const collections = {}
  for (const blob of bloblist) {
    const pathList = blob.path.split('/')
    if (pathList.length < 3) {
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
  // regex: ^\w{3}-\d{2}$ Hvis man vil (for spesielt interesserte)
  const filenameList = filename.split('-')

  if (filenameList.length < 2) {
    logger.error('Flowfile with name {filename} is not in valid format. Must be <acosId>-<acosName>.js', filename)
    filenameList.push('unknownAcosName')
  }
  if (filenameList[0].length === 3 && !isNaN(filenameList[1])) {
    logger.info('Flowfile {filename} is in very new Interact format', filename)
    if (filenameList.length < 3) {
      logger.error('Flowfile with filename {filename} is not on valid format. Must be <acosId>-<acosName>.js', filename)
      filenameList.push('unknownAcosName')
    }
    return {
      filepath: `../flows/${filename}`,
      filename,
      acosId: `${filenameList[0]}-${filenameList[1]}`,
      acosName: filenameList.slice(2, filenameList.length).join('-').replace('.js', '')
    }
  } else {
    logger.info('Flowfile {filename} is in old Interact format from the 80s', filename)
    return {
      filepath: `../flows/${filename}`,
      filename,
      acosId: filenameList[0],
      acosName: filenameList.slice(1, filenameList.length).join('-').replace('.js', '')
    }
  }
}

const dispatcher = async () => {
  let processedRefIds = 0
  logger.info('Running dispatcher')
  const blobOptions = {
    connectionString: storageAccount.connectionString,
    containerName: storageAccount.containerName
  }

  logger.info('Getting all enabled flow definitions from ./flows')
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  const flows = []
  for (const schema of schemaNames) {
    try {
      const file = require(schema.filepath)
      if (file.config.enabled) {
        flows.push({ ...file, acosId: schema.acosId, acosName: schema.acosName })
      }
    } catch (error) {
      logger.errorException(error, 'Could not require schema flow file {filepath}, please verify that schema flow file is valid.', schema.filepath)
    }
  }
  logger.info('Got {length} enabled flow definitions', flows.length)
  let refIdCollections
  for (const flowDef of flows) {
    logger.logConfig({
      prefix: 'azf-acos-interact - Dispatcher'
    })
    logger.info('Getting blobs for AcosId {acosId} AcosName {acosName}', flowDef.acosId, flowDef.acosName)
    try {
      const blobs = await list(flowDef.acosId + '/', blobOptions) // sjekk at ikke de nye ID'ene krasjer med hverandre. VFK-1 og VFK-10 (uten slash vil VFK1 også ta med VFK-10)
      refIdCollections = createRefIdCollections(blobs)
    } catch (error) {
      logger.errorException(error, 'Could not get blobs for AcosId {acosId} AcosName {acosName}', flowDef.acosId, flowDef.acosName)
    }

    for (const [refId, blobs] of Object.entries(refIdCollections)) {
      logger.logConfig({
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
          logger.info('Could not find flowStatusBlob. Probably first run. Creating new flow status blob -  AcosId {acosid} - Acos name {acosname} - refId {refid}', flowDef.acosId, flowDef.acosName, refId)
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
            continue // blob has failed too many times
          }

          const runAfterTimestampPrefix = `${refId}-run-after-timestamp-`
          const runAfterTimestampBlob = blobs.find(blob => blob.name.startsWith(runAfterTimestampPrefix))
          if (runAfterTimestampBlob) {
            const runAfterTimestamp = new Date(runAfterTimestampBlob.name.replace(runAfterTimestampPrefix, '').replaceAll('__', ':').replace('.json', ''))
            if (runAfterTimestamp.toString() === 'Invalid Date') {
              logger.error('Blob has invalid runAfterTimestamp - blobname {blobname}. acosId {acosId}. acos name {acosname}. refId {refid}', runAfterTimestampBlob.name, flowDef.acosId, flowDef.acosName, refId)
              continue
            }
            if (now < runAfterTimestamp) {
              logger.info('Blob is not ready to run yet - Waiting until {timestamp}. Blobname {blobname}. acosId {acosId}. acos name {acosname}. refId {refid}', runAfterTimestamp.toISOString(), runAfterTimestampBlob.name, flowDef.acosId, flowDef.acosName, refId)
              continue
            }

            try {
              await remove(runAfterTimestampBlob.path, blobOptions)
            } catch (error) {
              logger.errorException(error, 'Failed to remove runAfterTimestamp blob {blobname}. AcosId {acosId}. AcosName {acosname}. refId {refid}', runAfterTimestampBlob.name, flowDef.acosId, flowDef.acosName, refId)
            }
          }
          const { data } = await get(flowStatusBlob.path, blobOptions)
          flowStatus = JSON.parse(data)
          if (now < new Date(flowStatus.nextRun)) {
            logger.info('Blob is not ready for retry yet - nextRun {nextRun} - AcosId: {acosId} - Acos name: {acosname} - refId: {refid}', flowStatus.nextRun, flowDef.acosId, flowDef.acosName, refId)
            continue
          }
          if (flowStatus.runs >= retryIntervalMinutes.length) {
            logger.error('Blob has exceeded maximum number of runs and will not run again. Missing doNotRunAgainBlob {willNotRunAgainFilename} - Runs: {runs}/{interval} - AcosId: {acosId} - Acos name: {acosname} - refId: {refid}', willNotRunAgainFilename, flowStatus.runs, retryIntervalMinutes.length, flowDef.acosId, flowDef.acosName, refId)
            continue // blob has failed too many times
          }
          if (flowStatus.finished) {
            continue
          }
          logger.info('Found flowStatusBlob - AcosId: {acosId} - Acos name: {acosname} - refId: {refid}', flowDef.acosId, flowDef.acosName, refId)

          flowStatus.failed = false // Blob is now ready to run again
        }
      } catch (error) {
        logger.errorException(error, 'Could not create or get flow status blob for AcosId {acosId} AcosName {acosName} refId {refId}', flowDef.acosId, flowDef.acosName, refId)
        continue
      }
      logger.info('Running flow for AcosId {acosId} AcosName {acosName} refId {refId}', flowDef.acosId, flowDef.acosName, refId)
      try {
        await runFlow(flowDef, flowStatus, blobs)
      } catch (error) {
        logger.errorException(error, 'There is something wrong! Can you hear me Major Tom? Please wake up and do something! Now! Error running flow for AcosId {acosId} AcosName {acosName} refId {refId}', flowDef.acosId, flowDef.acosName, refId)
      }
      processedRefIds++
    }
  }
  logger.info('Dispatcher finished processing all flows. Processed refIds: {processedRefIds}', processedRefIds)
  return 'run finished'
}

module.exports = { dispatcher, mapFlowFile, createRefIdCollections }
