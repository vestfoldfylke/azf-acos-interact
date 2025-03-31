const axios = require('axios').default
const { statistics } = require('../../config')
const { logger } = require('@vtfk/logger')
const { name, version } = require('../../package.json')

module.exports = async (jobDef, flowStatus) => {
  logger('info', ['statistics', 'starting job'])
  const headers = {
    'x-functions-key': statistics.apiKey
  }

  let payload
  const mapper = jobDef.options?.mapper
  if (!mapper) {
    logger('info', ['statistics', 'No mapper defined in options'])
    throw new Error('No mapper defined in options for statistics. Please provide a custom mapper in flow definition')
  }

  logger('info', ['statistics', 'Mapper is defined in options. Will use it.'])
  payload = mapper(flowStatus)
  payload.system = 'Acos skjema'
  payload.engine = `${name} ${version}`
  payload.externalId = flowStatus.refId

  const { data } = await axios.post(`${statistics.url}/Stats`, payload, { headers })
  logger('info', ['statistics', 'Successfully made statistics', 'Object id', data.insertedId])
  return data
}
