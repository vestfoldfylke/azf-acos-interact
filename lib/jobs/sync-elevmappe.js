const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger('info', ['syncElevmappe', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  } else if (jobDef.options?.useDefaultStudentMapper) {
    logger('info', ['syncElevmappe', 'useDefaultStudentMapper is true in options', 'using defaultStudentMapper'])
    throw new Error("Don't use useDefaultStudentMapper. We are not comfortable with this feature now. Please provide a custom mapper in flow definition")
    /*
    const defaultData = flowStatus.parseXml?.result?.ArchiveData?.Fnr
    if (!defaultData) throw new Error('No value found in defaultData: ArchiveData.Fnr, Are you using the correct avleveringsfil from Acos?')
    personData = {
      ssn: defaultData
    }
    */
  }

  logger('info', ['syncElevmappe', 'Mapper is defined in options. Will use it.'])
  const personData = mapper(flowStatus)

  const forceUpdate = personData.forceUpdate === false ? false : true // COOP OBS! skitten måte for å default til true

  let payload
  if (personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Syncing elevmappe with fake SSN'])
    const { fakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate, gender } = personData
    if (!(fakeSsn && firstName && lastName && streetAddress && zipCode && zipPlace && birthdate && gender)) {
      throw new Error('missing required parameters. Must be fakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate and gender')
    }
    payload = {
      fakeSsn,
      birthdate,
      gender,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      forceUpdate
    }
  }

  if (personData.manualData && !personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Syncing elevmappe with skipDSF'])
    const { manualData, ssn, firstName, lastName, streetAddress, zipCode, zipPlace } = personData
    if (!(manualData && ssn && firstName && lastName && streetAddress && zipCode && zipPlace)) {
      throw new Error('missing required parameters. Must be manualData, ssn, firstName, lastName, streetAddress, zipCode, zipPlace')
    }
    payload = {
      ssn,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      manualData,
      forceUpdate
    }
  }

  if (!personData.manualData && !personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Syncing elevmappe'])
    const { ssn } = personData
    if (!ssn) {
      throw new Error('missing required parameters. Must have ssn')
    }
    payload = {
      ssn,
      forceUpdate
    }
  }
  const data = await callArchive('SyncElevmappe', payload)
  logger('info', ['syncElevmappe', 'Successfully synced elevmappe', 'privatePerson recNo', data.privatePerson.recno, 'elevmappe saksnummer', data.elevmappe.CaseNumber])
  return data
}
