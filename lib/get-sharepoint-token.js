const NodeCache = require('node-cache')
const { sharepointCredentials, nodeEnv } = require('../config')
const { logger } = require('@vtfk/logger')
const spToken = require('@vtfk/sharepoint-rest-auth')

const cache = new NodeCache({ stdTTL: 3000 })

module.exports = async (forceNew = false) => {
  const cacheKey = 'sharepointToken'

  if (!forceNew && cache.get(cacheKey)) {
    logger('info', ['getSharepointToken', 'found valid token in cache, will use that instead of fetching new'])
    return (cache.get(cacheKey))
  }

  logger('info', ['getsharepointToken', 'no token in cache, fetching new from Microsoft'])
  let pfxcert
  if (nodeEnv === 'dev') {
    const { readFileSync } = require('fs')
    pfxcert = readFileSync(sharepointCredentials.pfxPath).toString('base64')
  } else {
    pfxcert = sharepointCredentials.pfxBase64
  }
  const config = {
    thumbprint: sharepointCredentials.pfxThumbprint, // Certificate thumbprint
    pfxcert, // PFX cert as base64
    privateKeyPassphrase: sharepointCredentials.pfxPassphrase, // passphrase for private key
    clientId: sharepointCredentials.clientId, // app reg client id
    tenantId: sharepointCredentials.tenantId, // tenant id
    tenantName: sharepointCredentials.tenantName // tenant name
  }

  const token = await spToken(config)
  const expires = Math.floor((token.expiresOn.getTime() - new Date()) / 1000)
  logger('info', ['getSharepointToken', `Got token from Microsoft, expires in ${expires} seconds.`])
  cache.set(cacheKey, token.accessToken, expires)
  logger('info', ['getSharepointToken', 'Token stored in cache'])

  return token.accessToken
}
