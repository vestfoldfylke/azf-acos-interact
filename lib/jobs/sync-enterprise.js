const { logger } = require('@vestfoldfylke/loglady')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger.error('syncEnterprise: No mapper or default mapper is defined in options')
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper in flow definition')
  }

  logger.info('syncEnterprise: Mapper is defined in options. Will use it.')
  const orgData = mapper(flowStatus)

  logger.info('syncEnterprise: Syncing enterprise')
  const { orgnr } = orgData
  if (!orgnr) {
    throw new Error('Missing required parameters in returned object from mapper. Must have orgnr')
  }
  const payload = {
    orgnr
  }
  const data = await callArchive('SyncEnterprise', payload)
  logger.info('syncEnterprise: Successfully synced enterprise. Recno: {Recno}', data.enterprise.recno)
  return data
}
