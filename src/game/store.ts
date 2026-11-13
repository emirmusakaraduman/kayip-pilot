import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KonuId } from './types'
import { JETON, pilYanlis } from './engine'
import { dogruIsle, yanlisIsle, type VakaIst } from './karne'

interface Durum {
  pil: number
  jeton: number
  defter: KonuId[] // kazanılmış sayfalar
  bitenVakalar: string[]
  yanlisDefteri: string[] // yanlış yapılan vaka id'leri
  istatistik: Record<string, VakaIst> // vaka başına doğru/yanlış sayısı ve aralıklı tekrar kutusu
  sesAcik: boolean
  girisIzlendi: boolean
  aramaIlerleme: number // Büyük Arama'da tamamlanan aşama sayısı
  aramaBitti: boolean
  yanlisYap: (vakaId: string) => void
  vakaBitir: (vakaId: string, konu: KonuId, jeton: number) => void
  ipucuAl: () => boolean
  pilDoldur: () => boolean
  sesDegistir: () => void
  girisBitti: () => void
  aramaAsamaBitir: (jeton: number, son: boolean) => void
  aramaYenidenBasla: () => void
  /** Soru sistemi köprüsü: pil ve jeton iframe motorundan gelir (mutlak değer). */
  kpSenkron: (pil: number, jeton: number) => void
  /** Soru sistemi: vaka çözüldü (jeton kpSenkron ile güncellendi; yalnızca defter ve biten kaydı). */
  kpDogru: (vakaId: string, konu: KonuId) => void
  /** Soru sistemi: yanlış defterine yaz (pil kpSenkron ile geldi). */
  kpYanlis: (vakaId: string) => void
}

export const useOyun = create<Durum>()(
  persist(
    (set, get) => ({
      pil: 100,
      jeton: 3,
      defter: [],
      bitenVakalar: [],
      yanlisDefteri: [],
      istatistik: {},
      sesAcik: true,
      girisIzlendi: false,
      aramaIlerleme: 0,
      aramaBitti: false,
      yanlisYap: (vakaId) =>
        set((s) => ({
          pil: pilYanlis(s.pil),
          istatistik: { ...s.istatistik, [vakaId]: yanlisIsle(s.istatistik[vakaId], Date.now()) },
          yanlisDefteri: s.yanlisDefteri.includes(vakaId) ? s.yanlisDefteri : [...s.yanlisDefteri, vakaId],
        })),
      vakaBitir: (vakaId, konu, jeton) =>
        set((s) => ({
          jeton: s.jeton + jeton,
          istatistik: { ...s.istatistik, [vakaId]: dogruIsle(s.istatistik[vakaId], Date.now()) },
          bitenVakalar: s.bitenVakalar.includes(vakaId) ? s.bitenVakalar : [...s.bitenVakalar, vakaId],
          defter: s.defter.includes(konu) ? s.defter : [...s.defter, konu],
        })),
      ipucuAl: () => {
        if (get().jeton < JETON.ipucu) return false
        set((s) => ({ jeton: s.jeton - JETON.ipucu }))
        return true
      },
      pilDoldur: () => {
        if (get().jeton < JETON.pilDoldur) return false
        set((s) => ({ jeton: s.jeton - JETON.pilDoldur, pil: 100 }))
        return true
      },
      sesDegistir: () => set((s) => ({ sesAcik: !s.sesAcik })),
      girisBitti: () => set({ girisIzlendi: true }),
      // Büyük Arama defter sayfası kazandırmaz (sayfalar yalnızca Konu Modu ile açılır).
      aramaAsamaBitir: (jeton, son) =>
        set((s) => ({ jeton: s.jeton + jeton, aramaIlerleme: s.aramaIlerleme + 1, aramaBitti: s.aramaBitti || son })),
      aramaYenidenBasla: () => set({ aramaIlerleme: 0, aramaBitti: false }),
      kpSenkron: (pil, jeton) => set({ pil: Math.max(0, Math.min(100, Math.round(pil))), jeton: Math.max(0, Math.round(jeton)) }),
      kpDogru: (vakaId, konu) =>
        set((s) => ({
          istatistik: { ...s.istatistik, [vakaId]: dogruIsle(s.istatistik[vakaId], Date.now()) },
          bitenVakalar: s.bitenVakalar.includes(vakaId) ? s.bitenVakalar : [...s.bitenVakalar, vakaId],
          defter: s.defter.includes(konu) ? s.defter : [...s.defter, konu],
        })),
      kpYanlis: (vakaId) => set((s) => ({ istatistik: { ...s.istatistik, [vakaId]: yanlisIsle(s.istatistik[vakaId], Date.now()) }, yanlisDefteri: s.yanlisDefteri.includes(vakaId) ? s.yanlisDefteri : [...s.yanlisDefteri, vakaId] })),
    }),
    { name: 'kayip-pilot-v1' },
  ),
)
