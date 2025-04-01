const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger('info', ['syncPrivatePerson', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  } else if (jobDef.options?.useDefaultStudentMapper) {
    logger('info', ['syncPrivatePerson', 'useDefaultStudentMapper is true in options', 'using defaultStudentMapper'])
    throw new Error("Don't use useDefaultStudentMapper. We are not comfortable with this feature now. Please provide a custom mapper in flow definition")
    /*
    const defaultData = flowStatus.parseXml?.result?.ArchiveData?.Fnr
    if (!defaultData) throw new Error('No value found in defaultData: ArchiveData.Fnr, Are you using the correct avleveringsfil from Acos?')
    personData = {
      ssn: defaultData
    }
    */
  }

  logger('info', ['syncPrivatePerson', 'Mapper is defined in options. Will use it.'])
  const personData = mapper(flowStatus)

  let payload
  if (personData.fakeSsn) {
    logger('info', ['syncPrivatePerson', 'Syncing private person with fake SSN'])
    const { fakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate, gender, forceUpdate } = personData
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
    logger('info', ['syncPrivatePerson', 'Syncing private person with manual data'])
    const { manualData, ssn, firstName, lastName, streetAddress, zipCode, zipPlace, forceUpdate } = personData
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
    logger('info', ['syncPrivatePerson', 'Syncing private person'])
    const { ssn, forceUpdate } = personData
    if (!ssn) {
      throw new Error('missing required parameters. Must have ssn')
    }
    payload = {
      ssn,
      forceUpdate
    }
  }
  const data = await callArchive('SyncPrivatePerson', payload)
  logger('info', ['syncPrivatePerson', 'Successfully synced private person', 'RecNo', data.privatePerson.recno])
  return data
}
