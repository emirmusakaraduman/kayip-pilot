import { create } from 'zustand'
import { KONULAR } from '../data/topics'
import type { KonuId, Vaka } from './types'

/** Masadaki Konu Defteri'nin arayüz durumu (kalıcı değil): açık mı, hangi konu ve hangi vaka seçili. */
interface DefterUI {
  acik: boolean
  seciliKonu: KonuId
  seciliVaka: Vaka | null
  ac: () => void
  kapat: () => void
  degistir: () => void
  konuSec: (k: KonuId) => void
  /** Vaka kağıdına tıklanınca seçimi tutar; görevi başlatan işlevi çağıran bileşen (KonuDefteri onSec) tetikler. */
  vakaSec: (v: Vaka | null) => void
}

export const useDefterUI = create<DefterUI>()((set) => ({
  acik: false,
  seciliKonu: KONULAR[0].id,
  seciliVaka: null,
  ac: () => set({ acik: true }),
  kapat: () => set({ acik: false }),
  degistir: () => set((s) => ({ acik: !s.acik })),
  konuSec: (k) => set({ seciliKonu: k, seciliVaka: null }),
  vakaSec: (v) => set({ seciliVaka: v }),
}))
