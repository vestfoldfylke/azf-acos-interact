const { logger } = require("@vestfoldfylke/loglady")
const { pureservice } = require("../config")
const { createTicket } = require("../lib/pureservice/call-create-ticket")

const getAdditionalData = (sender) => {
  /*
   * NOTE: Navn, Telefon and E_post from the schema is used for fetching/creating user in Pureservice.
   * Remove these, then the rest (if any) will be sent along as AdditionalData to Pureservice
   */
  const additionalData = JSON.parse(JSON.stringify(sender))
  delete additionalData.Navn
  delete additionalData.Telefon
  delete additionalData.E_post

  if (Object.keys(additionalData).length === 0) {
    logger.info("No additional data found")
    return null
  }

  logger.info("Additional data found")
  return additionalData
}

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseJson: {
    enabled: true,
    options: {
      mapper: (dialogData) => {
        const dialogueId = dialogData.Metadata.DialogueId.Value ?? "VFK-230"
        const sender = dialogData.DialogueInstance.Kontaktskjema?.Innsender
        const body = dialogData.DialogueInstance.Kontaktskjema?.Henvendelse

        if (!sender?.Navn) {
          throw new Error("Missing Kontaktskjema.Innsender.Navn in JSON file. There is something wrong")
        }

        if (!sender?.Telefon) {
          throw new Error("Missing Kontaktskjema.Innsender.Telefon in JSON file. There is something wrong")
        }

        if (!sender?.E_post) {
          throw new Error("Missing Kontaktskjema.Innsender.E_post in JSON file. There is something wrong")
        }

        if (!body?.Henvendelsen_gjelder) {
          throw new Error("Missing Kontaktskjema.Henvendelse.Henvendelsen_gjelder in JSON file. There is something wrong")
        }

        if (!body?.Skriv_sp\u00F8rsm\u00E5let) {
          throw new Error("Missing Kontaktskjema.Henvendelse.Skriv_sp\u00F8rsm\u00E5let in JSON file. There is something wrong")
        }

        return {
          AdditionalData: getAdditionalData(sender),
          OriginatingReference: dialogueId,
          TicketMetaData: {
            AssignedDepartmentName: "Bypakka", // NOTE: Dette er samhandlingssonen saken assosieres med - Avtales med PUS-generalene hva som skal brukes her. Kan være forskjellig fra skjema til skjema
            Description: body.Skriv_sp\u00F8rsm\u00E5let,
            PriorityName: "Normal", // NOTE: Dette er saksprioritet - Avtales med PUS-generalene hva som skal brukes her. Stort sett er nok dette "Normal"
            RequestTypeId: 1, // NOTE: Dette er alltid 1 for saksopprettelse
            SourceName: pureservice.defaultSource, // NOTE: Dette er sakskilden (Direkte, E-post, Selvbetjening, Telefon, Utstyrsportalen etc.) - Avtales med PUS-generalene hva som skal brukes her. Stort sett ønsker de "Selvbetjening" for saker opprettet fra ACOS skjemaer, da skal denne stå til pureservice.defaultSource
            StatusName: "Under arbeid", // NOTE: Dette er saksstatus - Avtales med PUS-generalene hva som skal brukes her. Stort sett er nok dette "Under arbeid"
            Subject: body.Henvendelsen_gjelder,
            TicketTypeName: "Forespørsel" // NOTE: Dette er sakstype - Avtales med PUS-generalene hva som skal brukes her. Kan være forskjellig fra skjema til skjema, spørs på assigned department. Stort sett er nok dette "Forespørsel"
          },
          User: {
            EmailAddress: sender.E_post,
            Name: sender.Navn,
            PhoneNumber: sender.Telefon
          }
        }
      }
    }
  },
  customJobCreateTicket: {
    enabled: true,
    runAfter: "parseJson",
    customJob: async (_jobDef, flowStatus) => {
      return await createTicket(flowStatus.parseJson.result.mapped)
    }
  },
  statistics: {
    enabled: true,
    options: {
      mapper: (_flowStatus) => {
        return {
          company: "Infrastruktur og veiforvaltning",
          department: "Infrastruktur",
          description: "Bypakke Tønsberg skjema - oppretter sak i Pureservice",
          type: "bypakke-tonsberg-pureservice" // Required. A short searchable type-name that distinguishes the statistic element
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
