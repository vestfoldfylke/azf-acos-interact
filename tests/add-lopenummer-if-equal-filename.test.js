const assert = require("node:assert")
const { describe, it } = require("node:test")
const { addLopenummerIfEqualFileName } = require("../lib/add-lopenummer-if-equal-filename")

const testFiles = [
  {
    _: "hei.pdf"
  },
  {
    _: "hade.pdf"
  },
  {
    _: "hu.png"
  },
  {
    _: "hei.pdf"
  },
  {
    _: "hei.pdf"
  },
  {
    _: "hei.pdf"
  },
  {
    _: "Nei.xml"
  }
]

const testFiles2 = [
  {
    _: "hei.pdf"
  },
  {
    _: "hade.pdf"
  },
  {
    _: "hu.png"
  }
]

const testFiles3 = [
  {
    _: "hei.pdf"
  },
  {
    _: "hade.tutut.pdf"
  },
  {
    _: "hu.png"
  },
  {
    _: "hei.pdf"
  },
  {
    _: "hade.tutut.pdf"
  },
  {
    _: "hei.pdf"
  }
]

describe("Checking if addLopenummer runs correct when", () => {
  it("4 hei.pdf are present in the list", () => {
    const addLopenummerResult = addLopenummerIfEqualFileName(testFiles)
    assert.strictEqual(addLopenummerResult[0]._, "hei_1.pdf")
    assert.strictEqual(addLopenummerResult[3]._, "hei_2.pdf")
    assert.strictEqual(addLopenummerResult[4]._, "hei_3.pdf")
    assert.strictEqual(addLopenummerResult[5]._, "hei_4.pdf")
  })
  it("No duplicate names are present in the list", () => {
    const addLopenummerResult = addLopenummerIfEqualFileName(testFiles2)
    assert.strictEqual(addLopenummerResult[0]._, "hei.pdf")
    assert.strictEqual(addLopenummerResult[1]._, "hade.pdf")
    assert.strictEqual(addLopenummerResult[2]._, "hu.png")
  })
  it("2 hei.pdf, and 2 hade.tutut.pdf are present in the list", () => {
    const addLopenummerResult = addLopenummerIfEqualFileName(testFiles3)
    assert.strictEqual(addLopenummerResult[0]._, "hei_1.pdf")
    assert.strictEqual(addLopenummerResult[3]._, "hei_2.pdf")
    assert.strictEqual(addLopenummerResult[1]._, "hade.tutut_1.pdf")
    assert.strictEqual(addLopenummerResult[4]._, "hade.tutut_2.pdf")
  })
})
