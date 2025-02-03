(async () => {
  const { AVLEVERING_ROOT, GROUND_CONTROL_STORAGE_ACCOUNT_CONNECTION_STRING, GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME } = require('./config')
  const { list, get, remove } = require('@vtfk/azure-blob-client')
  const { writeFileSync, renameSync, mkdirSync, existsSync } = require('fs')
  const { createRefIdCollections } = require('../lib/dispatcher')
  const { logger, logConfig } = require('@vtfk/logger')

  logConfig({
    prefix: 'ground-control - local script',
    betterstack: {
      onlyInProd: false
    }
  })

  const blobOptions = {
    connectionString: GROUND_CONTROL_STORAGE_ACCOUNT_CONNECTION_STRING,
    containerName: GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME
  }

  // Make sure root dir exists
  if (!existsSync(AVLEVERING_ROOT)) {
    logger('error', `Please create ${AVLEVERING_ROOT} directory to be able to continue`)
    throw new Error(`Please create ${AVLEVERING_ROOT} directory to be able to continue`)
  }

  // Get all blobs in storage account
  logger('info', 'Fetching blobs ready for server download')
  const blobs = await list('*', blobOptions)
  logger('info', `Got ${blobs.length} ready blobs from storage account`)

  // Sort on refId (koble sammen filer som tilhører hverandre)
  const refIdCollections = createRefIdCollections(blobs)

  for (const [refId, blobs] of Object.entries(refIdCollections)) {
    try {
      logger('info', `Processing refId ${refId} - ${blobs.length} blobs found on this refid`)
      if (!blobs.some(blob => blob.name.endsWith('flow-status.json'))) {
        logger('info', `RefId ${refId} is not finished receiving all blobs - will wait with this refid for next run`)
        continue
      }

      // Sjekk om skjema-mappe finnes - hvis ikke opprett
      const schemaName = blobs[0].path.split('/')[0]
      const schemaDir = `${AVLEVERING_ROOT}/${schemaName}`
      const inProgressDir = `${schemaDir}/inprogress`
      if (!existsSync(schemaDir)) mkdirSync(schemaDir)
      if (!existsSync(inProgressDir)) mkdirSync(inProgressDir)

      logger('info', `refId ${refId} - all blobs present - will download to inProgressDir`)
      const blobsToMove = []
      for (const blob of blobs) {
        logger('info', `refId ${refId} - downloading blob ${blob.name}`)
        const blobData = await get(blob.path, { ...blobOptions, encoding: 'base64' })
        writeFileSync(`${inProgressDir}/${blob.name}`, blobData.data, 'base64')
        blobsToMove.push({
          path: `${inProgressDir}/${blob.name}`,
          name: blob.name
        })
        logger('info', `refId ${refId} - succesfully downloaded blob ${blob.name}`)
      }
      logger('info', `refId ${refId} - succesfully downloaded all blobs to inProgressDir - moving to schemaDir`)
      for (const blob of blobsToMove) {
        renameSync(blob.path, `${schemaDir}/${blob.name}`)
      }
      logger('info', `refId ${refId} - succesfully moved all files to schemaDir, deleting files from storage account`)
      await remove(`${schemaName}/${refId}`, blobOptions)
      logger('info', `refId ${refId} - succesfully deleted files from storage account`)
    } catch (error) {
      logger('warn', ['Major Tom to ground control!', 'Error when fetching blobs to ground control', `refId: ${refId}`, error.stack || error.toString()])
      continue
    }
  }
  logger('info', 'Finished downloading all refids and blobs to ground control')
})()
