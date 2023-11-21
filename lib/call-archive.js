const { archive } = require('../config')
const axios = require('axios').default
const getAccessToken = require('./get-entraid-token')

module.exports.callArchive = async (endpoint, payload) => {
  const accessToken = await getAccessToken(archive.scope)
  const { data } = await axios.post(`${archive.url}/${endpoint}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } })
  return data
}
