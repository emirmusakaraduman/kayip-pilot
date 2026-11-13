import type { KonuId, Zorluk } from './types'

/**
 * Soru sistemi (public/oda/src/questions) köprüsü. Gömülü iframe `?kp=bridge` ile açılır;
 * React vakayı ister, iframe olayları (doğru/yanlış/durum) geri yollar. Kayıt React deposunda (useOyun) kalır.
 */

/** React konu kodu → soru sisteminin konu kodu. */
export const KP_KONU: Record<KonuId, string> = {
  'dunya-sekli': 'dunya-sekli-hareketleri',
  'cografi-konum': 'cografi-konum',
  harita: 'harita-bilgisi',
  'iklim-elemanlari': 'iklim-elemanlari',
  'iklim-bitki': 'iklim-tipleri',
  'ic-kuvvetler': 'ic-kuvvetler',
  'dis-kuvvetler': 'dis-kuvvetler',
  'kayac-toprak': 'kayaclar-topraklar',
  'su-kaynaklari': 'su-kaynaklari',
  'turkiye-yer-iklim': 'turkiye-yer-sekilleri-iklimi',
  'nufus-yerlesme': 'nufus-yerlesme',
  goc: 'goc',
  ekonomi: 'ekonomik-faaliyetler',
  ulasim: 'ulasim',
  'dogal-afet': 'dogal-afetler',
}

export const KP_ZORLUK: Record<Zorluk, number> = { kolay: 1, orta: 2, zor: 3 }

/** React'in iframe'e verdiği istek: hangi konu/zorluk, hangi pil-jeton durumuyla. */
export interface KpIstek {
  /** Her istekte artar; aynı vakayı yeniden başlatmak için. */
  sayac: number
  vakaId: string
  konu: KonuId
  zorluk: Zorluk
  pil: number
  jeton: number
  tekrar: boolean
}

/** iframe'in React'e yolladığı olaylar. */
export type KpOlay =
  | { tur: 'durum'; pil: number; jeton: number }
  | { tur: 'dogru'; pil: number; jeton: number; kpId: string; kazanc: number }
  | { tur: 'yanlis'; pil: number; jeton: number; kpId: string; deneme: number }
  | { tur: 'basla'; kpId: string; kamera: string }
  | { tur: 'bitti' }
  | { tur: 'yok'; konu: string; zorluk: number }
  | { tur: 'hazir'; vakalar: number }
