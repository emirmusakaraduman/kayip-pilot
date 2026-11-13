// Arazi yüksekliği ve orman yerleşimi (saf, React'siz; testlenebilir).
// Kural: helikopter hiçbir ağacın içinden geçmez. Yolun üstündeki ağaçlar ya baştan kısaltılır/silinir,
// ya da çarpma anında (tepeleri kırılarak) kısalır. Gövdesi/pervanesi hiçbir ağacın hacmine girmez.

import type { OrtamAyar } from './ortam'
import { CARPMA_YERI, ENKAZ, OLAY, SURUKLEME, heliDurum, rotorParca } from './timeline'

export function rastgele(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const kelep = (x: number) => Math.min(1, Math.max(0, x))
const pürüzsüz = (a: number, b: number, x: number) => {
  const u = kelep((x - a) / (b - a))
  return u * u * (3 - 2 * u)
}

// — değer gürültüsü (deterministik)
function karma(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function gurultu(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = karma(ix, iy), b = karma(ix + 1, iy), c = karma(ix, iy + 1), d = karma(ix + 1, iy + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, oktav = 4) {
  let t = 0, a = 0.5, f = 1
  for (let i = 0; i < oktav; i++) {
    t += a * gurultu(x * f + i * 17.3, y * f - i * 9.1)
    f *= 2.03
    a *= 0.5
  }
  return t
}

/** Enkaz açıklığı: bu yarıçapta zemin düz ve çıplak topraktır, ağaç yoktur. */
export const ACIKLIK = 14
/** Toprak dokusunun zemin rengine karışma ağırlığı (açıklıkta 1, ormana doğru 0). */
export function toprakAgirlik(x: number, z: number) {
  const d = Math.hypot(x - ENKAZ[0], z - ENKAZ[2])
  return 1 - pürüzsüz(ACIKLIK, ACIKLIK + 14, d)
}

/** Arazi yüksekliği: açıklık çevresi düz, uzaklaştıkça dalgalı tepeler; kenarlarda tekrar düze iner. */
export function arazi(x: number, z: number): number {
  const d = Math.hypot(x - ENKAZ[0], z - ENKAZ[2])
  const rampa = pürüzsüz(26, 90, d) * (1 - pürüzsüz(320, 440, d))
  if (rampa <= 0) return 0
  const tepe = Math.pow(fbm(x * 0.0085, z * 0.0085), 1.5) * 34
  const ince = fbm(x * 0.045, z * 0.045, 3) * 3.2
  return rampa * (tepe + ince)
}

export interface Agac {
  x: number
  y: number
  z: number
  olcek: number
  faz: number
  ton: number
  /** Çarpma anında tepesi kırılıp kısalan ağaç: bu saniyede kısalmaya başlar. */
  kirikT?: number
  /** Kırıldıktan sonraki ölçek. */
  kirikOlcek?: number
}
export interface Kirilma {
  t: number
  p: [number, number, number]
}
export interface Orman {
  agaclar: Agac[]
  kirilmalar: Kirilma[]
}

/** Taç yüksekliği (birim ağaç ölçeğinde): taban y'den tepeye. Taç geometrileri bu boya göre yapılır. */
export const AGAC_BOY = 3.8
/** Bu andan önceki çakışmalarda ağaç baştan kısaltılır (kimse pop görmesin); sonrakilerde çarpmayla kırılır. */
const KIRILMA_ESIGI = OLAY.agacCarpma - 1

interface Ornek {
  t: number
  x: number
  z: number
  /** Bu noktada ağaç tepesinin çıkabileceği en yüksek mutlak y. */
  tavan: number
  r: number
}

/** Helikopter gövdesi ve kopan pervanenin yolundan örnekler (gövde dönerken 4,5 m yarıçaplı çember süpürür). */
function yolOrnekleri(): Ornek[] {
  const o: Ornek[] = []
  const son = OLAY.yereInis + SURUKLEME + 0.5
  for (let t = OLAY.kuyrukKaybi; t <= son; t += 0.05) {
    const h = heliDurum(t)
    // burun öne eğikken ucu aşağı iner; yan yatınca gövde yüksekliği ve genişliği artar
    const egim = 4.5 * Math.abs(Math.sin(h.pitch)) + 1.2 * Math.abs(Math.sin(h.roll))
    o.push({ t, x: h.poz[0], z: h.poz[2], tavan: h.poz[1] - 0.9 - egim, r: 5 })
  }
  for (let t = OLAY.agacCarpma; t <= OLAY.agacCarpma + 3; t += 0.05) {
    const p = rotorParca(t)
    if (!p) continue
    o.push({ t, x: p.poz[0], z: p.poz[2], tavan: p.poz[1] - 0.4, r: 3.4 })
  }
  return o
}

export function ormanUret(ayar: OrtamAyar): Orman {
  const r = rastgele(42)
  const liste: Agac[] = []
  // Açıklık dışında, sabit kamera noktaları da ağaçsız kalır (kamera ağacın içine düşmesin).
  const bosluklar: [number, number, number][] = [
    [ENKAZ[0], ENKAZ[2], ACIKLIK], [-14, 40, 16], [72, 24, 9], [68, 19, 9], [36, -14, 11], [46, -6, 9],
  ]
  const temiz = (x: number, z: number) => bosluklar.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)
  const yeni = (x: number, z: number, olcek: number): Agac => ({ x, y: arazi(x, z), z, olcek, faz: r() * 6.28, ton: r() })

  while (liste.length < ayar.agacAdet) {
    const x = -140 + r() * 320
    const z = -170 + r() * 340
    if (temiz(x, z)) continue
    liste.push(yeni(x, z, ayar.agacOlcek[0] + r() * (ayar.agacOlcek[1] - ayar.agacOlcek[0])))
  }
  // Çarpma koruluğu: iniş yolunun üstünde yüksek, sık ağaçlar; pervane bunların tepelerine çarpar.
  for (let i = 0; i < 80; i++) {
    const x = CARPMA_YERI[0] - 8 + r() * 16
    const z = CARPMA_YERI[2] - 6 + r() * 12
    if (temiz(x, z)) continue
    liste.push(yeni(x, z, 2.7 + r() * 0.5))
  }

  const ornekler = yolOrnekleri()
  const agaclar: Agac[] = []
  const kirilmalar: Kirilma[] = []
  for (const a of liste) {
    // yoldan uzak ağaçları hızla ele
    if (a.x < 5 || a.x > 80 || a.z < -25 || a.z > 30) {
      agaclar.push(a)
      continue
    }
    let sabitSinir = Infinity
    for (const o of ornekler) {
      if (o.t >= KIRILMA_ESIGI || Math.hypot(a.x - o.x, a.z - o.z) >= o.r) continue
      sabitSinir = Math.min(sabitSinir, (o.tavan - a.y) / AGAC_BOY)
    }
    const s = Math.min(a.olcek, sabitSinir)
    if (s < 0.8) continue // yolun tam üstünde: ağaç yok
    let kirikSinir = Infinity
    let kirikT = Infinity
    for (const o of ornekler) {
      if (o.t < KIRILMA_ESIGI || Math.hypot(a.x - o.x, a.z - o.z) >= o.r) continue
      const sinir = (o.tavan - a.y) / AGAC_BOY
      if (s > sinir) {
        kirikSinir = Math.min(kirikSinir, sinir)
        kirikT = Math.min(kirikT, o.t)
      }
    }
    a.olcek = s
    if (kirikT < Infinity) {
      if (kirikSinir < 0.8) continue // yer seviyesindeki yolda: baştan yok
      a.kirikT = kirikT
      a.kirikOlcek = Math.max(0.8, kirikSinir)
      kirilmalar.push({ t: kirikT, p: [a.x, a.y + AGAC_BOY * s, a.z] })
    }
    agaclar.push(a)
  }
  kirilmalar.sort((p, q) => p.t - q.t)
  return { agaclar, kirilmalar }
}
