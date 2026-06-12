const NodeCache = require("node-cache")
const { sharepointCredentials, nodeEnv } = require("../config")
const { logger } = require("@vestfoldfylke/loglady")
const { ConfidentialClientApplication } = require("@azure/msal-node")
const forge = require("node-forge")
const { createHash } = require("node:crypto")

/**
 * Parses an Azure Key Vault PFX (Base64 string from @Microsoft.KeyVault reference)
 * @param {string} pfxBase64 - base64-encoded PFX from Azure environment variables
 * @returns {{ certificate: string, key: string }}
 */
const parseAzureKeyVaultPfx = (pfxBase64, passphrase) => {
  if (!pfxBase64) throw new Error("PFX input is required")

  let p12
  try {
    const asn = forge.asn1.fromDer(forge.util.decode64(pfxBase64))

    // Azure uses an empty string password ('') for export, NOT undefined/null
    p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, passphrase ?? "")
  } catch (err) {
    throw new Error(`Failed to parse PFX layout: ${err.message}`)
  }

  // 1. Extract the Private Key
  // Azure places the key into pkcs8ShroudedKeyBag. We check both to stay robust locally.
  const shroudedBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? []
  const standardBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? []

  let privateKeyPem

  if (shroudedBags.length > 0) {
    // Shrouded bag requires wrapping logic
    privateKeyPem = forge.pki.privateKeyInfoToPem(forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(shroudedBags[0].key)))
  } else if (standardBags.length > 0) {
    // Unencrypted bag can be serialized directly
    privateKeyPem = forge.pki.privateKeyToPem(standardBags[0].key)
  } else {
    throw new Error("No private key bag found in the PFX container")
  }

  // 2. Extract the Certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? []
  if (!certBags.length) throw new Error("No certificate found in the PFX container")

  const certificatePem = forge.pki.certificateToPem(certBags[0].cert)

  return {
    certificate: certificatePem,
    key: privateKeyPem
  }
}

const cache = new NodeCache({ stdTTL: 3000 })

module.exports = async (forceNew = false) => {
  const cacheKey = "sharepointToken"

  if (!forceNew && cache.get(cacheKey)) {
    logger.info("getSharePointToken - found valid token in cache, will use that instead of fetching new")
    return cache.get(cacheKey)
  }
  logger.info("getSharePointToken - no valid token in cache, fetching new from Microsoft")
  let pfxcert
  if (nodeEnv === "dev") {
    const { readFileSync } = require("node:fs")
    pfxcert = readFileSync(sharepointCredentials.pfxPath).toString("base64")
  } else {
    pfxcert = sharepointCredentials.pfxBase64
  }

  const { certificate, key } = parseAzureKeyVaultPfx(pfxcert, sharepointCredentials.pfxPassphrase)

  // Calculate the hex thumbprint dynamically to ensure it always matches the active signing key
  const cleanPem = certificate.replace(/-----\s*BEGIN CERTIFICATE\s*-----|-----\s*END CERTIFICATE\s*-----|\r|\n|\s/g, "")
  const certBuffer = Buffer.from(cleanPem, "base64")
  const dynamicThumbprintSha256 = createHash("sha256").update(certBuffer).digest("hex")

  const confidentialClient = new ConfidentialClientApplication({
    auth: {
      clientId: sharepointCredentials.clientId,
      authority: `https://login.microsoftonline.com/${sharepointCredentials.tenantId}`,
      clientCertificate: {
        thumbprintSha256: dynamicThumbprintSha256,
        privateKey: key
      }
    }
  })

  const token = await confidentialClient.acquireTokenByClientCredential({
    scopes: [`https://${sharepointCredentials.tenantName}.sharepoint.com/.default`]
  })

  if (!token?.accessToken) {
    throw new Error("Failed to acquire token from Microsoft")
  }

  const expires = Math.floor((token.expiresOn.getTime() - Date.now()) / 1000)
  logger.info("getSharepointToken - Got token from Microsoft, expires in {expires} seconds", expires)
  cache.set(cacheKey, token.accessToken, expires)
  logger.info("getSharepointToken - Stored token in cache")

  return token.accessToken
}
