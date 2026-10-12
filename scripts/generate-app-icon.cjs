const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function createPng(width, height, drawPixel) {
  const rowLength = width * 4 + 1
  const rawData = Buffer.alloc(rowLength * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength
    rawData[rowOffset] = 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y)
      const pixelOffset = rowOffset + 1 + x * 4
      rawData[pixelOffset] = r
      rawData[pixelOffset + 1] = g
      rawData[pixelOffset + 2] = b
      rawData[pixelOffset + 3] = a
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function createChunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const body = Buffer.concat([typeBuf, data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body), 0)
    return Buffer.concat([len, typeBuf, data, crc])
  }

  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i]
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
      }
    }
    return (c ^ 0xffffffff) >>> 0
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const ihdrChunk = createChunk('IHDR', ihdr)
  const idatChunk = createChunk('IDAT', compressed)
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// Draw dark rounded base + ice-blue ring (#AFDDFF)
function makeAppIconRenderer(size) {
  const center = (size - 1) / 2
  const outerR = size * 0.38
  const innerR = size * 0.22
  const midR = (outerR + innerR) / 2
  const ringWidth = (outerR - innerR) / 2

  return (x, y) => {
    const dx = x - center
    const dy = y - center
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Base circle
    if (dist <= size * 0.46) {
      const diff = Math.abs(dist - midR)
      if (diff <= ringWidth + 1.0) {
        let alpha = 1.0
        if (diff > ringWidth - 1.0) {
          alpha = (ringWidth + 1.0 - diff) / 2.0
        }
        return [175, 221, 255, Math.round(Math.max(0, Math.min(1, alpha)) * 255)]
      }
      return [2, 4, 7, 255]
    }
    return [0, 0, 0, 0]
  }
}

function createIcoFromPng(pngBuffer, width, height) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type: 1 = ICO
  header.writeUInt16LE(1, 4) // Count of images: 1

  // Directory entry: 16 bytes
  const entry = Buffer.alloc(16)
  entry.writeUInt8(width === 256 ? 0 : width, 0) // Width (0 means 256)
  entry.writeUInt8(height === 256 ? 0 : height, 1) // Height (0 means 256)
  entry.writeUInt8(0, 2) // Color count
  entry.writeUInt8(0, 3) // Reserved
  entry.writeUInt16LE(1, 4) // Color planes
  entry.writeUInt16LE(32, 6) // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8) // Size of image data
  entry.writeUInt32LE(22, 12) // Offset of image data (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer])
}

const assetsDir = path.join(__dirname, '../assets')
const png256 = createPng(256, 256, makeAppIconRenderer(256))
const ico = createIcoFromPng(png256, 256, 256)

fs.writeFileSync(path.join(assetsDir, 'icon.png'), png256)
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico)
console.log('App icon (icon.png and icon.ico) created successfully.')
