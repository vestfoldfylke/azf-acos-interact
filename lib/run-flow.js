const parseXml = require('./jobs/parse-xml')
const syncElevmappe = require('./jobs/sync-elevmappe')
const syncEnterprise = require('./jobs/sync-enterprise')
const syncEmployee = require('./jobs/sync-employee')
const syncPrivatePerson = require('./jobs/sync-private-person')
const handleProject = require('./jobs/handle-project')
const handleCase = require('./jobs/handle-case')
const archive = require('./jobs/archive')
const signOff = require('./jobs/sign-off')
const closeCase = require('./jobs/close-case')
const sharepointGetListItem = require('./jobs/sharepoint-get-list-item')
const sharepointList = require('./jobs/sharepoint-list')
const groundControl = require('./jobs/ground-control')
const finishFlow = require('./jobs/finish-flow')
const statistics = require('./jobs/statistics')

const { logger, logConfig } = require('@vtfk/logger')
const { save } = require('@vtfk/azure-blob-client')
const { storageAccount, retryIntervalMinutes, willNotRunAgainFilename } = require('../config')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

/* Retries forklart

flowStatus.runs er antall ganger flowen HAR kjørt. Den inkrementeres hver gang et nytt forsøk er gjort
retryIntervals er en liste med hvor mange ganger vi skal prøve på nytt. Altså hvis lista er 3 lang, så skal vi totalt kjøre 4 ganger
For å slippe plusser og minuser legger vi derfor til et element først i retryIntervals for å representere den første kjøringen
Første kjøring er kjøring 1 - men runs inkrementeres ikke før vi er ferdige å prøve kjøringen.
Feilhåndteringen får så vite hvor mange ganger jobben er kjørt, og kan bruke flowStatus.runs som index for å sjekke hvor lenge vi skal vente til neste kjøring. Om (flowStatus.runs >= retryIntervals.length), så skal vi ikke prøve mer, og kan gi error-beskjed
Dispatcheren trenger så bare sjekke hvor mange ganger vi har kjørt - og om det er større eller likt antall ganger vi skal kjøre (retryIntervals.length siden den nå er like lang som antall ganger vi skal kjøre)

*/
const handleFailedJob = async (jobName, flowStatus, error) => {
  flowStatus.runs++
  const errorMsg = error.response?.data || error.stack || error.toString()
  flowStatus[jobName].error = errorMsg

  if (flowStatus.runs >= retryIntervalMinutes.length) {
    try {
      logger('error', ['Blob needs care and love', `Failed in job ${jobName}`, `Runs: ${flowStatus.runs}/${retryIntervalMinutes.length}. Will not run again. Reset flowStatus.runs to try again`, 'error:', errorMsg])
      await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
      await save(`${flowStatus.blobDir}/${flowStatus.refId}-${willNotRunAgainFilename}.json`, JSON.stringify({ message: 'Fiks flow-status.json og slett denne filen om du vil at dette skjemaet skal kjøres igjen' }, null, 2), blobOptions)
    } catch (error) {
      logger('error', ['Dritt og møkk... vi fikk ikke lagret flowStatus til bloben. Ting vil potensielt bli kjørt dobbelt opp', `jobben den stoppet på: ${jobName}`, 'Error', error.stack || error.toString()])
    }
    return
  }
  const minutesToWait = retryIntervalMinutes[flowStatus.runs]
  const now = new Date()
  flowStatus.nextRun = new Date(now.setMinutes(now.getMinutes() + minutesToWait)).toISOString()
  try {
    logger('warn', [`Failed in job ${jobName}`, `Runs: ${flowStatus.runs}/${retryIntervalMinutes.length}. Will retry in ${minutesToWait} minutes`, 'error:', errorMsg])
    await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
  } catch (error) {
    logger('error', ['Dritt og møkk... vi fikk ikke lagret flowStatus til bloben. Ting vil potensielt bli kjørt dobbelt opp', `jobben den stoppet på: ${jobName}`, 'Error', error.stack || error.toString()])
  }
}
const checkCondition = (jobDef, flowStatus, jobName) => {
  if (!jobDef.options?.condition) return true
  const runJob = jobDef.options.condition(flowStatus)
  logger('info', [`Running condition function for ${jobName}`, 'Result', runJob])
  return runJob
}

const shouldRun = (flowDef, flowStatus, jobName) => {
  if (jobName === 'finishFlow') {
    return !flowStatus.failed && !flowStatus[jobName]?.jobFinished
  }
  return !flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished && checkCondition(flowDef[jobName], flowStatus, jobName)
}

const runCustomJobs = async (flowDef, flowStatus, jobName) => {
  const customJobs = Object.entries(flowDef).filter(entry => entry[0].startsWith('customJob') && entry[1].runAfter === jobName).map(entry => entry[0]) // henter aller customJobs som har runAfter lik jobName
  for (const jobName of customJobs) { // resten håndteres likt som en predefinert jobb
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await flowDef[jobName].customJob(flowStatus) // men her trigger vi customJob fra flowDef istedenfor en job fra jobs-mappa. CustomJob blir da typisk steg i flowen som kun trengs i noen få skjemaflyter
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
}

module.exports = async (flowDef, flowStatus, blobs) => {
  // gå gjennom flowDef og kjøre alle jobbene som er definert i flowDef
  /*
  finne alle custom jobber i flowDef og kjøre disse på rett sted i flowen. Custom jobber er definert som async-funksjoner i flowDef. De må ha en funksjon som heter customJob.
  */
  logConfig({
    prefix: `azf-acos-interact - run-flow - ${flowStatus.acosId} - ${flowStatus.acosName} - ${flowStatus.refId}`
  })

  {
    const jobName = 'parseXml'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await parseXml(blobs, flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'syncElevmappe'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncElevmappe(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'syncEnterprise'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncEnterprise(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobNamePrefix = 'syncPrivatePerson'
    const syncPrivatePersonJobs = Object.keys(flowDef).filter(prop => prop.startsWith(jobNamePrefix))
    for (const jobName of syncPrivatePersonJobs) {
      if (shouldRun(flowDef, flowStatus, jobName)) {
        if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
        try {
          const result = await syncPrivatePerson(flowDef[jobName], flowStatus)
          flowStatus[jobName].result = result
          flowStatus[jobName].jobFinished = true
        } catch (error) {
          flowStatus.failed = true
          handleFailedJob(jobName, flowStatus, error)
        }
      }
      await runCustomJobs(flowDef, flowStatus, jobName)
    }
  }
  {
    const jobName = 'syncEmployee'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncEmployee(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'handleProject'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await handleProject(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'handleCase'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await handleCase(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'archive'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await archive(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'signOff'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await signOff(flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'closeCase'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await closeCase(flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'sharepointGetListItem'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await sharepointGetListItem(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'sharepointList'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await sharepointList(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }
  {
    const jobName = 'statistics'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await statistics(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'groundControl'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await groundControl(flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'failOnPurpose'
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        throw new Error('Æ feeijla med vilje!')
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'finishFlow' // Denne er alltid enabled. Sjekk shouldRun-funksjonen hvis du lurer
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await finishFlow(flowDef.config, flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        flowStatus.finished = false
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  return flowDef
}
