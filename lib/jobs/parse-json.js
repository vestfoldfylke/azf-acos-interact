const { get } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
const { verifyJsonAttachments } = require('../verify-json-attachments')
// const { addLopenummerIfEqualFileName } = require('../add-lopenummer-if-equal-filename')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

module.exports = async (blobs, flowStatus, jobDef) => {
  let result = {}
  {
    logger('info', ['parse-json', 'Running function', 'avlevert datafil'])
    const excludeBlobs = []
    const filteredJsonBlobs = blobs.filter(blob => {
      if (!blob.name.endsWith('.json')) return false
      for (const excludeString of excludeBlobs) {
        if (blob.name.includes(excludeString)) return false
      }
      if (!blob.name.endsWith(`${flowStatus.refId}_data.json`)) return false
      return true
    })
    if (filteredJsonBlobs.length === 0) throw new Error("Missing JSON file. There's something wrong")
    if (filteredJsonBlobs.length > 1) throw new Error('More than one JSON file. User has probably attached a json file. Please check manually')

    const jsonBlob = filteredJsonBlobs[0]
    const { data } = await get(jsonBlob.path, blobOptions)
    const jsonData = JSON.parse(data)
    if (!jsonData.DialogueInstance) throw new Error('Missing DialogueInstance in JSON file. There is something wrong')
    result = jsonData
    if (!jobDef.options?.mapper) {
      logger('info', ['parse-json', 'No mapper function defined'])
      throw new Error('Missing mapper function in job definition - required (for now)')
    }
    if (jobDef.options?.mapper) {
      logger('info', ['parse-json', 'Running function', 'mapper'])
      result.mapped = jobDef.options.mapper(jsonData)
    }
    result.jsonFile = jsonBlob
    logger('info', ['parse-json', 'got data from avlevert datafil', jsonBlob.name])

    logger('info', ['parse-json', 'finding files and metadata for delivered files'])

    // result.websakHodeXmlFile = websakHodeBlob // Add websakhode-xml to result metadata - need it for ground control  T O   D O ! ! < husk!!!
    // henter ut filer basert på det som er avlevert av blobs intill videre. Bruker avlevert skjema (pdf) som hoveddokument, dropper data.json og data.xml og bruker resten av filene som vedlegg

    const deliveredFiles = blobs
    const excludeFiles = [`${flowStatus.refId}_data.json`, `${flowStatus.refId}_data.xml`]
    const filteredFiles = deliveredFiles.filter(blob => {
      for (const excludeString of excludeFiles) {
        if (blob.path.includes(excludeString)) return false
      }
      return true
    })
    // Sjekk om det finnes flere filer med nøyaktig samme navn - da må vi slenge på suffix _{løpenummer} i file._ (siden blob-storage gjør det - spør Nils om du lurer)
    // logger('info', ['parse-json', 'Running function', 'find and modify running numbers on attachments if needed'])
    // addLopenummerIfEqualFileName(filteredFiles)
    const isMainDocument = file => file.path.endsWith(`${flowStatus.refId}.pdf`)
    const severalSchemaPdf = filteredFiles.filter(isMainDocument)
    if (severalSchemaPdf.length > 1) {
      throw new Error('Dette mener Nils aldri kommer til å skje!!!')
    }
    const files = filteredFiles.map(file => {
      const name = isMainDocument(file) ? 'Skjema.pdf' : file.name
      const desc = isMainDocument(file) ? 'Skjema.pdf' : file.name
      const path = file.path
      return {
        name,
        path,
        type: isMainDocument(file) ? 'H' : 'V',
        desc
      }
    })

    // Sjekk også attachments fra avlevert datafil, og at disse matcher med filene som er avlevert. Merk at blobstorage slenger på løpenummer på filnavn hvis det er flere filer med samme navn (caseSensitive også på extension)
    /*
      eksempel på jsonData.Attachments = [ { FileName: "hihihih", FileExtension: '.pdf' }, { FileName: "hihihih", FileExtension: '.pdf' } ]
    */
    const attachmentsAreAllThere = verifyJsonAttachments(jsonData.Attachments, files)
    if (!attachmentsAreAllThere) {
      throw new Error('Attachments in JSON file do not match files in blob storage. Ask Nils to fix this')
    }

    result.files = files
    logger('info', ['parse-json', 'Finished finding metadata for delivered files'])
  }

  return result
}
