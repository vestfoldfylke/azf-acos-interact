const description = 'Sender til Sharepoint. Hver privatist som meldes inn i skjema blir en rad i lista.'
// const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueData) => {
        // if (!dialogueData.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
        }
      }
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const jsonData = flowStatus.parseJson.result.DialogueInstance
        const sharepointElements = []
        const kandidatliste = jsonData.Registrering_av_privatis.REGISTRERING_AV_PRIVATIS
        if (kandidatliste.length === 0) throw new Error('Ingen kandidat i JSON filen')
        for (const row of kandidatliste) {
          const sharepointFagElement = {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Registrereprivatister/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/V-UT-Fylkesadministrasjonutdanning-Eksamen-mottakdigitaleskjemaer/Lists/Registrereprivatister/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: `${flowStatus.parseJson.result.SavedValues.Login.FirstName} ${flowStatus.parseJson.result.SavedValues.Login.LastName}`,
              Telefon: jsonData.Informasjon3.Kontaktperson.Telefonnummer,
              E_x002d_post: jsonData.Informasjon3.Kontaktperson.E_post,
              Representasjon: jsonData.Informasjon3.Kontaktperson.Hvem_representerer_du_,
              Skole: jsonData.Informasjon3.Kontaktperson.Velg_riktig_skole2,
              Tiltak_x002f_ordning: jsonData.Informasjon3.Tiltak_ordning.Velg_type_tiltak_ordning,
              OT_x002d_avdeling: jsonData.Informasjon3.Kontaktperson.Velg_riktig_avdeling,
              Navnprivatist: `${row.Fornavn} ${row.Etternavn}`,
              E_x002d_postprivatist: row.Epost_til_bruk_,
              F_x00f8_dselsnummer: row.Fodselsnummer,
              Mobilprivatist: row.Mobiltelefonnum,
              Fagkode1: row.Fagkode_r_,
              S_x00e6_rskilttilrettelegging: row.Eventuelle_behov_for_til,
              Soningsanstalt: jsonData.Informasjon3.Kontaktperson.Representerer_soningsste,
              Eksamenssted: row.Eksamenssted,
              Oppmeldt_x0020_i_x0020_portalen: row.Oppmeldt_i_privatistport,
              Dokumentasjon: row.Dokumentasjon2
              // Dokumentnummeri360: flowStatus.archive.result.DocumentNumber || 'Ikke arkivert'
            }
          }
          sharepointElements.push(sharepointFagElement)
        }
        return sharepointElements
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Utdanning',
          department: 'Eksamen',
          description,
          type: 'Registrering av privatister under særskilt ordning' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          // tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          // documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
