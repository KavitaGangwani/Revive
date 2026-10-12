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

// Draw ice-blue ring (#AFDDFF => R: 175, G: 221, B: 255)
function makeRingPixelRenderer(size) {
  const center = (size - 1) / 2
  const outerR = size * (9.0 / 24)
  const innerR = size * (2.8 / 24)
  const ringWidth = (outerR - innerR) / 2
  const midR = (outerR + innerR) / 2

  return (x, y) => {
    const dx = x - center
    const dy = y - center
    const dist = Math.sqrt(dx * dx + dy * dy)
    const diff = Math.abs(dist - midR)

    if (diff <= ringWidth + 0.5) {
      let alpha = 1
      if (diff > ringWidth - 0.5) {
        alpha = ringWidth + 0.5 - diff
      }
      return [175, 221, 255, Math.round(Math.max(0, Math.min(1, alpha)) * 255)]
    }
    return [0, 0, 0, 0]
  }
}

const assetsDir = path.join(__dirname, '../assets')
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true })
}

const icon16 = createPng(16, 16, makeRingPixelRenderer(16))
const icon32 = createPng(32, 32, makeRingPixelRenderer(32))

fs.writeFileSync(path.join(assetsDir, 'tray.png'), icon16)
fs.writeFileSync(path.join(assetsDir, 'tray@2x.png'), icon32)
console.log('Tray icons generated successfully.')
