const { logger } = require("@vestfoldfylke/loglady")
const { pureservice } = require("../../config")

module.exports.createTicket = async (payload) => {
  const endpoint = `${pureservice.apiUrl}/tickets/create`
  logger.info("Calling {Endpoint} for creating Pureservice ticket", endpoint)

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Functions-Key": pureservice.apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error("Failed to create Pureservice ticket. Status: {Status}, StatusText: {StatusText}, Response: {Response}", response.status, response.statusText, errorText)
    throw new Error(`Failed to create Pureservice ticket. Status: ${response.status}, StatusText: ${response.statusText}`)
  }

  const ticket = await response.json()
  logger.info("Successfully created Pureservice ticket")

  return ticket
}
