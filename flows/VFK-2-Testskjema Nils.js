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
  failOnPurpose: {
    enabled: false
  }
}
