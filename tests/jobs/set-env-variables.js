const { Values } = require('../../local.settings.json')

const setEnv = () => {
  // Load in local settings to env
  for (const [key, val] of Object.entries(Values)) {
    process.env[key] = val
  }
}

module.exports = setEnv
