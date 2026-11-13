// Türkiye yükseklik ızgarasını üretir: AWS Terrain Tiles ("terrarium" PNG karoları; SRTM dâhil birleşik veri)
// → src/map/yukseklikVeri.ts (Uint8, 21 m birim, base64).
//
// Kullanım:  node scripts/yukseklik-uret.mjs [önbellekKlasörü]
// Ham karolar önbellek klasörüne iner (repoya girmez: .gitignore). Yeniden çalıştırınca önbellek kullanılır.
// Kaynak/atıf: bkz. src/map/yukseklikVeri.ts başlığı ve docs/BASVURU.md.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { PNG } from 'pngjs'

// ── src/map/turkey.ts ile AYNI olmalı ──
const LON0 = 25.5, LON1 = 45.5, LAT0 = 35.5, LAT1 = 42.5
const W = 480, H = 218
const ZOOM = 7
const BIRIM = 21 // metre; Uint8 ile 5355 m'ye kadar (Ağrı 5137 m)
const KAYNAK = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium'

const onbellek = resolve(process.argv[2] ?? '.yukseklik-onbellek')
await mkdir(onbellek, { recursive: true })

const n = 2 ** ZOOM
const mx = (lon) => ((lon + 180) / 360) * n
const my = (lat) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
}
const x0 = Math.floor(mx(LON0)), x1 = Math.floor(mx(LON1))
const y0 = Math.floor(my(LAT1)), y1 = Math.floor(my(LAT0))
console.log(`Karo aralığı z=${ZOOM}: x ${x0}..${x1}, y ${y0}..${y1} → ${(x1 - x0 + 1) * (y1 - y0 + 1)} karo`)

const var_ = async (p) => access(p).then(() => true, () => false)
async function karo(x, y) {
  const dosya = join(onbellek, `${ZOOM}_${x}_${y}.png`)
  if (await var_(dosya)) return readFile(dosya)
  const r = await fetch(`${KAYNAK}/${ZOOM}/${x}/${y}.png`)
  if (!r.ok) throw new Error(`İndirilemedi ${ZOOM}/${x}/${y}: HTTP ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await writeFile(dosya, buf)
  return buf
}

// Mozaik: karoların yüksekliklerini (metre) tek diziye yerleştir
const MW = (x1 - x0 + 1) * 256, MH = (y1 - y0 + 1) * 256
const mozaik = new Float32Array(MW * MH)
let toplamBayt = 0
for (let ty = y0; ty <= y1; ty++)
  for (let tx = x0; tx <= x1; tx++) {
    const buf = await karo(tx, ty)
    toplamBayt += buf.length
    const png = PNG.sync.read(buf)
    for (let j = 0; j < 256; j++)
      for (let i = 0; i < 256; i++) {
        const p = (j * 256 + i) * 4
        // terrarium: metre = (R*256 + G + B/256) − 32768
        mozaik[((ty - y0) * 256 + j) * MW + (tx - x0) * 256 + i] = png.data[p] * 256 + png.data[p + 1] + png.data[p + 2] / 256 - 32768
      }
  }
console.log(`Toplam karo boyutu: ${(toplamBayt / 1e6).toFixed(2)} MB`)

const ornek = (lon, lat) => {
  const px = Math.min(MW - 1, Math.max(0, Math.floor((mx(lon) - x0) * 256)))
  const py = Math.min(MH - 1, Math.max(0, Math.floor((my(lat) - y0) * 256)))
  return mozaik[py * MW + px]
}

// Hedef ızgara: her hücre için 4×4 alt örnek ortalaması (haritanın ızgarasıyla aynı düzen: satır 0 = kuzey)
const veri = new Uint8Array(W * H)
const adimLon = (LON1 - LON0) / (W - 1), adimLat = (LAT1 - LAT0) / (H - 1)
let maks = 0
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const lon = LON0 + x * adimLon, lat = LAT1 - y * adimLat
    let t = 0
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++) t += Math.max(0, ornek(lon + ((a - 1.5) / 4) * adimLon, lat + ((b - 1.5) / 4) * adimLat))
    const m = t / 16
    maks = Math.max(maks, m)
    veri[y * W + x] = Math.min(255, Math.round(m / BIRIM))
  }
console.log(`Izgara ${W}×${H}, en yüksek ortalama hücre: ${Math.round(maks)} m`)

const b64 = Buffer.from(veri).toString('base64')
const cikti = `// OTOMATİK ÜRETİLDİ — elle düzenleme. Üreten: scripts/yukseklik-uret.mjs
//
// Kaynak: AWS Open Data "Terrain Tiles" (terrarium, z=${ZOOM}); Mapzen/Tilezen birleşik yükseklik verisi.
// SRTM (NASA/USGS) dâhil birden çok kaynaktan derlenmiştir. Atıf ve kaynak listesi:
//   https://github.com/tilezen/joerd/blob/master/docs/attribution.md
// Bölge: ${LON0}°–${LON1}°D, ${LAT0}°–${LAT1}°K. Satır 0 = kuzey, sütun 0 = batı.
// Değer = ${BIRIM} m birimli, deniz seviyesinin altı 0.
export const YUK_W = ${W}
export const YUK_H = ${H}
export const YUK_BIRIM = ${BIRIM}
export const YUK_B64 =
  '${b64}'
`
await writeFile(resolve('src/map/yukseklikVeri.ts'), cikti)
console.log(`src/map/yukseklikVeri.ts yazıldı (${(cikti.length / 1024).toFixed(0)} KB)`)
