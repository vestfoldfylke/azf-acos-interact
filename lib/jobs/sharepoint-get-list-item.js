/*
Må kjøre parseXml (da får vi metadata og filer)
Trenger data om sharePoint-lista (site, liste og filter)

Få inn filter via mapper-funksjonen
Validere at filter er gyldig
kjør en spørring mot liste med filteret
om det er flere enn ett element; hva gjør vi da?
Om det bare er ett element, returner ID til dette elementet

*/

const axios = require('axios').default
const { graph, nodeEnv } = require('../../config')
const { logger } = require('@vtfk/logger')
const getAccessToken = require('../get-entraid-token')
const { getListAndSiteIdAndName } = require('../graph-actions')

module.exports = async (jobDef, flowStatus) => {
  const mapper = jobDef.options?.mapper
  const itemSearch = {
    siteId: null,
    siteName: null,
    listId: null,
    listUr: null,
    searchFilter: null
  }
  if (mapper) {
    logger('info', ['sharePointGetListItem', 'Mapper is defined in options. Will use it.'])
    const { prodListUrl, testListUrl, searchFilter } = mapper(flowStatus)
    if (nodeEnv === 'production') {
      if (!prodListUrl) throw new Error('Aiaia, did you forget to set sharepoint-list prodListUrl??')
      const { siteId, listId, siteName } = await getListAndSiteIdAndName(prodListUrl)
      itemSearch.siteId = siteId
      itemSearch.siteName = siteName
      itemSearch.listId = listId
      itemSearch.listUrl = prodListUrl
      itemSearch.searchFilter = searchFilter
    } else {
      if (!testListUrl) throw new Error('Aiaia, did you forget to set sharepoint-list testListUrl??')
      const { siteId, listId, siteName } = await getListAndSiteIdAndName(testListUrl)
      itemSearch.siteId = siteId
      itemSearch.siteName = siteName
      itemSearch.listId = listId
      itemSearch.listUrl = testListUrl
      itemSearch.searchFilter = searchFilter
    }
  } else {
    logger('info', ['sharePointGetListItem', 'No mapper defined in options'])
    throw new Error('No mapper defined in options for sharepointList. Please provide a custom mapper in flow definition')
  }
  // vi validerer filteret: splitte filter på mellomrom for å få liste med alle elementer.
  const searchParts = itemSearch.searchFilter.replaceAll(' or ', '  ').replaceAll(' and ', '  ').replaceAll(' eq ', '  ').split('  ')
  let index = 0
  for (const searchPart of searchParts) {
    if (index % 2 === 0) {
      if (!searchPart.startsWith('fields/')) throw new Error('filter must be om the format "fields/{kolonnenavn} eq {verdi} [or | and] fields/{kolonnenavn} eq {verdi} osv"')
    }
    index++
  }
  const accessToken = await getAccessToken(graph.scope)
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly'
  }
  // for eksempel sånn her: ?expand=fields&filter=fields/Kommentar eq 'Han kan godt få iphone altsås' or fields/Etternavn eq 'Thvedt'
  const resource = `/sites/${itemSearch.siteId}/lists/${itemSearch.listId}/items?expand=fields&filter=${itemSearch.searchFilter}`
  const { data } = await axios.get(`${graph.url}/${resource}`, { headers })
  if (data.value.length === 0) throw new Error(`Fant ingen rad å oppdatere med filter: ${itemSearch.searchFilter}. ListURL: ${itemSearch.listUrl}`)
  logger('info', ['sharePointGetListItem', `Successfully found ${data.value.length} list items`])
  return data.value
}
