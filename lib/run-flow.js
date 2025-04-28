const parseXml = require('./jobs/parse-xml')
const parseJson = require('./jobs/parse-json')
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
  // dersom jobben vi sjekker også er den jobben vi venter på, så må vi sjekke om jobben vi venter på er klar
  // hvis vi venter på en jobb, så trenger vi ikke å sjekke noen andre jobber, der av false
  if (typeof flowStatus.waitingForJob === 'string' && flowStatus.waitingForJob !== jobName) {
    return false
  }

  if (jobName === 'finishFlow') {
    return !flowStatus.failed && !flowStatus[jobName]?.jobFinished
  }

  const isReadyForCheck = !flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished && checkCondition(flowDef[jobName], flowStatus, jobName)
  if (!isReadyForCheck) {
    return false
  }

  const runAfterTimestampFunction = flowDef[jobName]?.options?.runAfterTimestamp
  if (runAfterTimestampFunction) {
    if (typeof runAfterTimestampFunction === 'function') {
      const runAfterTimestamp = runAfterTimestampFunction(flowDef[jobName], flowStatus)
      if (runAfterTimestamp.toString() === 'Invalid Date') {
        logger('error', [`runAfterTimestampFunction did not return a valid timestamp in job ${jobName} with refId: ${flowStatus.refId}`])
        return false
      }
      const now = new Date()
      if (now < new Date(runAfterTimestamp)) {
        flowStatus.waitingForJob = jobName
        save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
          .catch((error) => logger('error', [`Failed to save flowStatus blob with refId: ${flowStatus.refId}. Scheisse, ting kan potensielt bli kjørt flere ganger`, error.toString()]))

        save(`${flowStatus.blobDir}/${flowStatus.refId}-run-after-timestamp-${runAfterTimestamp.replaceAll(':', '__')}.json`, JSON.stringify({ message: 'Denne filen vil ikke bli plukket opp og kjørt før runAfterTimestamp er passert' }, null, 2), blobOptions)
          .catch((error) => logger('error', [`Failed to save runAfterTimestamp blob with refId: ${flowStatus.refId}`, error.toString()]))

        logger('info', [`Job ${jobName} is not ready to run yet. Waiting until ${runAfterTimestamp}`, 'AcosId', flowStatus.acosId, 'AcosName', flowStatus.acosName, 'refId', flowStatus.refId])
        return false
      }

      logger('info', [`Job ${jobName} is now ready to run.`, 'AcosId', flowStatus.acosId, 'AcosName', flowStatus.acosName, 'refId', flowStatus.refId])
      delete flowStatus.waitingForJob
    } else {
      logger('error', [`runAfterTimestampFunction property in job ${jobName} is not a function`])
      return false
    }
  }

  return isReadyForCheck
}

const runCustomJobs = async (flowDef, flowStatus, jobName) => {
  const customJobs = Object.entries(flowDef).filter(entry => entry[0].startsWith('customJob') && entry[1].runAfter === jobName).map(entry => entry[0]) // henter aller customJobs som har runAfter lik jobName
  for (const customJobName of customJobs) { // resten håndteres likt som en predefinert jobb
    if (shouldRun(flowDef, flowStatus, customJobName)) {
      if (!flowStatus[customJobName]) flowStatus[customJobName] = { jobFinished: false }
      try {
        flowStatus[customJobName].startedTimestamp = new Date().toISOString()
        const result = await flowDef[customJobName].customJob(flowDef[customJobName], flowStatus) // men her trigger vi customJob fra flowDef istedenfor en job fra jobs-mappa. CustomJob blir da typisk steg i flowen som kun trengs i noen få skjemaflyter
        flowStatus[customJobName].finishedTimestamp = new Date().toISOString()
        flowStatus[customJobName].result = result
        flowStatus[customJobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        await handleFailedJob(customJobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, customJobName)
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

  const setupAndCheckJob = async (jobName, jobFunc, multipleJob = false) => {
    if (!multipleJob) {
      return await runJob(jobName, jobFunc)
    }

    const jobNamePrefix = jobName
    const multipleJobNames = Object.keys(flowDef).filter(prop => prop.startsWith(jobNamePrefix))
    for (const multipleJobName of multipleJobNames) {
      const jobDef = flowDef[multipleJobName]
      await runJob(multipleJobName, async () => jobFunc(jobDef))
    }
  }

  const runJob = async (jobName, jobFunc) => {
    if (shouldRun(flowDef, flowStatus, jobName)) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        flowStatus[jobName].startedTimestamp = new Date().toISOString()
        flowStatus[jobName].result = await jobFunc()
        flowStatus[jobName].finishedTimestamp = new Date().toISOString()
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        await handleFailedJob(jobName, flowStatus, error)
      }
    }
    await runCustomJobs(flowDef, flowStatus, jobName)
  }

  await setupAndCheckJob('parseXml', async () => parseXml(blobs, flowStatus))
  await setupAndCheckJob('parseJson', async () => parseJson(blobs, flowStatus, flowDef.parseJson))
  await setupAndCheckJob('syncElevmappe', async () => syncElevmappe(flowDef.syncElevmappe, flowStatus))
  await setupAndCheckJob('syncEnterprise', async () => syncEnterprise(flowDef.syncEnterprise, flowStatus))
  await setupAndCheckJob('syncPrivatePerson', async (jobDef) => syncPrivatePerson(jobDef, flowStatus), true)
  await setupAndCheckJob('syncEmployee', async () => syncEmployee(flowDef.syncEmployee, flowStatus))
  await setupAndCheckJob('handleProject', async () => handleProject(flowDef.handleProject, flowStatus))
  await setupAndCheckJob('handleCase', async () => handleCase(flowDef.handleCase, flowStatus))
  await setupAndCheckJob('archive', async () => archive(flowDef.archive, flowStatus))
  await setupAndCheckJob('signOff', async () => signOff(flowStatus))
  await setupAndCheckJob('closeCase', async () => closeCase(flowStatus))
  await setupAndCheckJob('sharepointGetListItem', async (jobDef) => sharepointGetListItem(jobDef, flowStatus), true)
  await setupAndCheckJob('sharepointList', async () => sharepointList(flowDef.sharepointList, flowStatus))
  await setupAndCheckJob('statistics', async () => statistics(flowDef.statistics, flowStatus))
  await setupAndCheckJob('groundControl', async () => groundControl(flowStatus))
  await setupAndCheckJob('failOnPurpose', async () => { throw new Error('Æ feeijla med vilje!') })
  await setupAndCheckJob('finishFlow', async () => finishFlow(flowDef.config, flowStatus))
  // Husk å sende inn jobDef dersom du skal kjøre multiple jobber (se sharepointGetListItem over her)
  return flowDef
}
