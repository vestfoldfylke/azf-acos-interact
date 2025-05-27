const verifyJsonAttachments = (jsonDataAttachments, blobDataAttachments) => {
  if (!Array.isArray(jsonDataAttachments)) {
    throw new Error('Attachments in JSON file is not an array. There is something wrong')
  }
  if (!Array.isArray(blobDataAttachments)) {
    throw new Error('Attachments in blob storage is not an array. There is something wrong')
  }
  const jsonAttachments = jsonDataAttachments.map((attachment, index) => {
    if (!attachment.FileName || !attachment.FileExtension) {
      throw new Error(`Attachment ${index} in JSON file is missing FileName or FileExtension. There is something wrong`)
    }
    return {
      id: index,
      name: attachment.FileName,
      extension: attachment.FileExtension
    }
  })
  // Sjekk at alle attachments fra blobStorage er med i jsonAttachments
  const blobAttachments = blobDataAttachments.filter(file => file.type === 'V').map(file => {
    const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'))
    const extension = file.name.substring(file.name.lastIndexOf('.') + 1)
    const nameWithoutRunningNumber = nameWithoutExtension.substring(0, nameWithoutExtension.lastIndexOf('_'))
    return {
      name: nameWithoutExtension,
      extension,
      nameWithoutRunningNumber
    }
  })
  const alreadyFoundJsonAttachments = []
  for (const attachment of blobAttachments) {
    const jsonAttachmentsToCheck = jsonAttachments.filter(jsonAttachment => !alreadyFoundJsonAttachments.some(att => att.id === jsonAttachment.id))
    const exactMatch = jsonAttachmentsToCheck.find(jsonAttachment => jsonAttachment.name === attachment.name && jsonAttachment.extension === attachment.extension)
    if (exactMatch) {
      alreadyFoundJsonAttachments.push(exactMatch)
      continue
    }
    const matchWihoutRunningNumber = jsonAttachmentsToCheck.find(jsonAttachment => jsonAttachment.name === attachment.nameWithoutRunningNumber && jsonAttachment.extension === attachment.extension)
    if (matchWihoutRunningNumber) {
      alreadyFoundJsonAttachments.push(matchWihoutRunningNumber)
      continue
    }
    throw new Error(`Attachment ${attachment.name} with extension ${attachment.extension} not found in JSON attachments. There is something wrong`)
  }
  if (alreadyFoundJsonAttachments.length !== jsonAttachments.length) {
    throw new Error('Not all attachments from JSON file are found in blobStorage. There is something wrong. Sjekk sjæl.') // Kan også liste forskjellen her hvis vi vil
  }
  return true // Return true if all checks pass
}

module.exports = { verifyJsonAttachments }
