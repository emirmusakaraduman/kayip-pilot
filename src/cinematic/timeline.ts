// Açılış sinematiğinin saf (React'siz) zaman çizelgesi: helikopter yolu, kameralar, altyazılar.
// Helikopterin ileri yönü yerel +z, sol yanı yerel +x'tir. Dünya: +x uçuş yönü, y yukarı.
//
// Sahne planı (38 sn):
//   0–8    huzurlu ama gergin: gün batımı, sağ-arka çaprazdan eşlik
//   8–15   arıza ve yangın: kamera öne geçer, kabin ve Deniz; "Mayday" telsizi
//   15–23  kontrol kaybı: kuyruk savrulur, drone bakışıyla spiral
//   23–28  ağaç tepelerine çarpma, yere iniş, yan yatma
//   28–33  patlama, enkazdan uzaklaşan kamera, telsizin son sinyali
//   33–38  duman ekranı kaplar, kararır → telsiz odasına geçiş

export type V3 = [number, number, number]

export const TOPLAM = 38
/** Kısa sürüm: bölüm başlarında bu aralık hızlandırılarak oynatılır. */
export const KISA = { bas: 7, son: 33, hiz: 1.6 }

export const OLAY = {
  yanginBasla: 8,
  kuyrukKaybi: 15,
  agacCarpma: 23,
  yereInis: 25,
  yanYatma: 26.8,
  patlama: 28,
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
/** Motor sarsıntısı: yangınla başlar, yere inerken söner (yüksek frekanslı sinüsle uygulanır). */
const sarsinti = (t: number) =>
  yumusat((t - OLAY.yanginBasla) / 2) * (1 - yumusat((t - OLAY.agacCarpma) / (OLAY.yereInis - OLAY.agacCarpma)))

const KRUVAZIYER_X = -50 + 4.7 * OLAY.kuyrukKaybi // kontrol kaybı anındaki x

export function heliDurum(t: number): HeliDurum {
  let x: number, y: number, z: number
  if (t <= OLAY.kuyrukKaybi) {
    x = -50 + 4.7 * t
    y = lerp(32, 29, t / OLAY.kuyrukKaybi)
    z = 0
  } else if (t <= OLAY.agacCarpma) {
    const u = (t - OLAY.kuyrukKaybi) / (OLAY.agacCarpma - OLAY.kuyrukKaybi)
    // spiral: yanal salınım uçlarda sıfırlanır, çarpma noktasına tam oturur
    x = lerp(KRUVAZIYER_X, CARPMA_YERI[0], u)
    y = lerp(29, CARPMA_YERI[1], Math.pow(u, 1.5))
    z = lerp(0, CARPMA_YERI[2], u) + 5 * Math.sin(Math.PI * u) * Math.sin(2.2 * Math.PI * u)
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

  const yaw = Math.PI / 2 + (t <= OLAY.kuyrukKaybi ? 0 : 0.13 * Math.pow(Math.min(t, OLAY.yereInis) - OLAY.kuyrukKaybi, 2))
  const pitch =
    t <= OLAY.kuyrukKaybi
      ? 0.03 * Math.sin(17 * t + 1) * sarsinti(t)
      : t <= OLAY.agacCarpma
        ? 0.5 * yumusat((t - OLAY.kuyrukKaybi) / 6.5) + 0.03 * Math.sin(17 * t + 1) * sarsinti(t)
        : t <= OLAY.yereInis
          ? lerp(0.5, 0.15, yumusat((t - OLAY.agacCarpma) / 4.5))
          : lerp(0.15, 0, yumusat(t - OLAY.yereInis))
  const roll =
    t <= OLAY.yereInis
      ? salinim(t) + 0.035 * Math.sin(21 * t) * sarsinti(t)
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
export function rotorParca(t: number, kok?: V3): RotorParca | null {
  if (t < OLAY.agacCarpma) return null
  const dt = t - OLAY.agacCarpma
  const h0 = heliDurum(OLAY.agacCarpma).poz
  const b: V3 = kok ?? [h0[0], h0[1] + 1.2, h0[2]] // rotor göbeği (kopma anı)
  const v: V3 = [7, 6, -4]
  const g = 12
  const yer = 0.15
  const inis = (v[1] + Math.sqrt(v[1] * v[1] + 2 * g * (b[1] - yer))) / g
  const tt = Math.min(dt, inis)
  return {
    poz: [b[0] + v[0] * tt, b[1] + v[1] * tt - 0.5 * g * tt * tt, b[2] + v[2] * tt],
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
  const { yanginBasla: YB, kuyrukKaybi: KK, agacCarpma: AC, yereInis: YI, patlama: PT } = OLAY
  // 0–8 sn: sağ-arka çaprazdan eşlik; gün batımı kadrajda, sona doğru öne doğru ilerler
  if (t < YB) {
    const u = t / YB
    return { poz: ekle(h, [lerp(-12, -5, u), lerp(1.6, 0.7, u), lerp(12, 10, u)]), bak: ekle(h, [0.8, 0.3, 0]), fov: lerp(32, 38, u) }
  }
  // 8–15 sn: helikopterin önüne geçer, kabin ve Deniz; sonra sol motorun yangınına kayar
  if (t < KK) {
    const u = yumusat((t - YB) / 3)
    const w = yumusat((t - (YB + 3)) / (KK - YB - 3))
    const sal = 0.05 * Math.sin(9 * t)
    return {
      poz: ekle(h, [lerp(lerp(-4, 9, u), 7.5, w), lerp(lerp(0.6, 0.5, u), 1.8, w) + sal, lerp(lerp(8.5, 2.2, u), -6.5, w)]),
      bak: ekle(h, [lerp(0.8, 1.2, u), 0.5, lerp(0, -0.5, w)]),
      fov: lerp(38, 34, u),
    }
  }
  // 15–23 sn: üstten drone bakışı, irtifa kaybeden helikopterin etrafında spiral
  if (t < AC) {
    const u = (t - KK) / (AC - KK)
    const a = 2.4 + 3.7 * u
    const r = lerp(24, 15, u)
    return { poz: ekle(h, [r * Math.cos(a), lerp(15, 12.5, u), r * Math.sin(a)]), bak: h, fov: lerp(44, 40, u) }
  }
  // 23–25.5 sn: orman zeminine yakın sabit kamera; ağaç tepelerine çarpış ve çöküş
  if (t < YI + 0.5) return { poz: [69, 2.2, 20], bak: ekle(h, [0, 1.5, 0]), fov: 36 }
  // 25.5–28 sn: yerdeki enkaz yan yatar
  if (t < PT) {
    const u = (t - (YI + 0.5)) / (PT - YI - 0.5)
    return { poz: lerp3([72, 9, 24], [68, 7, 19], u), bak: [58, 1.5, 6.3], fov: 40 }
  }
  // 28–38 sn: patlama sarsıntısı, ardından enkazdan yavaşça uzaklaşan kamera
  const s = 0.5 * Math.exp(-1.5 * (t - PT))
  const u = yumusat((t - PT) / (TOPLAM - PT))
  return {
    poz: ekle(lerp3([36, 12, -16], [26, 18, -34], u), [s * Math.sin(60 * t), s * Math.sin(47 * t + 1), s * Math.sin(53 * t + 2)]),
    bak: [59, lerp(3, 2.5, u), 6.3],
    fov: lerp(45, 40, u),
  }
}

export interface Altyazi {
  t0: number
  t1: number
  kim: 'MERKEZ' | 'DENİZ'
  metin: string
}

export const ALTYAZILAR: Altyazi[] = [
  { t0: 1.5, t1: 7.2, kim: 'MERKEZ', metin: 'TC-KRT, burası Merkez. Tıbbi malzeme uçuşunuz radarda, rota normal.' },
  { t0: 8.4, t1: 12.4, kim: 'DENİZ', metin: 'Mayday, mayday! [cızırtı] Sol motor yangını!' },
  { t0: 12.7, t1: 15.6, kim: 'DENİZ', metin: 'Yangın büyüyor, kuyruk kontrolünü kaybediyorum!' },
  { t0: 15.8, t1: 19.2, kim: 'MERKEZ', metin: 'Deniz! [cızırtı] Deniz, duyuyor musun?' },
  { t0: 19.5, t1: 23, kim: 'DENİZ', metin: 'Ağaçlara çarpacağım, tutun— [cızırtı]' },
  { t0: 28.8, t1: 32.8, kim: 'DENİZ', metin: '...Merkez... beni duyan var mı? [cızırtı]' },
  { t0: 33.4, t1: 37.4, kim: 'MERKEZ', metin: 'Tüm birimler: helikopter düşmüş olabilir. Deniz\'i bulmamız lazım.' },
]

/** Kelime kelime yazılan altyazı: süresinin ilk %75'inde tamamlanır. */
export function altyaziMetni(t: number): { kim: Altyazi['kim']; metin: string; kelime: number; anahtar: number } | null {
  const a = ALTYAZILAR.find((x) => t >= x.t0 && t < x.t1)
  if (!a) return null
  const k = a.metin.split(' ')
  const n = Math.max(1, Math.ceil(kelep((t - a.t0) / ((a.t1 - a.t0) * 0.75)) * k.length))
  return { kim: a.kim, metin: k.slice(0, n).join(' '), kelime: n, anahtar: a.t0 }
}
