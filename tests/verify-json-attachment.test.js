const { verifyJsonAttachments } = require('../lib/verify-json-attachments')

describe('VerifyJsonAttachmnets works as expected when', () => {
  test('Both lists contain the same attachments', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2.png', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(verifyJsonAttachments(jsonAttachments, blobAttachments)).toBe(true)
  })
  test('Both lists contain the same attachments but blobs have running number', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file2', FileExtension: 'png' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2_1.png', type: 'V' },
      { name: 'file2_2.png', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(verifyJsonAttachments(jsonAttachments, blobAttachments)).toBe(true)
  })
  test('Both lists contain the same attachments but blobs have running number AND we have to seeemingly similar files, but extension is upper/lowercase', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file2', FileExtension: 'docx' },
      { FileName: 'file2', FileExtension: 'DocX' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2_1.png', type: 'V' },
      { name: 'file2_2.png', type: 'V' },
      { name: 'file2.docx', type: 'V' },
      { name: 'file2_2.DocX', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(verifyJsonAttachments(jsonAttachments, blobAttachments)).toBe(true)
  })
  test('JsonAttachment is missing one attachment', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2_1.png', type: 'V' },
      { name: 'file2_2.png', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(() => verifyJsonAttachments(jsonAttachments, blobAttachments)).toThrow()
  })
  test('BlobAttachment is missing one attachment', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file3', FileExtension: 'docx' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2_1.png', type: 'V' },
      { name: 'file2_2.png', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(() => verifyJsonAttachments(jsonAttachments, blobAttachments)).toThrow()
  })
  test('JsonAttahchment extension does not match blobAttahcment extension in casing', () => {
    const jsonAttachments = [
      { FileName: 'file1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'png' },
      { FileName: 'file3', FileExtension: 'PNG' }
    ]
    const blobAttachments = [
      { name: 'file1.pdf', type: 'V' },
      { name: 'file2.png', type: 'V' },
      { name: 'file3.png', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(() => verifyJsonAttachments(jsonAttachments, blobAttachments)).toThrow()
  })
  test('JsonAttahchment extension does not match blobAttahcment extension in casing', () => {
    const jsonAttachments = [
      { FileName: 'file2_1', FileExtension: 'pdf' },
      { FileName: 'file2', FileExtension: 'pdf' }
    ]
    const blobAttachments = [
      { name: 'file2.pdf', type: 'V' },
      { name: 'Skjema.pdf', type: 'H' }
    ]
    expect(() => verifyJsonAttachments(jsonAttachments, blobAttachments)).toThrow()
  })
})
