const retryList = (process.env.RETRY_INTERVALS_MINUTES && process.env.RETRY_INTERVALS_MINUTES.split(',').map(numStr => Number(numStr))) || [15, 60, 240, 3600]
retryList.unshift(0)

module.exports = {
  storageAccount: {
    connectionString: process.env.STORAGE_ACCOUNT_CONNECTION_STRING || 'En connection string',
    containerName: process.env.STORAGE_ACCOUNT_CONTAINER_NAME || 'navn på container skjema'
  },
  groundControlStorageAccount: {
    connectionString: process.env.GROUND_CONTROL_STORAGE_ACCOUNT_CONNECTION_STRING || 'En connection string',
    containerName: process.env.GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME || 'navn på container skjema'
  },
  retryIntervalMinutes: retryList,
  willNotRunAgainFilename: 'will-not-run-again',
  archive: {
    url: process.env.ARCHIVE_URL || 'url to archive endpoint',
    scope: process.env.ARCHIVE_SCOPE || 'skuuupet for at arkivera'
  },
  statistics: {
    url: process.env.STATISTICS_URL || 'url to statistics endpoint',
    apiKey: process.env.STATISTICS_API_KEY || 'key to statistics endpoint'
  },
  archiveFileFormats: ((process.env.ARCHIVE_FILE_FORMATS && process.env.ARCHIVE_FILE_FORMATS.split(',')) || ['JPG', 'JPEG', 'XLSX', 'XLS', 'RTF', 'MSG', 'PPT', 'PPTX', 'DOCX', 'DOC', 'PNG']).map(ext => ext.toLowerCase()),
  appReg: {
    clientId: process.env.APP_REG_CLIENT_ID || 'ei klient id',
    clientSecret: process.env.APP_REG_CLIENT_SECRET || 'megahemmelig',
    tenantId: process.env.APP_REG_TENANT_ID || 'tenant id'
  },
  graph: {
    url: process.env.GRAPH_URL || 'tullballfinnessikkertikkeeleer.sharepoint.com',
    scope: process.env.GRAPH_SCOPE ?? 'etSkikkeligSkuup',
    ssnExtensionAttribute: process.env.GRAPH_SSN_EXTENSION_ATTRIBUTE || 'ssn_ext_attr'
  },
  sharepointCredentials: {
    clientId: process.env.APP_REG_CLIENT_ID ?? 'superId',
    tenantId: process.env.APP_REG_TENANT_ID ?? 'tenant id',
    tenantName: process.env.SP_TENANT_NAME ?? 'vestfoldfylke',
    pfxPath: process.env.SP_PFX_PATH ?? '',
    pfxBase64: process.env.SP_PFX_BASE64 ?? '',
    pfxPassphrase: process.env.SP_PFX_PASSPHRASE ?? null,
    pfxThumbprint: process.env.SP_PFX_THUMBPRINT ?? ''
  },
  sms: {
    apiKey: process.env.SMS_API_KEY || 'api key',
    url: process.env.SMS_URL || 'url to sms endpoint'
  },
  utenlandsreisende: {
    regionGroupsPrefix: process.env.UTENLANDSREISENDE_REGION_GROUPS_PREFIX || 'A-CA-REGION',
  },
  nodeEnv: process.env.NODE_ENV ?? 'dev',
  robotEmail: process.env.ROBOT_EMAIL ?? 'robot@robot.com',
  roomServiceTeamsWebhook: process.env.ROOMSERVICE_TEAMS_WEBHOOK_URL ?? 'teams.com'
}
