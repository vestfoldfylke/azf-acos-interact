module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },

  // Fyller en eksisterende SP-liste med data fra Acos-skjema. Ett element i lista returnert fra mapper-funksjonen blir en rad i SP-lista, dvs at ett innsendt skjema blir en rad i SP-lista.
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorasisjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse
            }
          }
        ]
      }
    }
  },
  // Fyller to eksisterende SP-lister med data fra Acos-skjema. Ett element i lista returnert fra mapper-funksjonen blir en rad i hver SP-liste, dvs at ett innsendt skjema blir en rad i hver av SP-listene.
  sharepointList2: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorasisjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse
            }
          },
          {
            testListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil
            }
          }
        ]
      }
    }
  },

  // Fyller en eksisterende SP-liste med data fra Acos-skjema. Hvert element i lista returnert fra mapper-funksjonen blir en rad SP-lista, dvs at ett innsendt skjema blir like mange rader som faglista fra XML er lang i SP-lista.
  sharepointList3: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements = []
        const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            testSiteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            testPath: 'sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            testListId: '76d4a6be-73f1-4c6a-baeb-feadb2b2decc',
            prodSiteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            prodPath: 'sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListId: '76d4a6be-73f1-4c6a-baeb-feadb2b2decc',
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
              Fag: fag.Fagnavn
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
  },
  // Fyller en eksisterende SP-liste med flere rader basert på data fra Acos-skjema. Hvert element i lista returnert fra mapper-funksjonen blir en rad/element i den samme SP-lista, dvs at ett innsendt skjema blir flere rader i SP-listen.
  sharepointList4: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          // Først lager vi en rad i lista
          {
            testListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil
            }
          },
          // Og så en rad til i den samme lista
          {
            testListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            prodListUrl: 'https://vtfk.sharepoint.com/sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              EnKolonneSomIkkeErPåElementetViLaInnOVer: 'Kanskje dette elementet skulle ha annen data enn den over f.eks', // De to radene vi legger inn trenger altså ikke ha de samme kolonnenen, bare å slå seg løs :D
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: false,
    options: {
      enOption: true
    }
  },

  failOnPurpose: {
    enabled: true
  }
}
