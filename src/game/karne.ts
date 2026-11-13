import type { KonuId } from './types'

/** Bir vakanın öğrenme kaydı: Leitner kutuları ile aralıklı tekrar. */
export interface VakaIst {
  dogru: number
  yanlis: number
  /** 0 = yeni/yanlış, 4 = iyi öğrenilmiş. */
  kutu: number
  /** Bu zamandan sonra tekrar önerilir (ms). */
  sonraki: number
  son: number
}

/** Kutu başına tekrar aralığı (gün). Kutu 0: hemen. */
export const ARALIK_GUN = [0, 1, 3, 7, 14]
const GUN = 24 * 60 * 60 * 1000

const BOS: VakaIst = { dogru: 0, yanlis: 0, kutu: 0, sonraki: 0, son: 0 }

export function dogruIsle(i: VakaIst | undefined, simdi: number): VakaIst {
  const o = i ?? BOS
  const kutu = Math.min(ARALIK_GUN.length - 1, o.kutu + 1)
  return { dogru: o.dogru + 1, yanlis: o.yanlis, kutu, sonraki: simdi + ARALIK_GUN[kutu] * GUN, son: simdi }
}

export function yanlisIsle(i: VakaIst | undefined, simdi: number): VakaIst {
  const o = i ?? BOS
  return { dogru: o.dogru, yanlis: o.yanlis + 1, kutu: 0, sonraki: simdi, son: simdi }
}

/** Tekrar zamanı gelen vakalar; en çok gecikmiş olan önce. */
export function tekrarGelenler(ist: Record<string, VakaIst>, simdi: number): string[] {
  return Object.entries(ist)
    .filter(([, v]) => v.sonraki <= simdi)
    .sort((a, b) => a[1].sonraki - b[1].sonraki)
    .map(([id]) => id)
}

export interface KonuKarne {
  konu: KonuId
  /** Bu konuda çözülen vaka / toplam vaka. */
  cozulen: number
  toplam: number
  /** Doğru cevap oranı (0..1); hiç deneme yoksa null. */
  oran: number | null
  /** Tekrarı gelmiş vaka sayısı. */
  tekrar: number
}

export function konuKarnesi(
  ist: Record<string, VakaIst>,
  biten: string[],
  vakalar: { id: string; konu: KonuId }[],
  simdi: number,
): KonuKarne[] {
  const konular = [...new Set(vakalar.map((v) => v.konu))]
  return konular.map((konu) => {
    const ids = vakalar.filter((v) => v.konu === konu).map((v) => v.id)
    let d = 0
    let y = 0
    let tekrar = 0
    for (const id of ids) {
      const k = ist[id]
      if (!k) continue
      d += k.dogru
      y += k.yanlis
      if (k.sonraki <= simdi) tekrar++
    }
    return {
      konu,
      cozulen: ids.filter((id) => biten.includes(id)).length,
      toplam: ids.length,
      oran: d + y > 0 ? d / (d + y) : null,
      tekrar,
    }
  })
}
