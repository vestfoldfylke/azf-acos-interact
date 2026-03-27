const { dispatcher } = require("../lib/dispatcher")
const { logger } = require("@vestfoldfylke/loglady")

module.exports = async (_context, _req) => {
  logger.logConfig({
    prefix: "azf-acos-interact - Dispatcher"
  })
  try {
    const result = await dispatcher()
    return { status: 200, body: result }
  } catch (error) {
    console.log(error)
    return { status: 500, body: error }
  }
}
