const { get } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
// const { addLopenummerIfEqualFileName } = require('../add-lopenummer-if-equal-filename')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}
// Z88-JA7_data.json
// Testskjema Nils_Z88-JA7.pdf
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
    if (jobDef.options?.mapper) {
      logger('info', ['parse-json', 'Running function', 'mapper'])
      result.mapped = jobDef.options.mapper(jsonData.DialogueInstance)
    }
    result.jsonFile = jsonBlob
    logger('info', ['parse-json', 'Finished', 'avlevert datafil', jsonBlob.name])
  }
  logger('info', ['parse-json', 'Running function', 'find and modify running numbers on attachments if needed'])
  // Les inn data vi trenger fra json-fila

  // Sjekk om det finnes flere filer med nøyaktig samme navn - da må vi slenge på suffix _{løpenummer} i file._ (siden blob-storage gjør det - spør Nils om du lurer)
  /*
    addLopenummerIfEqualFileName(filteredFiles)

    const files = filteredFiles.map(file => {
      const name = file.$.TYPE === 'H' ? 'Skjema.pdf' : file._
      const descString = file.$.BESK === name ? file.$.BESK : `${file.$.BESK}.${name.split('.').pop()}`
      const desc = file.$.TYPE === 'H' ? 'Skjema.pdf' : descString
      let path
      if (file.$.TYPE === 'H') {
        path = `${flowStatus.blobDir}/${file._}` // dersom det er hoveddokument trenger vi ikke slenge på noe for å få korrekt path (xml-verdien = faktisk filnavn)
      } else if (file._.startsWith(`${flowStatus.refId}_`)) {
        path = `${flowStatus.blobDir}/${file._}` // dersom det er vedlegg som allerede har riktig prefix trenger vi ikke slenge på noe for å få korrekt path (xml-verdien = faktisk filnavn)
      } else {
        path = `${flowStatus.blobDir}/${flowStatus.refId}_${file._}` // xml inneholder ikke prefix, men avlevert fil inneholder prefix så vi slenger på prefix i path
      }
      return {
        name,
        path,
        type: file.$.TYPE,
        desc
      }
    })
    result.files = files
    logger('info', ['parse-json', 'Finished', 'websak_hode.xml or {Skjemanavn}{_flowStatus.refId}.xml', websakHodeBlob.name])
    */

  return result
}
