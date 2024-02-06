(async () => {
  // First set local env
  const setEnv = require('./set-env-variables')
  setEnv()

  const { writeFileSync, existsSync, mkdirSync } = require('fs')
  const path = require('path')
  const jobToTest = require('../../lib/jobs/sharepoint-list') // Require the job you want to test

  const mockJobDef = { // Equivalent to the jobdef in the flowfile (e.g if you're testing syncEnterprise, this is the property syncEnterprise in the flowfile)
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Vedlegg%20for%20lrekandidater/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-Fylkesadministrasjonopplring-Listerfag-ogyrkesopplring/Lists/Vedlegg%20for%20lrekandidater/AllItems.aspx',
            uploadFormPdf: false,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Fnr.substring(0, 6) || 'Mangler fdato', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              L_x00e6_refag: xmlData.Egendefinert1,
              Doknr360: flowStatus.archive.result.DocumentNumber
            }
          }
        ]
      }
    }
  }
  const mockFlowStatus = {
    sharepointList: {},
    parseXml: { // Simply mocking that parseXml is finished and have data
      result: {
        ArchiveData: {
          Fnr: '12345678910', // Remember not to put personal data in mock files - these files are synced to git
          Fornavn: 'tull',
          Etternavn: 'ball',
          Egendefinert1: 'strikkefaget'
        },
        xmlFile: {
          name: '1302749_signertSkjema.xml',
          path: 'VFK0259/1302749/1302749_signertSkjema.xml',
          blobType: 'BlockBlob',
          createdOn: '2024-02-05T13:05:50.000Z',
          lastModified: '2024-02-05T13:05:50.000Z'
        },
        websakHodeXmlFile: {
          name: '68511_131134_800259_1302749_WEBSAK_HODE.xml',
          path: 'VFK0259/1302749/68511_131134_800259_1302749_WEBSAK_HODE.xml',
          blobType: 'BlockBlob',
          createdOn: '2024-02-05T13:05:50.000Z',
          lastModified: '2024-02-05T13:05:50.000Z'
        },
        files: [
          {
            name: 'Skjema.pdf',
            path: 'VFK0259/1302749/68511_131134_800259_1302749_WEBSAK_HODE.pdf',
            type: 'H',
            desc: 'Skjema.pdf'
          }
        ]
      }
    },
    archive: {
      result: {
        DocumentNumber: '24/12345-1'
      }
    }
  }
  try {
    const result = await jobToTest(mockJobDef, mockFlowStatus)
    if (!existsSync(path.join(__dirname, '/mock-results'))) mkdirSync(path.join(__dirname, '/mock-results'))
    writeFileSync(path.join(__dirname, `/mock-results/${__filename.slice(__dirname.length + 1, -3)}.json`), JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error when testing job', error.response?.data || error.stack || error.toString())
  }
})()
