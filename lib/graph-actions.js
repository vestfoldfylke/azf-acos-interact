const getEntraIdToken = require('./get-entraid-token')
const axios = require('axios').default
const { graph: { url, scope } } = require('../config')
const { logger } = require('@vestfoldfylke/loglady')
const Cache = require('file-system-cache').default

const fileCache = Cache({
  basePath: './.file-cache' // (optional) Path where cache files are stored (default).
})

const baseurl = url.replace('/v1.0', '') // Wonky tonky way of getting graph baseurl - it comes from config on the format https://graph.microsoft.com/v1.0

/**
 * Function for calling graph.
 *
 * @param {string} resource - Which resource to request e.g "users?$select=displayName"
 * @param {object} [options] - Options for the request
 * @param {boolean} [options.beta] - If you want to use the beta api
 * @param {string} [options.method] - If you want to use another http-method than GET (GET is default)
 * @param {object} [options.body] - If you want to post a http request body
 * @param {boolean} [options.advanced] - If you need to use advanced query against graph
 * @param {boolean} [options.isNextLink] - If the resource is a nextLink (pagination)
 * @param {string} [options.responseType] - If you need a specific responseType (e.g. stream)
 * @return {object} Graph result
 *
 * @example
 *     await singleGraphRequest('me/calendars?filter="filter',  { beta: false, advanced: false })
 */
const singleGraphRequest = async (resource, options = { method: 'get', body: {} }) => {
  if (!resource) throw new Error('Required parameter "resource" is missing')
  let { beta, advanced, body, method } = options ?? {}

  if (!method) {
    method = 'get'
  }

  const token = await getEntraIdToken(scope)
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json;odata.metadata=minimal;odata.streaming=true',
    'accept-encoding': null
  }

  if (advanced) {
    headers.ConsistencyLevel = 'eventual'
  }

  const url = options.isNextLink
    ? resource
    : `${baseurl}/${beta ? 'beta' : 'v1.0'}/${resource}`

  const axiosOptions = { headers, timeout: 10000 }
  if (options.responseType) {
    axiosOptions.responseType = options.responseType
  }

  const { data } = ['post', 'put', 'patch'].includes(method)
    ? await axios[method](url, body, axiosOptions)
    : await axios[method](url, axiosOptions)
  logger.info('singleGrpahRequest - got data')
  return data
}

/**
 * Function for calling graph and continuing if result is paginated.
 *
 * @param {string} resource - Which resource to request e.g "users?$select=displayName"
 * @param {object} [options] - Options for the request
 * @param {boolean} [options.beta] - If you want to use the beta api
 * @param {boolean} [options.advanced] - If you need to use advanced query against graph
 * @param {boolean} [options.onlyFirstPage] - If you only want to return the first page of the result
 * @return {object} Graph result
 *
 * @example
 *     await pagedGraphRequest('me/calendars?filter="filter',  { beta: false, advanced: false, queryParams: 'filter=DisplayName eq "Truls"' })
 */
const pagedGraphRequest = async (resource, options = {}) => {
  const { onlyFirstPage } = options ?? {}
  const retryLimit = 3
  let page = 0
  let finished = false
  const result = {
    count: 0,
    value: []
  }
  while (!finished) {
    let retries = 0
    let res
    let ok = false
    while (!ok && retries < retryLimit) {
      try {
        res = await singleGraphRequest(resource, options)
        ok = true
        page++
      } catch (error) {
        retries++
        if (retries === retryLimit) {
          logger.errorException(error, 'ÅNEI, nå har vi feilet {retries} ganger. Vi prøver ikke mer...', retries)
          throw error
        } else {
          logger.warn('ÅNEI, graph feila {retries} ganger, prøver igjen...', retries)
        }
      }
    }
    logger.info('pagedGprahRequest - Got {elements} elements from page {page}, will check for MutationRecord.', res.value.length, page)
    finished = res['@odata.nextLink'] === undefined
    resource = res['@odata.nextLink']
    options.isNextLink = true
    result.value = result.value.concat(res.value)
    // for only fetching a little bit
    if (onlyFirstPage) {
      logger.info('pagedGraphRequest - onlyFirstPage is set to true, breaking after first page - enjoying your testing! 😁')
      finished = true
    }
  }
  result.count = result.value.length
  logger.info('pagedGraphRequest - finished fetching pages. Found a total of {count} elements', result.count)
  return result
}

const getWebUrlParts = (webUrl) => {
  if (webUrl.endsWith('/')) webUrl = webUrl.substring(0, webUrl.length - 1)
  if (!webUrl.includes('/sites/') || !webUrl.startsWith('https://')) throw new Error(`url is not valid: ${webUrl}, must be on format https://{tenant}.sharepoint.com/sites/{sitename}/Lists/{listName}/AllItems.aspx`)
  const parts = webUrl.replace('https://', '').split('/')
  if (parts.length < 5) throw new Error(`url is not valid: ${webUrl}, must be on format https://{tenant}.sharepoint.com/sites/{sitename}/Lists/{listName}/AllItems.aspx`)
  const domain = parts[0]
  if (!domain.includes('.sharepoint.com')) throw new Error(`url is not valid: ${webUrl}, must be on format https://{tenant}.sharepoint.com/sites/{sitename}/Lists/{listName}/AllItems.aspx`)
  const tenantName = domain.split('.')[0]
  const siteName = parts[2]
  const listName = parts[4]
  const cleanWebUrl = `https://${domain}/sites/${siteName}/Lists/${listName}`
  return {
    domain,
    tenantName,
    siteName,
    listName,
    cleanWebUrl
  }
}

const getListAndSiteIdAndName = async (webUrl) => {
  // Check if we have it in filecache (cache that remains between runs, unlike node-cache)
  const cacheKey = `listAndSiteId-${webUrl}`
  const listAndSiteIdCache = fileCache.getSync(cacheKey)
  if (listAndSiteIdCache) {
    logger.info('Found list and site id in cache, quick returning for {webUrl}', webUrl)
    return listAndSiteIdCache
  }

  const { siteName, domain, listName, cleanWebUrl } = getWebUrlParts(webUrl)
  const siteListsResource = `sites/${domain}:/sites/${siteName}:/lists`
  const siteLists = (await pagedGraphRequest(siteListsResource)).value

  const list = siteLists.find(list => list.webUrl === cleanWebUrl)
  if (!list) throw new Error(`No list or library found on webUrl: ${webUrl}, sure you got it right?`)
  if (!list.parentReference?.siteId) throw new Error(`No site found on webUrl: ${webUrl}, sure you got it right?`)
  const listId = list.id
  const siteId = list.parentReference.siteId.split(',')[1]

  const returnObject = { siteId, listId, siteName, listName }

  fileCache.setSync(`listAndSiteId-${webUrl}`, returnObject)

  return returnObject
}

module.exports = { pagedGraphRequest, singleGraphRequest, getWebUrlParts, getListAndSiteIdAndName }
