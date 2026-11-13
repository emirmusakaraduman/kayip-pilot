// Türkiye haritası verisi.
// • Yükseklik: GERÇEK veri (AWS Terrain Tiles / SRTM dâhil birleşik), yukseklikVeri.ts içinde. Ayrıntı: scripts/yukseklik-uret.mjs
// • Sınır çizgisi ve iklim maskesi: elle çizilmiş KABA yaklaşımdır (yükseklik verisi değildir, sınır içermez).
//   Gerçek sınır/iklim verisi ayrıca eklenmelidir.
import { YUK_B64, YUK_BIRIM, YUK_H, YUK_W } from './yukseklikVeri'

/** Başlık ekranında gösterilen veri atfı. */
export const YUKSEKLIK_ATIF = 'Harita yüksekliği: AWS Terrain Tiles (SRTM dâhil birleşik veri; kaynaklar: github.com/tilezen/joerd, docs/attribution.md)'

export type Bolge = 'akdeniz' | 'karadeniz' | 'karasal' | 'sert-karasal'

export const BOLGELER: Bolge[] = ['akdeniz', 'karadeniz', 'karasal', 'sert-karasal']
export const BOLGE_AD: Record<Bolge, string> = {
  akdeniz: 'Akdeniz',
  karadeniz: 'Karadeniz',
  karasal: 'Ilıman karasal',
  'sert-karasal': 'Sert karasal',
}
export const BOLGE_RENK: Record<Bolge, string> = {
  akdeniz: '#98915a',
  karadeniz: '#4d9456',
  karasal: '#d8cc82',
  'sert-karasal': '#a65540',
}
/** Etiketlerin durduğu yaklaşık nokta [boylam, enlem] (bölgenin içinde). */
export const BOLGE_ETIKET: Record<Bolge, [number, number]> = {
  akdeniz: [28.2, 37.2],
  karadeniz: [34.2, 41.55],
  karasal: [32.0, 39.2],
  'sert-karasal': [42.2, 39.9],
}

export const LON0 = 25.5
export const LON1 = 45.5
export const LAT0 = 35.5
export const LAT1 = 42.5
export const EN_BOY = 640 / 290

/** [boylam, enlem] — kaba kıyı/sınır çizgisi. */
const CIZGI: [number, number][] = [
  [26.1, 41.7], [28.0, 41.9], [29.1, 41.2], [31.0, 41.1], [33.5, 42.0], [35.2, 42.0], [36.5, 41.3],
  [38.3, 40.95], [40.3, 41.0], [41.5, 41.5], [43.4, 41.1], [44.8, 39.7], [44.4, 38.4], [44.2, 37.3],
  [42.4, 37.1], [40.0, 36.9], [38.0, 36.8], [36.7, 36.8], [36.2, 36.0], [35.9, 36.6], [34.0, 36.2],
  [32.4, 36.1], [30.6, 36.8], [29.0, 36.6], [28.0, 36.7], [27.4, 37.0], [27.2, 37.9], [26.3, 38.3],
  [26.8, 39.5], [26.2, 40.0], [26.7, 40.4], [26.0, 40.7],
]

const NEHIRLER: [number, number][][] = [
  [[38.0, 39.7], [36.5, 39.3], [35.0, 38.9], [34.0, 39.5], [34.5, 40.6], [35.0, 41.0], [35.95, 41.7]], // Kızılırmak
  [[41.3, 39.9], [39.2, 39.0], [38.8, 38.4], [38.2, 37.5], [38.0, 36.7]], // Fırat
  [[40.2, 38.0], [40.8, 37.9], [41.8, 37.5], [42.4, 37.2]], // Dicle
  [[30.3, 39.2], [30.5, 40.0], [31.0, 40.3], [30.6, 40.8], [30.65, 41.1]], // Sakarya
  [[37.0, 40.0], [37.5, 40.3], [36.5, 40.7], [36.6, 41.3]], // Yeşilırmak
  [[30.2, 38.4], [28.5, 37.8], [27.2, 37.7]], // Büyük Menderes
  [[35.5, 38.2], [35.4, 37.4], [35.2, 36.9]], // Seyhan
  [[36.9, 37.6], [36.2, 37.3], [35.8, 36.9]], // Ceyhan
  [[40.2, 40.3], [40.8, 40.2], [41.4, 40.4], [41.55, 41.0], [41.6, 41.5]], // Çoruh
  [[29.2, 38.9], [27.9, 38.7], [27.0, 38.6]], // Gediz
]

