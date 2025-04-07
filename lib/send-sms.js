const { logger } = require('@vtfk/logger')
const axios = require('axios')
const { sms: { apiKey, url } } = require('../config')

const options = {
  headers: {
    'Content-Type': 'application/json',
    'X-Functions-Key': apiKey
  }
}

module.exports = async (payload) => {
  if (!payload || !Array.isArray(payload.receivers) || !payload.message || !payload.sender) {
    logger('error', ['send-sms', 'Payload is not valid'])
    throw new Error('Payload is not valid')
  }

  logger('info', ['send-sms', 'Sending sms'])
  const { data } = await axios.post(url, payload, options)
  logger('info', ['send-sms', 'SMS sent successfully'])
  return data
}
