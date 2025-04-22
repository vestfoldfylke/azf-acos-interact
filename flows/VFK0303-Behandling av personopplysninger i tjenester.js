const description = 'Behandling av personopplysninger i tjenester'
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = [
          {
            testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/DigitalutviklingiVestfoldskolen-Forvaltningsteamlringsressurserogfagsystem/Lists/Behandling%20av%20personopplysninger%20i%20tjenester/AllItems.aspx',
            prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/DigitalutviklingiVestfoldskolen-Forvaltningsteamlringsressurserogfagsystem/Lists/Behandling%20av%20personopplysninger%20i%20tjenester/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.orgNavn || 'Mangler navn', // husk å bruke internal name på kolonnen
              Organisasjonsnummer: xmlData.orgnr,
              Navn_x0020_p_x00e5__x0020_tjenes: xmlData.navnTjeneste,
              Nettadresse: xmlData.urlTjeneste,
              L_x00e6_ringsressurs: xmlData.laeringsressurs === 'true', // ja/nei-felt i SP
              Fagsystem: xmlData.fagsystem === 'true', // ja/nei-felt i SP,
              Samhandlingstjeneste: xmlData.samhandlingstjeneste === 'true', // ja/nei-felt i SP,
              Kontaktperson_x0020__x002d__x002: xmlData.kontaktpersonNavn,
              Kontaktperson_x0020__x002d__x0020: xmlData.kontaktpersonTelefon,
              Kontaktperson_x0020__x002d__x0021: xmlData.kontaktpersonEpost,
              Kontakt_x0020_ved_x0020_sikkerhe: xmlData.sikkerhetsbruddTelefon,
              epost_x0020_ved_x0020_sikkerhets: xmlData.sikkerhetsbruddEpost,
              Personvernombud: xmlData.personvernombud,
              Autentiseringsmetode: xmlData.autentiseringsmetode,
              Autentiseringsmetode_x0020_Annet: xmlData.autentiseringsmetodeAnnet,
              Kilde_x0020_til_x0020_personoppl: xmlData.kildeTilPersonopplysningene,
              Annen_x0020_kilde: xmlData.kildeTilPersonopplysningeneAnnet,
              Kategorier_x0020_av_x0020_person: xmlData.kategorierAvPersonopplysninger,
              Kategorier_x0020_av_x0020_regist: xmlData.kategorierAvRegistrerte,
              Egne_x0020_form_x00e5_l_x0020__x: xmlData.egneFOrmal,
              Innenfor_x0020_E_x00d8_S: xmlData.innenforEos === 'true', // ja/nei-felt i SP,
              Utenfor_x0020_E_x00d8_S: xmlData.utenforEos === 'true', // ja/nei-felt i SP,
              Land_x0020_utenfor_x0020_E_x00d8: xmlData.utenforEosLand,
              Underdatabehandlere: xmlData.underdatabehandlereSomStreng,
              Dokumentasjon_x0020_p_x00e5__x00: xmlData.dokumentasjonPaStyringssystem,
              _x00c5_rsak_x0020_til_x0020_udok: xmlData.dokumentasjonPaStyringssystemArsak,
              Automatiske_x0020_sletterutiner: xmlData.automatiskeSletterutiner,
              Individuelle_x0020_sletterutiner: xmlData.individuelleSletterutiner,
              Innebygget_x0020_sporingsteknolo: xmlData.innebyggetSporingsteknologi,
              Sporingsteknologi_x0020_spesifis: xmlData.innebyggetSporingsteknologiSpesifisert,
              Brukes_x0020_opplysninger_x0020_: xmlData.brukesOpplysningeneTilUtviklingsformal
            }
          }
        ]
        if (xmlData.underdatabehandlere?.underdatabehandler) {
          const liste = Array.isArray(xmlData.underdatabehandlere.underdatabehandler) ? xmlData.underdatabehandlere.underdatabehandler : [xmlData.underdatabehandlere.underdatabehandler] // Sjekker om det er mer enn ett tilbud i lista (altså et array). Hvis ikke lag et array med det ene elementet
          for (const rad of liste) {
            const sharepointElement = {
              testListUrl: 'https://vestfoldfylke.sharepoint.com/sites/DigitalutviklingiVestfoldskolen-Forvaltningsteamlringsressurserogfagsystem/Lists/Underleverandrer%20i%20tjenester/AllItems.aspx',
              prodListUrl: 'https://vestfoldfylke.sharepoint.com/sites/DigitalutviklingiVestfoldskolen-Forvaltningsteamlringsressurserogfagsystem/Lists/Underleverandrer%20i%20tjenester/AllItems.aspx',
              uploadFormPdf: true,
              uploadFormAttachments: false,
              fields: {
                Title: rad.navn || 'Mangler title', // husk å bruke internal name på kolonnen
                Organisasjonsnummer: rad.orgnr,
                Adresse: rad.adresse,
                Beskrivelse: rad.beskrivelse,
                Lokasjon: rad.lokasjon,
                Kontaktinformasjon: rad.kontaktinformasjon,
                S_x00e6_rlig_x0020_kategorier: rad.sarligKategorier === 'Ja', // ja/nei-felt i SP,
                Tilh_x00f8_rer_x0020_tjeneste: xmlData.navnTjeneste,
                tilh_x00f8_rer_x0020_databehandl: xmlData.orgNavn
              }
            }
            sharepointElements.push(sharepointElement)
          }
        }
        return sharepointElements
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
          department: 'Opplæring',
          description, // Required. A description of what the statistic element represents
          type: 'Behandling av personopplysninger i tjenester' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
        }
      }
    }
  }
}