/** [boylam, enlem, yarıçap boylam, yarıçap enlem] */
const GOLLER: [number, number, number, number][] = [
  [42.9, 38.6, 0.5, 0.25], // Van
  [33.4, 38.7, 0.3, 0.2], // Tuz
  [31.5, 37.75, 0.15, 0.2], // Beyşehir
  [30.9, 37.9, 0.12, 0.2], // Eğirdir
  [38.5, 37.5, 0.24, 0.1], // Atatürk Barajı
  [39.0, 38.85, 0.28, 0.09], // Keban Barajı
]

export function icerde(lon: number, lat: number): boolean {
  let ic = false
  for (let i = 0, j = CIZGI.length - 1; i < CIZGI.length; j = i++) {
    const [xi, yi] = CIZGI[i]
    const [xj, yj] = CIZGI[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ic = !ic
  }
  return ic
}

/** İklim bölgesi — ders kitabı mantığına yakın kaba kural (Marmara geçiş olarak Karadeniz'e katıldı). */
export function bolgeOf(lon: number, lat: number): Bolge {
  if (lon < 29.3 && lat < 39.8) return 'akdeniz'
  if (lon >= 29.3 && lat < 37.6 && lon < 37.5) return 'akdeniz'
  if (lon >= 37.5 && lat < 37.3) return 'karasal' // Güneydoğu
  if (lon >= 38.5 && lat >= 37.4 && lat <= 40.6) return 'sert-karasal'
  if (lon > 41.5 && lat > 40.6) return 'sert-karasal'
  if (lat > 40.6 && lon >= 29.3) return 'karadeniz'
  if (lat > 40.0 && lon < 29.3) return 'karadeniz'
  return 'karasal'
}

const g = (lon: number, lat: number, cx: number, cy: number, sx: number, sy: number, a: number) =>
  a * Math.exp(-(((lon - cx) / sx) ** 2 + ((lat - cy) / sy) ** 2))

const TEPELER: [number, number, number, number, number][] = [
  [30, 37.3, 1.3, 0.45, 1.4], [32, 36.9, 1.3, 0.45, 1.4], [34, 37.2, 1.3, 0.45, 1.4], [36, 37.6, 1.3, 0.45, 1.4],
  [33, 41.2, 1.5, 0.35, 1.2], [35, 40.9, 1.5, 0.35, 1.2], [37, 40.6, 1.5, 0.35, 1.2], [39, 40.4, 1.5, 0.35, 1.2],
  [41, 40.5, 1.5, 0.35, 1.2], [41.1, 40.85, 0.5, 0.3, 2.5], [35.45, 38.55, 0.3, 0.3, 2.0],
  [44.3, 39.7, 0.4, 0.3, 3.5], [42.8, 38.9, 0.6, 0.4, 1.5], [29.1, 40.1, 0.4, 0.3, 1.4],
  [42.0, 38.3, 0.8, 0.4, 1.2], [44.0, 37.5, 0.8, 0.4, 1.5],
]

const GERCEK = Uint8Array.from(atob(YUK_B64), (c) => c.charCodeAt(0))

/** Gerçek yükseklik (km): ızgaradan çift doğrusal (bilinear) örnekleme. Satır 0 = kuzey, sütun 0 = batı. */
export function yukseklikKm(lon: number, lat: number): number {
  const fx = Math.min(YUK_W - 1, Math.max(0, ((lon - LON0) / (LON1 - LON0)) * (YUK_W - 1)))
  const fy = Math.min(YUK_H - 1, Math.max(0, ((LAT1 - lat) / (LAT1 - LAT0)) * (YUK_H - 1)))
  const x = Math.min(YUK_W - 2, Math.floor(fx)), y = Math.min(YUK_H - 2, Math.floor(fy))
  const u = fx - x, v = fy - y
  const h = (i: number, j: number) => GERCEK[j * YUK_W + i]
  const m = (h(x, y) * (1 - u) + h(x + 1, y) * u) * (1 - v) + (h(x, y + 1) * (1 - u) + h(x + 1, y + 1) * u) * v
  return (m * YUK_BIRIM) / 1000
}

/** Eski elle yazılmış yaklaşık yükseklik (km). Yalnızca yedek/karşılaştırma için tutuluyor. */
export function yukseklikKmTahmin(lon: number, lat: number): number {
  let h = lon < 29.5 ? 0.25 + Math.max(0, lon - 26) * 0.06 : 0.9 + Math.min(1, (lon - 29.5) / 10) * 0.9
  if (lon > 37 && lat < 37.4) h = 0.45
  for (const [cx, cy, sx, sy, a] of TEPELER) h += g(lon, lat, cx, cy, sx, sy, a)
  return h
}

export interface HaritaVerisi {
  w: number
  h: number
  kara: Uint8Array
  bolge: Uint8Array // BOLGELER indeksi
  yuk: Float32Array // km
  /** Kara maskesinin geniş bulanıklığı (0..1): denizde kıyıya yakınlık, sığ deniz rengi için. */
  kiyi: Float32Array
}

function bulanikla(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let k = -r; k <= r; k++) s += src[y * w + Math.min(w - 1, Math.max(0, x + k))]
      tmp[y * w + x] = s / (2 * r + 1)
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x]
      out[y * w + x] = s / (2 * r + 1)
    }
  return out
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function pikselKoordinat(x: number, y: number, w: number, h: number): [number, number] {
  return [LON0 + (x / (w - 1)) * (LON1 - LON0), LAT1 - (y / (h - 1)) * (LAT1 - LAT0)]
}

