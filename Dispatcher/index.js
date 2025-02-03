const { dispatcher } = require('../lib/dispatcher')
const { logConfig, logger } = require('@vtfk/logger')

module.exports = async function (context, myTimer) {
  logConfig({
    prefix: 'azf-acos-interact - Dispatcher',
    azure: {
      context,
      excludeInvocationId: true
    },
    teams: {
      onlyInProd: false
    },
    betterstack: {
      onlyInProd: false
    }
  })
  try {
    await dispatcher()
  } catch (error) {
    logger('error', ['timertrigger failed', error.stack || error.toString()])
  }
}
