const description = "Registrering av digitale løsninger. SKal opprette rad i SP-liste"
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {}
  },
  /*
XML file from Acos:
ArchiveData {
string Etternavn
string Fornavn
string Sektor
string Seksjon
string Rolle
string Prosjekt
string Malgruppe
string Informasjonskanal
string Publiseringstidspunkt
string Budskap
string Kategori
string Kommentar
}
*/

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testSiteId: "2926bae9-d3fa-4c8d-8823-ee4166e3a565",
            testPath: "sites/BDK-BNFDigitaleLosninger/Lists/TESTProsjektinformasjon/AllItems.aspx",
            testListId: "23c2ce4d-d9ce-4ff1-90fa-a3f03550cde1",
            prodSiteId: "2926bae9-d3fa-4c8d-8823-ee4166e3a565",
            prodPath: "sites/BDK-BNFDigitaleLosninger/Lists/Prosjektinformasjon/AllItems.aspx",
            prodListId: "9e5ef50f-dec6-49cc-b615-31dc04e58ea3",
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Etternavn || "Mangler fnr", // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Seksjon_x002f_virksomhet: xmlData.Tilhorighet,
              Rolle: xmlData.Rolle,
              Prosjekt_x002f_arbeidsgruppe: xmlData.Prosjekt,
              M_x00e5_lgruppe: xmlData.Malgruppe,
              Informasjonskanal: xmlData.Informasjonskanal,
              Publiseringstidspunkt: xmlData.Publiseringstidspunkt,
              Budskap: xmlData.Budskap,
              Kategori: xmlData.Kategori,
              Kommentarfrainnsender: xmlData.Kommentar
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: "OF",
          department: "SKOLE",
          description,
          type: "Registrering av lærerstudenter", // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Sektor,
          Skole: xmlData.Seksjon,
          Prosjekt: xmlData.Prosjekt,
          Kategori: xmlData.Kategori
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