let onbellek: HaritaVerisi | null = null

export function haritaUret(w = 640, h = 290): HaritaVerisi {
  if (onbellek && onbellek.w === w) return onbellek
  const kara = new Uint8Array(w * h)
  const bolge = new Uint8Array(w * h)
  const yuk = new Float32Array(w * h)
  const maske = new Float32Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [lon, lat] = pikselKoordinat(x, y, w, h)
      const i = y * w + x
      if (icerde(lon, lat)) {
        kara[i] = 1
        maske[i] = 1
      }
      bolge[i] = BOLGELER.indexOf(bolgeOf(lon, lat))
    }
  const bulanik = bulanikla(maske, w, h, 8)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!kara[i]) continue
      const [lon, lat] = pikselKoordinat(x, y, w, h)
      yuk[i] = yukseklikKm(lon, lat) * smooth(0.5, 0.95, bulanik[i])
    }
  onbellek = { w, h, kara, bolge, yuk: bulanikla(yuk, w, h, 2), kiyi: bulanikla(maske, w, h, 30) }
  return onbellek
}

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}

const karistir = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** Haritayı tuvale çizer: parlayan sığ/derin deniz + ızgara, iklim renkleri, kabartma gölgesi, kaya/kar, bölge sınırları, nehir ve göller. */
export function dokuCiz(v: HaritaVerisi, canvas: HTMLCanvasElement, vurgu: Bolge[] = []) {
  const OLCEK = 3 // düşük çözünürlükte hesaplanır, yumuşak büyütülüp üstüne ince çizgiler çizilir
  const kucuk = document.createElement('canvas')
  kucuk.width = v.w
  kucuk.height = v.h
  const kctx = kucuk.getContext('2d')!
  const img = kctx.createImageData(v.w, v.h)
  const renkler = BOLGELER.map((b) => hex(BOLGE_RENK[b]))
  const derin = hex('#0a2656'), sigl = hex('#37b0d6'), kaya = hex('#8a7c6c'), kar: [number, number, number] = [244, 247, 250]
  const lonAdim = (LON1 - LON0) / (v.w - 1), latAdim = (LAT1 - LAT0) / (v.h - 1)
  for (let y = 0; y < v.h; y++)
    for (let x = 0; x < v.w; x++) {
      const i = y * v.w + x
      const p = i * 4
      if (!v.kara[i]) {
        // deniz: kıyıdan açığa doğru parlak turkuazdan koyu laciverte
        const t = Math.pow(smooth(0.0, 0.42, v.kiyi[i]), 0.8)
        let c = karistir(derin, sigl, t)
        // ızgara: her 2° boylam ve 1° enlemde ince açık çizgi
        const lon = LON0 + x * lonAdim, lat = LAT1 - y * latAdim
        const gb = Math.abs(((lon + 1e-6) % 2 + 2) % 2), ge = Math.abs(((lat + 1e-6) % 1 + 1) % 1)
        if (gb < lonAdim * 1.1 || gb > 2 - lonAdim * 1.1 || ge < latAdim * 1.1 || ge > 1 - latAdim * 1.1) c = karistir(c, [160, 225, 255], 0.4)
        img.data.set([c[0], c[1], c[2], 255], p)
        continue
      }
      const bi = v.bolge[i]
      const h = v.yuk[i]
      const parlak = vurgu.includes(BOLGELER[bi]) ? 1.3 : 1
      // yüksek yerlerde kayaya, çok yüksek yerlerde kara doğru
      let c = renkler[bi]
      c = karistir(c, kaya, Math.min(0.65, Math.max(0, (h - 1.7) / 1.8)))
      c = karistir(c, kar, Math.min(0.95, Math.max(0, (h - 3.0) / 0.7)))
      // eğim gölgesi (ışık kuzeybatıdan)
      const sol = v.yuk[y * v.w + Math.max(0, x - 1)], ust = v.yuk[Math.max(0, y - 1) * v.w + x]
      const golge = Math.min(1.45, Math.max(0.5, 1 + (sol - h + ust - h) * 2.6))
      // bölge sınırı ve kıyı çizgisi: koyu
      const sag = x + 1 < v.w ? i + 1 : i, alt = y + 1 < v.h ? i + v.w : i
      const sinir = (v.kara[sag] && v.bolge[sag] !== bi) || (v.kara[alt] && v.bolge[alt] !== bi)
      const kiyiCizgi = !v.kara[sag] || !v.kara[alt] || (x > 0 && !v.kara[i - 1]) || (y > 0 && !v.kara[i - v.w])
      const k = kiyiCizgi ? 0.45 : sinir ? 0.55 : 1
      img.data.set([Math.min(255, c[0] * golge * parlak * k), Math.min(255, c[1] * golge * parlak * k), Math.min(255, c[2] * golge * parlak * k), 255], p)
    }
  kctx.putImageData(img, 0, 0)
  canvas.width = v.w * OLCEK
  canvas.height = v.h * OLCEK
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(kucuk, 0, 0, canvas.width, canvas.height)
  const px = (lon: number, lat: number): [number, number] => [((lon - LON0) / (LON1 - LON0)) * canvas.width, ((LAT1 - lat) / (LAT1 - LAT0)) * canvas.height]
  ctx.strokeStyle = '#5db4ee'
  ctx.lineWidth = 1.8 * OLCEK / 2
  ctx.lineJoin = 'round'
  for (const n of NEHIRLER) {
    ctx.beginPath()
    n.forEach(([lo, la], k) => {
      const [x, y] = px(lo, la)
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  ctx.fillStyle = '#2f86d0'
  for (const [lo, la, rx, ry] of GOLLER) {
    const [x, y] = px(lo, la)
    ctx.beginPath()
    ctx.ellipse(x, y, (rx / (LON1 - LON0)) * canvas.width, (ry / (LAT1 - LAT0)) * canvas.height, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
