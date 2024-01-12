const addLopenummerIfEqualFileName = (fileList) => {
  // REMEMBER: This function modifies the file-objects in place - aka the objects inside the list you provide to the function will be modified
  // Sjekk om det finnes flere filer med nøyaktig samme navn - da må vi slenge på suffix _{løpenummer} i file._ (siden blob-storage gjør det - spør Nils om du lurer)
  for (const file of fileList) {
    const filesWithEqualName = fileList.filter(f => f._ === file._)
    if (filesWithEqualName.length > 1) {
      // Da har vi flere enn en fil med samme navn som file - vi må slenge på suffix
      let lopenummer = 1
      for (const equalFile of filesWithEqualName) {
        const filenameList = equalFile._.split('.')
        const fileext = filenameList.pop()
        const filename = filenameList.join('.')
        equalFile._ = `${filename}_${lopenummer}.${fileext}`
        lopenummer++
      }
    }
  }
  return fileList
}

module.exports = { addLopenummerIfEqualFileName }
