const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  let personData
  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger('info', ['syncEmployee', 'No mapper defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }

  logger('info', ['syncEmployee', 'Mapper is defined in options. Will use it.'])
  personData = mapper(flowStatus)

  logger('info', ['syncEmployee', 'Syncing employee'])
  const { ssn, ansattnummer, forceUpdate } = personData
  if (!ssn && !ansattnummer) {
    throw new Error('Missing required parameter "ssn" or "ansattnummer". Mapper is probably set up wrong.')
  }
  const payload = {
    forceUpdate
  }
  if (ssn) payload.ssn = ssn
  if (ansattnummer) payload.ansattnummer = ansattnummer

  const data = await callArchive('SyncEmployee', payload) // NOTE - this is not implemented in new archive yet, contact the bearded idiot when you need it! Bearded idiot is contacted - this should be up and running! 🧔‍♂️
  logger('info', ['syncEmployee', 'Successfully synced employee', 'privatePerson recno', data.privatePerson.recno, 'enterprise recno', data.responsibleEnterprise.recno, 'manager recno', data.archiveManager.recno])
  return data
}
