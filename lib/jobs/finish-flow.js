const { remove, save } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

module.exports = async (flowConfig, flowStatus) => {
  if (flowConfig.doNotRemoveBlobs) {
    logger('info', ['finishFlow', 'Do not remove blobs is true. Will keep blobs, setting flow to finished'])
    flowStatus.finished = true
    await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
    logger('info', ['finishFlow', 'Successfully set flow to finished. All is good to go'])

    return 'Successfully finished flow'
  }

  logger('info', ['finishFlow', 'delete-blobs', 'deleting blobs for Acos form and refId'])
  const result = await remove(`${flowStatus.acosId}/${flowStatus.refId}`, { ...blobOptions, excludeBlobNames: [`${flowStatus.refId}-flow-status.json`] })
  logger('info', ['finishFlow', `Successfully removed ${result.length} blobs`, 'Removed all blobs except flowStatus. It can now be removed'])
  await remove(`${flowStatus.acosId}/${flowStatus.refId}`, blobOptions)
  logger('info', ['finishFlow', 'delete-blobs', 'Finished', 'successfully removed flow-status.json'])

  return 'Successfully finished flow'
}
