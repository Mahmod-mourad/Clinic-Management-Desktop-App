/**
 * Generates app icons (PNG, ICO, ICNS) from scratch using pure Node.js.
 * Run: node tools/generate-icons.js
 */
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const RESOURCES = path.join(__dirname, '..', 'resources')
fs.mkdirSync(RESOURCES, { recursive: true })

// ─── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ─── PNG writer ───────────────────────────────────────────────────────────────
function makePNG(size, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const tb  = Buffer.from(type, 'ascii')
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const c   = crc32(Buffer.concat([tb, data]))
    const cb  = Buffer.alloc(4); cb.writeUInt32BE(c)
    return Buffer.concat([len, tb, data, cb])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA

  const rows = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0  // filter = None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size)
      const off = y * (size * 4 + 1) + 1 + x * 4
      rows[off] = r; rows[off+1] = g; rows[off+2] = b; rows[off+3] = a
    }
  }

  const idat = zlib.deflateSync(rows, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ─── Icon design ─────────────────────────────────────────────────────────────
// Teal-blue rounded square + white medical cross
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function pixelFn(x, y, S) {
  const cx = S / 2, cy = S / 2
  const r  = S * 0.42   // outer radius of rounded square
  const cr = S * 0.18   // corner rounding

  // ── Rounded square test ──────────────────────────────────────────────────
  const dx = Math.max(0, Math.abs(x - cx) - (r - cr))
  const dy = Math.max(0, Math.abs(y - cy) - (r - cr))
  const dist = Math.sqrt(dx*dx + dy*dy)

  // Anti-aliased edge
  const edge = dist - cr
  const alpha = Math.round(Math.max(0, Math.min(1, 0.5 - edge)) * 255)
  if (alpha === 0) return [0, 0, 0, 0]

  // ── Background gradient (top-left bright → bottom-right dark) ────────────
  const t = (x + y) / (2 * S)
  const bg = [lerp(14, 2, t), lerp(165, 132, t), lerp(233, 199, t)]  // sky-blue

  // ── White medical cross ───────────────────────────────────────────────────
  const armW = S * 0.14   // arm width
  const armL = S * 0.52   // arm length (half)

  const inH = Math.abs(x - cx) < armW / 2 && Math.abs(y - cy) < armL / 2  // vertical arm
  const inV = Math.abs(y - cy) < armW / 2 && Math.abs(x - cx) < armL / 2  // horizontal arm
  const inCross = inH || inV

  // Slight shadow/depth on cross
  if (inCross) {
    const crossAlpha = Math.min(alpha, 255)
    return [255, 255, 255, crossAlpha]
  }

  // Subtle inner shadow near cross edges (depth effect)
  const nearCrossH = Math.abs(x - cx) < armW / 2 + 2 && Math.abs(y - cy) < armL / 2 + 2
  const nearCrossV = Math.abs(y - cy) < armW / 2 + 2 && Math.abs(x - cx) < armL / 2 + 2
  const nearCross  = (nearCrossH || nearCrossV) && !inCross

  if (nearCross) {
    const shadow = [lerp(bg[0], 0, 0.12), lerp(bg[1], 0, 0.12), lerp(bg[2], 0, 0.12)]
    return [...shadow, alpha]
  }

  return [...bg, alpha]
}

// ─── Generate master PNGs ─────────────────────────────────────────────────────
console.log('🎨 Generating icons...')

const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]
const pngs  = {}

for (const s of SIZES) {
  console.log(`  PNG ${s}x${s}`)
  pngs[s] = makePNG(s, pixelFn)
}

// Save master 512 + 1024
fs.writeFileSync(path.join(RESOURCES, 'icon.png'),   pngs[512])
fs.writeFileSync(path.join(RESOURCES, 'icon@2x.png'), pngs[1024])
console.log('  ✅ icon.png (512)')
console.log('  ✅ icon@2x.png (1024)')

// ─── ICO (Windows) ────────────────────────────────────────────────────────────
// Modern ICO can embed raw PNG data — supported since Windows Vista
const icoSizes = [16, 32, 48, 256]
const icoImages = icoSizes.map(s => pngs[s])

{
  const count    = icoSizes.length
  const headerSz = 6 + 16 * count  // ICO header + directory
  let offset = headerSz

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type = ICO
  header.writeUInt16LE(count, 4)

  const dir = Buffer.alloc(16 * count)
  for (let i = 0; i < count; i++) {
    const s  = icoSizes[i]
    const sz = icoImages[i].length
    const d  = dir.slice(i * 16)
    d[0] = s >= 256 ? 0 : s   // width  (0 = 256)
    d[1] = s >= 256 ? 0 : s   // height (0 = 256)
    d[2] = 0                   // palette
    d[3] = 0                   // reserved
    d.writeUInt16LE(1, 4)      // color planes
    d.writeUInt16LE(32, 6)     // bits per pixel
    d.writeUInt32LE(sz, 8)     // data size
    d.writeUInt32LE(offset, 12)
    offset += sz
  }

  const ico = Buffer.concat([header, dir, ...icoImages])
  fs.writeFileSync(path.join(RESOURCES, 'icon.ico'), ico)
  console.log('  ✅ icon.ico (Windows)')
}

// ─── ICNS (macOS) ─────────────────────────────────────────────────────────────
// Use macOS iconutil: requires an .iconset folder
const iconsetDir = path.join(RESOURCES, 'icon.iconset')
fs.mkdirSync(iconsetDir, { recursive: true })

const icnsSizes = [
  { name: 'icon_16x16.png',      size: 16  },
  { name: 'icon_16x16@2x.png',   size: 32  },
  { name: 'icon_32x32.png',      size: 32  },
  { name: 'icon_32x32@2x.png',   size: 64  },
  { name: 'icon_128x128.png',    size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png',    size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png',    size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 },
]

for (const { name, size } of icnsSizes) {
  fs.writeFileSync(path.join(iconsetDir, name), pngs[size] || makePNG(size, pixelFn))
}

try {
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(RESOURCES, 'icon.icns')}"`)
  console.log('  ✅ icon.icns (macOS)')
} catch {
  console.warn('  ⚠️  iconutil failed — run manually: iconutil -c icns resources/icon.iconset')
}

// Cleanup iconset folder
fs.rmSync(iconsetDir, { recursive: true, force: true })

console.log('\n✅ Done! Icons saved to resources/')
console.log('   resources/icon.png')
console.log('   resources/icon.ico')
console.log('   resources/icon.icns')
