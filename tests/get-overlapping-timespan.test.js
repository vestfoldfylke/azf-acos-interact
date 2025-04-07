const { getOverlappingRegionGroups } = require('../lib/utenlandsreisende/region-groups')

const defaultFlowStatus = () => ({
  entraUser: {
    userPrincipalName: 'test@vestfoldfylke.no',
    displayName: 'Test Testesen',
    id: '000c0000-0000-0000-0000-000000000000'
  },
  travel: {
    dateFrom: '2025-04-01',
    dateTo: '2099-04-04T10:35:00Z',
    countryCodes: [
      'BV',
      'ES'
    ],
    countries: 'Bouvet Island (BV), Spain (ES)'
  }
})

const defaultRegionGroups = () => [
  {
    id: '00000000-0000-0000-0000-000000000001',
    displayName: 'A-CA-REGION-KP',
    countryCodes: [
      'KP'
    ],
    countryCode: 'KP'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    displayName: 'A-CA-REGION-BT',
    countryCodes: [
      'BT'
    ],
    countryCode: 'BT'
  }
]

const defaultEntraUser = () => ({
  userPrincipalName: 'test2@vestfoldfylke.no',
  displayName: 'Test Testesen 2',
  id: '000d0000-0000-0000-0000-000000000000'
})

const now = new Date()

describe('Make sure we get empty arrays', () => {
  test('When this is not the user we seek', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(0)
  })

  test('When dateFrom has not passed', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    entraUser.id = flowStatus.entraUser.id
    flowStatus.travel.dateFrom = '2099-04-01'

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(0)
  })

  test('When dateTo has passed', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    entraUser.id = flowStatus.entraUser.id
    flowStatus.travel.dateTo = '1999-04-01'

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(0)
  })

  test('When there is no overlapping region groups', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    entraUser.id = flowStatus.entraUser.id

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(0)
  })
})

describe('Make sure we get overlapping region groups', () => {
  test('When there is an overlapping region group', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    entraUser.id = flowStatus.entraUser.id

    regionGroups[0].countryCodes.push('BV')

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(regionGroups[0].id)
  })

  test('When there is two overlapping region groups', () => {
    const flowStatus = defaultFlowStatus()
    const regionGroups = defaultRegionGroups()
    const entraUser = defaultEntraUser()

    entraUser.id = flowStatus.entraUser.id

    regionGroups[0].countryCodes.push('BV')
    regionGroups[1].countryCodes.push('ES')

    const result = getOverlappingRegionGroups(flowStatus, regionGroups, entraUser, now)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe(regionGroups[0].id)
    expect(result[1].id).toBe(regionGroups[1].id)
  })
})
