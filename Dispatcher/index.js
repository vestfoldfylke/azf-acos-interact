const { dispatcher } = require('../lib/dispatcher')
const { logger } = require('@vestfoldfylke/loglady')

module.exports = async function (context, myTimer) {
  logger.logConfig({
    prefix: 'azf-acos-interact - Dispatcher'
  })
  try {
    await dispatcher()
  } catch (error) {
    logger.errorException(error, 'timertrigger failed')
  }
}
