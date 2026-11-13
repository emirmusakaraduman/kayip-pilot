// Açılış sinematiğinin saf (React'siz) zaman çizelgesi: helikopter yolu, kameralar, altyazılar.
// Helikopterin ileri yönü yerel +z, sol yanı yerel +x'tir. Dünya: +x uçuş yönü, y yukarı.

export type V3 = [number, number, number]

export const TOPLAM = 38
/** Kısa sürüm: bölüm başlarında bu aralık hızlandırılarak oynatılır. */
export const KISA = { bas: 6.2, son: 32, hiz: 1.6 }

export const OLAY = {
  yanginBasla: 7,
  kuyrukKaybi: 11,
  agacCarpma: 17.5,
  yereInis: 22,
  yanYatma: 24.3,
  patlama: 27,
} as const

/** Enkazın son durağı (temizlik alanının merkezi). */
export const ENKAZ: V3 = [59, 0, 6.3]
export const CARPMA_YERI: V3 = [46, 8.5, 3.5]

const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const kelep = (x: number) => Math.min(1, Math.max(0, x))
export const yumusat = (x: number) => {
  const u = kelep(x)
  return u * u * (3 - 2 * u)
}
const ekle = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]

export interface HeliDurum {
  poz: V3
  yaw: number
  pitch: number
  roll: number
  rotorHiz: number
}

const salinim = (t: number) => 0.3 * Math.sin(1.9 * t) * yumusat((t - OLAY.kuyrukKaybi) / 3)

export function heliDurum(t: number): HeliDurum {
  let x: number, y: number, z: number
  if (t <= OLAY.kuyrukKaybi) {
    x = -70 + 8.3 * t
    y = lerp(32, 29, t / OLAY.kuyrukKaybi)
    z = 0
  } else if (t <= OLAY.agacCarpma) {
    const u = (t - OLAY.kuyrukKaybi) / (OLAY.agacCarpma - OLAY.kuyrukKaybi)
    x = lerp(21.3, CARPMA_YERI[0], u)
    y = lerp(29, CARPMA_YERI[1], Math.pow(u, 1.5))
    z = lerp(0, CARPMA_YERI[2], u)
  } else if (t <= OLAY.yereInis) {
    const u = (t - OLAY.agacCarpma) / (OLAY.yereInis - OLAY.agacCarpma)
    x = lerp(CARPMA_YERI[0], 55, u)
    y = lerp(CARPMA_YERI[1], 0.75, Math.pow(u, 1.8))
    z = lerp(CARPMA_YERI[2], 6, u)
  } else {
    const u = yumusat((t - OLAY.yereInis) / 4)
    x = 55 + 4 * u
    y = lerp(0.75, 0.7, u)
    z = 6 + 0.3 * u
  }

  const yaw = Math.PI / 2 + (t <= OLAY.kuyrukKaybi ? 0 : 0.15 * Math.pow(Math.min(t, OLAY.yereInis) - OLAY.kuyrukKaybi, 2))
  const pitch =
    t <= OLAY.kuyrukKaybi
      ? 0
      : t <= OLAY.agacCarpma
        ? 0.5 * yumusat((t - OLAY.kuyrukKaybi) / 6.5)
        : t <= OLAY.yereInis
          ? lerp(0.5, 0.15, yumusat((t - OLAY.agacCarpma) / 4.5))
          : lerp(0.15, 0, yumusat(t - OLAY.yereInis))
  const roll =
    t <= OLAY.yereInis
      ? salinim(t)
      : lerp(salinim(OLAY.yereInis), -Math.PI / 2, yumusat((t - OLAY.yereInis) / (OLAY.yanYatma - OLAY.yereInis)))
  const rotorHiz =
    t <= OLAY.kuyrukKaybi ? 22 : t <= OLAY.agacCarpma ? 22 * (1 - 0.5 * yumusat((t - OLAY.kuyrukKaybi) / 6.5)) : 0
  return { poz: [x, y, z], yaw, pitch, roll, rotorHiz }
}

export interface RotorParca {
  poz: V3
  donus: number
  yerde: boolean
}

