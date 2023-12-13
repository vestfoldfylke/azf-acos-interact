const description = 'Arkivering av testdokument og opprettelse av et listeelement i SP.'

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i 360 (Her: elevmappa)
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const { nodeEnv, robotEmail } = require('../config')
        return {
          system: 'acos',
          template: 'elevdocument-default',
          parameter: {
            organizationNumber: xmlData.AnsVirksomhet,
            documentDate: new Date().toISOString(),
            caseNumber: elevmappe.CaseNumber,
            studentName: `${xmlData.Fornavn} ${xmlData.Etternavn}`,
            responsibleEmail: nodeEnv === 'production' ? xmlData.AnsEpost : robotEmail,
            accessGroup: xmlData.Tilgangsgruppe,
            studentSsn: xmlData.Fnr,
            base64,
            documentTitle: 'Påmelding til nettundervisning',
            attachments
          }
        }
      }
    }

  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            path: 'sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            listId: '76d4a6be-73f1-4c6a-baeb-feadb2b2decc',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavnelev: xmlData.Fornavn,
              Etternavnelev: xmlData.Etternavn,
              Fylke: xmlData.Fylke,
              Skole: xmlData.Skole,
              Elevensmobilnr_x002e_: xmlData.Mobilnr,
              Elevensadresse: xmlData.Adresse,
              Elevenspostnr_x002e_: xmlData.Postnr,
              Elevenspoststed: xmlData.Poststed,
              Elevense_x002d_post: xmlData.Epost,
              Utfyltav: xmlData.UtfyltAv,
              Kontaktpersonensfornavn: xmlData.KontaktpersonFornavn,
              Kontaktpersonensetternavn: xmlData.KontaktpersonEtternavn,
              Foresatt1fornavn: xmlData.Foresatt1fornavn,
              Foresatt1etternavn: xmlData.Foresatt1Etternavn,
              Foresatt1mobilnr_x002e_: xmlData.Foresatt1Mobilnr,
              Foresatt1e_x002d_post: xmlData.Foresatt1Epost,
              Foresatt1adresse: xmlData.Foresatt1Adresse,
              Foresatt1postnr_x002e_: xmlData.Foresatt1Postnr,
              Foresatt1poststed: xmlData.Foresatt1Poststed,
              Foresatt2fornavn: xmlData.Foresatt2fornavn,
              Foresatt2etternavn: xmlData.Foresatt2Etternavn,
              Foresatt2mobilnr_x002e_: xmlData.Foresatt2Mobilnr,
              Foresatt2e_x002d_post: xmlData.Foresatt2Epost,
              Foresatt2adresse: xmlData.Foresatt2Adresse,
              Foresatt2postnr_x002e_: xmlData.Foresatt2Postnr,
              Foresatt2poststed: xmlData.Foresatt2Poststed,
              Fylkeskommunensfakturaadresse: xmlData.Fakturaadresse,
              Skolensfakturainformasjon: xmlData.Fakturainformasjon,
              Fag: fag.Fagnavn
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OF',
          department: 'Nettskolen',
          description, // Required. A description of what the statistic element represents
          type: 'Nettskolen påmelding nettundervisning', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          Fylke: xmlData.Fylke,
          Skole: xmlData.Skole
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
