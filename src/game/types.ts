export type Zorluk = 'kolay' | 'orta' | 'zor'
export type Ortam = 'akdeniz' | 'karadeniz' | 'karasal' | 'sert-karasal'

export type KonuId =
  | 'dunya-sekli' | 'cografi-konum' | 'harita' | 'iklim-elemanlari' | 'iklim-bitki'
  | 'ic-kuvvetler' | 'dis-kuvvetler' | 'kayac-toprak' | 'su-kaynaklari' | 'turkiye-yer-iklim'
  | 'nufus-yerlesme' | 'goc' | 'ekonomi' | 'ulasim' | 'dogal-afet'

export interface Konu {
  id: KonuId
  ad: string
  sayfa: number // defter sayfa numarası 1..15
}

/** Cevap türleri: tek motor hepsini değerlendirir. */
export type Cevap =
  | { tur: 'secenek'; secenekler: string[]; dogru: number }
  | { tur: 'sayi'; dogru: number; tolerans: number; birim?: string }
  | { tur: 'harita-bolge'; dogruBolgeler: string[] }
  | { tur: 'harita-nokta'; hedef: [number, number]; yaricapKm: number }
  | { tur: 'rota'; dogruSira: string[] }
  | { tur: 'karar'; secenekler: string[]; dogru: number }
  | { tur: 'grafik'; secenekler: string[]; dogru: number }

export type Verilen =
  | { tur: 'secenek' | 'karar' | 'grafik'; indeks: number }
  | { tur: 'sayi'; deger: number }
  | { tur: 'harita-bolge'; bolgeler: string[] }
  | { tur: 'harita-nokta'; nokta: [number, number] }
  | { tur: 'rota'; sira: string[] }

export interface Vaka {
  id: string // örn. 'iklim-bitki-kolay'
  konu: KonuId
  zorluk: Zorluk
  ortam: Ortam
  baslik: string
  /** Deniz'in telsizle tarif ettiği ipuçları (sırayla yazılır). */
  telsiz: string[]
  /** Nuran / Fatma ipucu metinleri (her biri 1 jeton). */
  ipucuNuri?: string
  ipucuAyse?: string
  soru: string
  cevap: Cevap
  /** Yanlış cevaptan sonra gösterilen kısa açıklama. */
  aciklama: string
}

export interface DefterSayfasi {
  konu: KonuId
  metin: string
}
