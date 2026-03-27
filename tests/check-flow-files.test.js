const assert = require("node:assert")
const { describe, it } = require("node:test")
const { mapFlowFile } = require("../lib/dispatcher")
const { readdirSync } = require("node:fs")

describe("Checking flowfile", () => {
  const schemaNames = readdirSync("./flows").map((filename) => mapFlowFile(filename)).filter((flow) => flow.filename.endsWith(".js"))
  for (const flow of schemaNames) {
    it(`${flow.filename} has config and parseXml or parseJson is enabled`, () => {
      const file = require(flow.filepath)
      assert.ok(file.config)
      assert.ok(file.parseXml || file.parseJson)
      assert.ok(file.parseXml?.enabled || file.parseJson?.enabled)
    })
  }
  for (const flow of schemaNames) {
    describe(`${flow.filename} - customJobs are set up correctly`, () => {
      const file = require(flow.filepath)
      const customJobs = Object.entries(file).filter((entry) => entry[0].startsWith("customJob") && entry[1].enabled)
      if (customJobs.length > 0) {
        for (const [key, value] of customJobs) {
          it(`${key} have runAfter and runAfterJob exists and is enabled`, () => {
            assert.ok(value.runAfter)
            assert.ok(file[value.runAfter])
            assert.ok(file[value.runAfter].enabled)
          })
          it(`${key} has a valid runAfter job`, () => {
            assert.strictEqual(["statistics", "finishFlow", "failOnPurpose"].includes(value.runAfter), false)
          })
        }
      } else {
        it("No customJobs", () => {
          assert.strictEqual(customJobs.length, 0)
        })
      }
    })
  }
})
