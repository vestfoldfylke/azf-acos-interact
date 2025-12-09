const description = 'Krav om refusjon - tannhelse'
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
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
        let eier
        let totalKm = 0
        let totalUtleggKr = 0
        let antallPosterSkyss = 0
        let antallPosterUtlegg = 0
        if (jsonData.Utlegg_for_tann.Refusjon.Hvem_eier_konto === 'Pasienten') {
          eier = 'Pasient'
        } else {
          eier = 'Innsender'
        }
        const skyssList = jsonData.Skyss.Utgifter_skyss1
        const utleggList = jsonData.Utlegg.Utgifter_tannbe1
        if (skyssList.length === 1 && skyssList[0].Totalt_antall_k1 === null) {
          antallPosterSkyss = 0
        } else {
          antallPosterSkyss = skyssList.length
        }
        if (utleggList.length === 1 && utleggList[0].Beløp1 === null) {
          antallPosterUtlegg = 0
        } else {
          antallPosterUtlegg = utleggList.length
        }
        for (const row of skyssList) {
          totalKm += Number(row.Totalt_antall_k1)
        }
        for (const row of utleggList) {
          totalUtleggKr += Number(row.Beløp1)
        }
        return [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse-Utleggshndtering/Lists/Refusjontannbehandlingogskyss/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/OPT-TAN-Tannhelse-Utleggshndtering/Lists/Refusjontannbehandlingogskyss/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: flowStatus.parseJson.result.SavedValues.Login.LastName || 'Mangler navn', // husk å bruke internal name på kolonnen
              Fornavn: flowStatus.parseJson.result.SavedValues.Login.FirstName,
              Adresse: flowStatus.parseJson.result.SavedValues.Login.Address,
              Postnummer: flowStatus.parseJson.result.SavedValues.Login.PostalCode,
              Poststed: flowStatus.parseJson.result.SavedValues.Login.PostalArea,
              F_x00f8_dselsnummer: 'se PDF',
              S_x00f8_ker_x0020_om: jsonData.Utlegg_for_tann.Refusjon.Jeg_vil_søke_om,
              Meg_x0020_selv_x0020_eller_x0020: jsonData.Utlegg_for_tann.Refusjon.Søker_du_refusj,
              Kontonummer: jsonData.Utlegg_for_tann.Refusjon.Bankkontonummer,
              Eier_x0020_av_x0020_konto: eier,
              Pasient: `${jsonData.Utlegg_for_tann.Pasient.Etternavn2}, ${jsonData.Utlegg_for_tann.Pasient.Fornavn2}`,
              Pasientens_x0020_adresse: `${jsonData.Utlegg_for_tann.Pasient.Adresse2}, ${jsonData.Utlegg_for_tann.Pasient.Postnummer2} ${jsonData.Utlegg_for_tann.Pasient.Poststed2}`,
              Pasientens_x0020_f_x00f8_dselsnu: 'se PDF',
              Antall_x0020_poster_x0020_skyss: antallPosterSkyss,
              Totalt_x0020_antall_x0020_km: totalKm,
              Antall_x0020_poster_x0020_utlegg: antallPosterUtlegg,
              Totalt_x0020_utlegg_x0020_kroner: totalUtleggKr,
              Klinikk: flowStatus.parseJson.result.SavedValues.Dataset.Hvilken_tannkli.Klinikk,
              Klinikkleder: flowStatus.parseJson.result.SavedValues.Dataset.Hvilken_tannkli.Klinikkleder,
              Ansvar: flowStatus.parseJson.result.SavedValues.Dataset.Hvilken_tannkli.Ansvar
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring og tannhelse',
          department: 'Tannhelse',
          description, // Required. A description of what the statistic element represents
          type: 'Krav om refusjon' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
