import type { Bolge } from '../map/turkey'

/** Telsiz odası kamera önayarları (konumları public/oda/main.js içindeki `presets` belirler). */
export type Kamera = 'oda' | 'telsiz' | 'harita' | 'nuri' | 'ayse'

export const KAMERALAR: Record<Kamera, { ad: string }> = {
  oda: { ad: 'Oda' },
  telsiz: { ad: 'Telsiz' },
  harita: { ad: 'Harita' },
  nuri: { ad: 'Nuran' },
  ayse: { ad: 'Fatma' },
}

export type Tiklama = { bolge: Bolge; enlem: number; boylam: number }
