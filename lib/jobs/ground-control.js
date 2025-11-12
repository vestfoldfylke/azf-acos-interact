const { logger } = require('@vestfoldfylke/loglady')
const { groundControlStorageAccount, storageAccount } = require('../../config')
const { createBlobServiceClient, save } = require('@vtfk/azure-blob-client')
const { BlobSASPermissions } = require('@azure/storage-blob')

module.exports = async (flowStatus) => {
  logger.info('groundControl: Copying files to ground-control storage account for local handling')

  if (!flowStatus.parseXml?.jobFinished && !flowStatus.parseJson?.jobFinished) throw new Error('Could not find flowStatus.parseXml.jobFinished or flowStatus.parseJson.jobFinished. Did you remember to enable the parseXml or parseJson job for the flow?')

  logger.info('groundControl: Copying pdf and attachments')

  const blobOptionsSource = {
    connectionString: storageAccount.connectionString,
    containerName: storageAccount.containerName
  }
  const blobOptionsDestination = {
    connectionString: groundControlStorageAccount.connectionString,
    containerName: groundControlStorageAccount.containerName
  }

  const blobClientSource = createBlobServiceClient(blobOptionsSource)
  const blobClientDestination = createBlobServiceClient(blobOptionsDestination)
  const copiedFiles = []
  const schemaFilesToCopy = flowStatus.parseXml?.result ? flowStatus.parseXml.result.files : flowStatus.parseJson.result.files
  for (const file of schemaFilesToCopy) {
    logger.info('groundControl: Copying {FilePath} to ground control storage account', file.path)
    const sourceBlob = blobClientSource.getContainerClient(blobOptionsSource.containerName).getBlockBlobClient(file.path)
    const destinationBlob = blobClientDestination.getContainerClient(blobOptionsDestination.containerName).getBlockBlobClient(file.path)
    const sasUrl = await sourceBlob.generateSasUrl({ permissions: BlobSASPermissions.parse('r'), expiresOn: new Date((new Date().valueOf() + 60000)) })
    await destinationBlob.syncUploadFromURL(sasUrl)
    logger.info('groundControl: Finished copying {FilePath}', file.path)
    copiedFiles.push(file.path)
  }
  if (flowStatus.parseXml?.result) {
    {
      const websakHodeXmlFile = flowStatus.parseXml.result.websakHodeXmlFile
      logger.info('groundControl: Copying {FilePath} to ground control storage account', websakHodeXmlFile.path)
      const sourceBlob = blobClientSource.getContainerClient(blobOptionsSource.containerName).getBlockBlobClient(websakHodeXmlFile.path)
      const destinationBlob = blobClientDestination.getContainerClient(blobOptionsDestination.containerName).getBlockBlobClient(websakHodeXmlFile.path)
      const sasUrl = await sourceBlob.generateSasUrl({ permissions: BlobSASPermissions.parse('r'), expiresOn: new Date((new Date().valueOf() + 60000)) })
      await destinationBlob.syncUploadFromURL(sasUrl)
      logger.info('groundControl: Finished copying {FilePath}', websakHodeXmlFile.path)
      copiedFiles.push(websakHodeXmlFile.path)
    }
    {
      const xmlFile = flowStatus.parseXml.result.xmlFile
      logger.info('groundControl: Copying {FilePath} to ground control storage account', xmlFile.path)
      const sourceBlob = blobClientSource.getContainerClient(blobOptionsSource.containerName).getBlockBlobClient(xmlFile.path)
      const destinationBlob = blobClientDestination.getContainerClient(blobOptionsDestination.containerName).getBlockBlobClient(xmlFile.path)
      const sasUrl = await sourceBlob.generateSasUrl({ permissions: BlobSASPermissions.parse('r'), expiresOn: new Date((new Date().valueOf() + 60000)) })
      await destinationBlob.syncUploadFromURL(sasUrl)
      logger.info('groundControl: Finished copying {FilePath}', xmlFile.path)
      copiedFiles.push(xmlFile.path)
    }
  }
  logger.info('groundControl: Creating flowStatus file in ground control storage account')
  await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptionsDestination)
  logger.info('groundControl: Finished creating flowStatus file')
  copiedFiles.push(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`)

  logger.info('groundControl: Successfully sent data to ground control blob container')
  return copiedFiles
}