/** Ağaç tepelerine çarpınca kopan ana rotor: eğik atış, sonra yere düşüp durur. */
export function rotorParca(t: number): RotorParca | null {
  if (t < OLAY.agacCarpma) return null
  const dt = t - OLAY.agacCarpma
  const b = heliDurum(OLAY.agacCarpma).poz
  const v: V3 = [7, 6, -4]
  const g = 12
  const yer = 0.15
  const inis = (v[1] + Math.sqrt(v[1] * v[1] + 2 * g * (b[1] + 1.2 - yer))) / g
  const tt = Math.min(dt, inis)
  return {
    poz: [b[0] + v[0] * tt, b[1] + 1.2 + v[1] * tt - 0.5 * g * tt * tt, b[2] + v[2] * tt],
    donus: 25 * tt,
    yerde: dt >= inis,
  }
}

export interface Kamera {
  poz: V3
  bak: V3
  fov: number
}

export function kamera(t: number): Kamera {
  const h = heliDurum(t).poz
  if (t < 6) return { poz: [-14, 3, 40], bak: h, fov: lerp(24, 36, t / 6) }
  if (t < OLAY.kuyrukKaybi) {
    const u = (t - 6) / 5
    return { poz: ekle(h, [lerp(3, 2, u), 1.2, lerp(-7.5, -5.5, u)]), bak: ekle(h, [0, 0.6, 0]), fov: 42 }
  }
  if (t < OLAY.agacCarpma) {
    const a = Math.PI + 0.35 * (t - OLAY.kuyrukKaybi)
    return { poz: ekle(h, [14 * Math.cos(a), 3.5, 14 * Math.sin(a)]), bak: h, fov: 46 }
  }
  if (t < OLAY.yereInis) return { poz: [30, 14, 21], bak: ekle(h, [0, 0.5, 0]), fov: 40 }
  if (t < OLAY.patlama) {
    const u = (t - OLAY.yereInis) / (OLAY.patlama - OLAY.yereInis)
    return { poz: lerp3([72, 9, 24], [68, 7, 19], u), bak: [58, 1.5, 6.3], fov: 40 }
  }
  if (t < 32) {
    const s = 0.5 * Math.exp(-1.5 * (t - OLAY.patlama))
    const w = t * 1
    return {
      poz: ekle([36, 12, -16], [s * Math.sin(60 * w), s * Math.sin(47 * w + 1), s * Math.sin(53 * w + 2)]),
      bak: [59, 3, 6.3],
      fov: 45,
    }
  }
  return { poz: lerp3([46, 5, -6], [38, 16, -26], yumusat((t - 32) / 6)), bak: [59, 2.5, 6.3], fov: 42 }
}

export interface Altyazi {
  t0: number
  t1: number
  kim: 'MERKEZ' | 'DENİZ'
  metin: string
}

export const ALTYAZILAR: Altyazi[] = [
  { t0: 1.5, t1: 6, kim: 'MERKEZ', metin: 'TC-KRT, burası Merkez. Tıbbi malzeme uçuşunuz radarda, rota normal.' },
  { t0: 6.8, t1: 11, kim: 'DENİZ', metin: 'Merkez, burası Deniz! Sol motor yangın uyarısı veriyor!' },
  { t0: 11.3, t1: 16, kim: 'DENİZ', metin: 'Yangın büyüyor! Kuyruk kontrolünü kaybettim, dönüyorum!' },
  { t0: 16, t1: 17.4, kim: 'MERKEZ', metin: 'Deniz! [cızırtı] Deniz, duyuyor musun?' },
  { t0: 17.6, t1: 21.2, kim: 'DENİZ', metin: 'Ağaçlara çarpacağım, tutun— [cızırtı]' },
  { t0: 28.5, t1: 32.5, kim: 'MERKEZ', metin: 'TC-KRT, cevap ver... [cızırtı] TC-KRT...' },
  { t0: 33.2, t1: 37.4, kim: 'MERKEZ', metin: 'Tüm birimler: helikopter düşmüş olabilir. Deniz\'i bulmamız lazım.' },
]

/** Kelime kelime yazılan altyazı: süresinin ilk %75'inde tamamlanır. */
export function altyaziMetni(t: number): { kim: Altyazi['kim']; metin: string; kelime: number; anahtar: number } | null {
  const a = ALTYAZILAR.find((x) => t >= x.t0 && t < x.t1)
  if (!a) return null
  const k = a.metin.split(' ')
  const n = Math.max(1, Math.ceil(kelep((t - a.t0) / ((a.t1 - a.t0) * 0.75)) * k.length))
  return { kim: a.kim, metin: k.slice(0, n).join(' '), kelime: n, anahtar: a.t0 }
}
