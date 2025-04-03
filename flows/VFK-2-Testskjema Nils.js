module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogueInstance) => {
        if (!dialogueInstance.Testskjema_for_?.Gruppa_øverst?.Fornavn) throw new Error('Missing Gruppa_øverst.Fornavn mangler i JSON filen')
        return {
          fornavn: dialogueInstance.Testskjema_for_.Gruppa_øverst.Fornavn
        }
      }
    }
  },
  groundControl: {
    enabled: true // Files will be copied to GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME, and will be downloaded on local server (./ground-control/index.js)
  },
  customJobCreateUtenlandsGreier: () => {
    // Dytter nødvendig informasjon til utenlandsgreier-blob storage, en annen løsning eller timerTrigger håndterer dette selv
  }












  customJobPrepareUtenlandsreise: {
    enabled: true,
    customJob: async () => {
      // Hent regiongrupper basert på landkode
      // Lage lette properties for å sjekke overlappende tidsrom
      // Skrelle vekk unødvendige properties fra flowStatus (fnr, navn, annen drit)
      // Denne jobben kjøres da med en gang skjemaet er avlevert, og dumme data vil ikke bli liggende i blobstorage
    }
  }

  // funksjon: GetUtlandStuff Lag en funksjon som henter alle regiongruppene, alle tidsrom for brukeren i de ulike regionene.

  customJobAddToGroup: {  
    enabled: true,
    runAfterTimestamp: '2023-10-01T00:00:00Z',
    customJob: async () => {
      // GetUtlandStuff
      // Hent alle region-gruppene - finn de gruppene den skal inn i
      // Legg inn i de den ikke er i allerede
      // Hva om det er flere overlappende skjemaer i samme regioner?
      // Legg til brukeren fra skjemaet i en regiongruppe
    }
  },
  customJobRemoveFromGroup: {
    enabled: true,
    runAfterTimestamp: '2025-10-01T00:00:00Z',
    customJob: async () => {
      // GetUtlandStuff
      // Fjern brukeren fra regiongruppen
      // He
      // For hver region den skal ut / inn av
      // Sjekk om brukeren er i regionen-gruppen
      // Fjern fra region om den er der
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
