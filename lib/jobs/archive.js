const { storageAccount, autoConvertFileFormats } = require('../../config')
const { logger } = require('@vtfk/logger')
const { get } = require('@vtfk/azure-blob-client')
const { callArchive } = require('../call-archive')

const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

module.exports = async (jobDef, flowStatus) => {
  let payload
  const mainDocument = flowStatus.parseXml.result.files.find(file => file.type === 'H')
  if (!mainDocument) throw new Error('No file with type "H" found in flowStatus.parseXml.result.files. Something is probably wrong with avlevering from Acos')
  const blobContent = await get(mainDocument.path, { ...blobOptions, encoding: 'base64' })
  const base64 = blobContent.data
  const attachmentList = flowStatus.parseXml.result.files.filter(file => file.type === 'V')
  const attachments = []
  for (const attachment of attachmentList) {
    const attachmentContent = await get(attachment.path, { ...blobOptions, encoding: 'base64' })
    const archiveAttachment = {
      title: attachment.desc,
      format: attachmentContent.extension,
      base64: attachmentContent.data,
      versionFormat: autoConvertFileFormats.includes(attachmentContent.extension.toLowerCase()) ? 'P' : 'A'
    }
    attachments.push(archiveAttachment)
  }
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['archive', 'Mapper is defined in options. Will use it.'])
    payload = mapper(flowStatus, base64, attachments)
  } else if (jobDef.options?.useDefaultStudentMapper) {
    logger('info', ['archive', 'No mapper defined in options', 'using default'])
    throw new Error("Don't use useDefaultStudentMapper. We are not comfortable with this feature now. Please provide a custom mapper in flow definition")
    /*
    const xmlData = flowStatus.parseXml?.result?.ArchiveData
    if (!xmlData) throw new Error('ArchiveData not found in xml from Acos. Are you using the correct avleveringsfil from Acos?')
    const { Fnr, Fornavn, Etternavn, AnsVirksomhet, Tilgangsgruppe, Tittel, AnsEpost } = xmlData
    if (!(Fnr && Fornavn && Etternavn && AnsVirksomhet && Tilgangsgruppe && Tittel)) throw new Error('Fnr, Fornavn, Etternavn, AnsVirksomhet, Tilgangsgruppe, Tittel is missing from avleveringsfil. Are you using the correct avleveringsfil from Acos?')
    const caseNumber = flowStatus.syncElevmappe?.result?.elevmappe.CaseNumber
    if (!caseNumber) throw new Error('No elevmappe found from syncElevmappe. Did you forget to enable the job in the flow file?')

    payload = {
      system: 'acos',
      template: 'elevdocument-default',
      parameter: {
        organizationNumber: AnsVirksomhet,
        documentDate: new Date().toISOString(),
        caseNumber,
        studentName: `${Fornavn} ${Etternavn}`,
        responsibleEmail: AnsEpost || '',
        accessGroup: Tilgangsgruppe,
        studentSsn: Fnr,
        base64,
        documentTitle: Tittel,
        attachments
      }
    }
    */
  } else {
    logger('info', ['archive', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }
  const data = await callArchive('archive', payload)
  logger('info', ['archive', 'Successfully archived document', data.DocumentNumber])
  return data
}
