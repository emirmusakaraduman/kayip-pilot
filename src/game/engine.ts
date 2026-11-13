import type { Cevap, Verilen, Zorluk } from './types'

export const PIL_CEZASI = 5 // yanlış cevap: %5
export const JETON = { ipucu: 1, pilDoldur: 2, ekHak: 3 } as const

export interface Sonuc {
  dogru: boolean
}

function kmMesafe([x1, y1]: [number, number], [x2, y2]: [number, number]): number {
  // Harita koordinatları (enlem, boylam) derece cinsinden varsayılır.
  const dy = (y2 - y1) * 111 * Math.cos((((x1 + x2) / 2) * Math.PI) / 180)
  const dx = (x2 - x1) * 111
  return Math.hypot(dx, dy)
}

const ayniKume = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/** Tek cevap motoru: her vaka türü buradan geçer. */
export function degerlendir(cevap: Cevap, verilen: Verilen): Sonuc {
  switch (cevap.tur) {
    case 'secenek':
    case 'karar':
    case 'grafik':
      return { dogru: 'indeks' in verilen && verilen.indeks === cevap.dogru }
    case 'sayi':
      return { dogru: 'deger' in verilen && Math.abs(verilen.deger - cevap.dogru) <= cevap.tolerans }
    case 'harita-bolge':
      return { dogru: 'bolgeler' in verilen && ayniKume(verilen.bolgeler, cevap.dogruBolgeler) }
    case 'harita-nokta':
      return { dogru: 'nokta' in verilen && kmMesafe(verilen.nokta, cevap.hedef) <= cevap.yaricapKm }
    case 'rota':
      return { dogru: 'sira' in verilen && verilen.sira.join('>') === cevap.dogruSira.join('>') }
  }
}

/** Pil %: yanlışta düşer, 0'ın altına inmez. */
export const pilYanlis = (pil: number) => Math.max(0, pil - PIL_CEZASI)

/** Parazit seviyesi 0..1: pil %50'nin altına inince artar. */
export const parazit = (pil: number) => Math.min(1, Math.max(0, (50 - pil) / 50))

/** Zorluk uyarlaması: art arda yanlışta kolaya, art arda doğruda zora öner. */
export function zorlukOner(mevcut: Zorluk, ardisikDogru: number, ardisikYanlis: number): Zorluk {
  const sira: Zorluk[] = ['kolay', 'orta', 'zor']
  const i = sira.indexOf(mevcut)
  if (ardisikYanlis >= 2) return sira[Math.max(0, i - 1)]
  if (ardisikDogru >= 3) return sira[Math.min(2, i + 1)]
  return mevcut
}

/** Bitirme jetonu: ipucusuz bitirene bonus. */
export const bitirmeJetonu = (ipucuKullandi: boolean) => (ipucuKullandi ? 1 : 2)
