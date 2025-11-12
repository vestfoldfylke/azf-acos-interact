const { logger } = require('@vestfoldfylke/loglady')
const { callArchive } = require('../call-archive')

module.exports = async (flowStatus) => {
  logger.info('closeCase: Closing case')

  const CaseNumber = flowStatus.handleCase?.result?.CaseNumber
  if (!CaseNumber) throw new Error('Could not find flowStatus.handleCase.result.CaseNumber. Did you remember to enable the handleCase job for the flow?')

  const payload = {
    service: 'CaseService',
    method: 'UpdateCase',
    parameter: {
      CaseNumber,
      Status: 'A'
    }
  }

  const data = await callArchive('archive', payload)
  logger.info('closeCase: Case closed {CaseNumber}', data.CaseNumber)
  return data
}
