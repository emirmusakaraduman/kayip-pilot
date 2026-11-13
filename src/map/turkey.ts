// Türkiye haritası verisi: YAKLAŞIK. Sınır çizgisi, iklim maskesi ve yükseklikler elle tahmin edilmiştir.
// Gerçek SRTM yükseklik verisi geldiğinde yalnızca `yukseklikKm` fonksiyonunun yerine
// bir veri okuyucu konacak; geri kalan kod (doku, kabartma, tıklama) değişmez.

export type Bolge = 'akdeniz' | 'karadeniz' | 'karasal' | 'sert-karasal'

export const BOLGELER: Bolge[] = ['akdeniz', 'karadeniz', 'karasal', 'sert-karasal']
export const BOLGE_AD: Record<Bolge, string> = {
  akdeniz: 'Akdeniz iklimi',
  karadeniz: 'Karadeniz iklimi',
  karasal: 'Karasal iklim',
  'sert-karasal': 'Sert karasal iklim',
}
export const BOLGE_RENK: Record<Bolge, string> = {
  akdeniz: '#d99a3d',
  karadeniz: '#3f9a58',
  karasal: '#cdbb7c',
  'sert-karasal': '#8fa6bd',
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
]

/** [boylam, enlem, yarıçap boylam, yarıçap enlem] */
const GOLLER: [number, number, number, number][] = [
  [42.9, 38.6, 0.5, 0.25], // Van
  [33.4, 38.7, 0.3, 0.2], // Tuz
  [31.5, 37.75, 0.15, 0.2], // Beyşehir
  [30.9, 37.9, 0.12, 0.2], // Eğirdir
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

/** YAKLAŞIK yükseklik (km). SRTM verisi gelince burası değişecek. */
export function yukseklikKm(lon: number, lat: number): number {
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
  onbellek = { w, h, kara, bolge, yuk: bulanikla(yuk, w, h, 2) }
  return onbellek
}

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}

/** Haritayı tuvale çizer. vurgu: parlatılacak bölgeler. */
export function dokuCiz(v: HaritaVerisi, canvas: HTMLCanvasElement, vurgu: Bolge[] = []) {
  canvas.width = v.w
  canvas.height = v.h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(v.w, v.h)
  const renkler = BOLGELER.map((b) => hex(BOLGE_RENK[b]))
  for (let y = 0; y < v.h; y++)
    for (let x = 0; x < v.w; x++) {
      const i = y * v.w + x
      const p = i * 4
      if (!v.kara[i]) {
        img.data.set([13, 43, 69, 255], p)
        continue
      }
      const bi = v.bolge[i]
      const parlak = vurgu.includes(BOLGELER[bi]) ? 1.3 : 1
      const sol = v.yuk[y * v.w + Math.max(0, x - 1)]
      const ust = v.yuk[Math.max(0, y - 1) * v.w + x]
      const golge = Math.min(1.25, Math.max(0.65, 1 + (sol - v.yuk[i] + ust - v.yuk[i]) * 1.5))
      const [r, gg, b] = renkler[bi]
      img.data.set([Math.min(255, r * golge * parlak), Math.min(255, gg * golge * parlak), Math.min(255, b * golge * parlak), 255], p)
    }
  ctx.putImageData(img, 0, 0)
  const px = (lon: number, lat: number): [number, number] => [((lon - LON0) / (LON1 - LON0)) * (v.w - 1), ((LAT1 - lat) / (LAT1 - LAT0)) * (v.h - 1)]
  ctx.strokeStyle = '#4aa3df'
  ctx.lineWidth = 1.6
  for (const n of NEHIRLER) {
    ctx.beginPath()
    n.forEach(([lo, la], k) => {
      const [x, y] = px(lo, la)
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  ctx.fillStyle = '#2f7fc0'
  for (const [lo, la, rx, ry] of GOLLER) {
    const [x, y] = px(lo, la)
    ctx.beginPath()
    ctx.ellipse(x, y, (rx / (LON1 - LON0)) * v.w, (ry / (LAT1 - LAT0)) * v.h, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
