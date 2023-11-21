const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (flowStatus) => {
  logger('info', ['closeCase', 'Closing case'])

  const caseNumber = flowStatus.handleCase?.result?.CaseNumber
  if (!caseNumber) throw new Error('Could not find flowStatus.handleCase.result.CaseNumber. Did you remember to enable the handleCase job for the flow?')

  const payload = {
    system: 'archive',
    template: 'close-case',
    parameter: {
      caseNumber
    }
  }

  const data = await callArchive('archive', payload)
  logger('info', ['closeCase', 'Case closed', data.CaseNumber])
  return data
}
