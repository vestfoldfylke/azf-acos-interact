const { get } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
const xml2js = require('xml2js')
const { addLopenummerIfEqualFileName } = require('../add-lopenummer-if-equal-filename')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

const xmlParser = new xml2js.Parser({ explicitArray: false })
// Søknad_om_tilrettelegging_på_fag-__svenne_eller_kompetanseprøve_1287554.xml
module.exports = async (blobs, flowStatus) => {
  let result = {}
  {
    logger('info', ['parse-xml', 'Running function', 'egendefinert avleveringsfil'])
    const excludeBlobs = ['NetAxeptQueryResult.xml', '_WEBSAK_HODE.xml', `_${flowStatus.refId}.xml`]
    const filteredXmlBlobs = blobs.filter(blob => {
      if (!blob.name.endsWith('.xml')) return false
      for (const excludeString of excludeBlobs) {
        if (blob.name.includes(excludeString)) return false
      }
      return true
    })
    if (filteredXmlBlobs.length === 0) throw new Error("Missing XML file. There's something wrong")
    if (filteredXmlBlobs.length > 1) throw new Error('More than one XML file. User has probably attached a xml file. Please check manually')

    const xmlBlob = filteredXmlBlobs[0]
    const { data } = await get(xmlBlob.path, blobOptions)
    result = await xmlParser.parseStringPromise(data)
    result.xmlFile = xmlBlob
    logger('info', ['parse-xml', 'Finished', 'egendefinert avleveringsfil', xmlBlob.name])
  }
  {
    logger('info', ['parse-xml', 'Running function', 'finding websak_hode.xml or {Skjemanavn}{_flowStatus.refId}.xml'])
    const websakHodeBlob = blobs.find(blob => blob.name.endsWith('_WEBSAK_HODE.xml') || blob.name.endsWith(`_${flowStatus.refId}.xml`)) // i ny versjon av Acos Interact heter ikke metadatafilen websak_hode lenger, men {Skjemanavn}{_flowStatus.refId}.xml

    if (!websakHodeBlob) throw new Error("Missing websakhode file. There's something wrong")

    result.websakHodeXmlFile = websakHodeBlob // Add websakhode-xml to result metadata - need it for ground control

    const { data } = await get(websakHodeBlob.path, blobOptions)
    const xmlData = await xmlParser.parseStringPromise(data)
    const excludeFiles = ['NetAxeptQueryResult.xml', '_WEBSAK_HODE.xml', `_${flowStatus.refId}.xml`]
    const filteredFiles = xmlData.WEBSAK_INN.OPERASJON_INN.PARAMETER.DOKUMENT.VEDLEGG.filter(file => {
      for (const excludeString of excludeFiles) {
        if (file._.includes(excludeString)) return false
      }
      return true
    })

    // Sjekk om det finnes flere filer med nøyaktig samme navn - da må vi slenge på suffix _{løpenummer} i file._ (siden blob-storage gjør det - spør Nils om du lurer)
    addLopenummerIfEqualFileName(filteredFiles)

    result.files = filteredFiles.map(file => {
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
    logger('info', ['parse-xml', 'Finished', 'websak_hode.xml or {Skjemanavn}{_flowStatus.refId}.xml', websakHodeBlob.name])
  }

  return result
}
