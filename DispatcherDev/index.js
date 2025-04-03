const { dispatcher } = require('../lib/dispatcher')
const { logConfig } = require('@vtfk/logger')

module.exports = async function (context, req) {
  logConfig({
    prefix: 'azf-acos-interact - Dispatcher',
    teams: {
      onlyInProd: true
    },
    azure: {
      context,
      excludeInvocationId: true
    },
    betterstack: {
      onlyInProd: true
    }
  })
  try {
    const result = await dispatcher()
    return { status: 200, body: result }
  } catch (error) {
    console.log(error)
    return { status: 500, body: error }
  }
}
