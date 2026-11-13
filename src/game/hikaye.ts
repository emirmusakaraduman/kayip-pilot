import type { Ortam } from './types'

/** Çözülen vaka sayısı eşiklerine bağlı Deniz mesajları: sinyal güçlendikçe konumu netleşir. */
export const KILOMETRE_TASLARI: { esik: number; satir: string }[] = [
  { esik: 1, satir: 'Deniz: Sesin geliyor, cızırtılı ama duyuyorum. Bırakma, devam et.' },
  { esik: 5, satir: 'Deniz: Yağmur biraz hafifledi. Telsiz de eskisinden net.' },
  { esik: 10, satir: 'Deniz: İpuçlarını birleştirdikçe nerede olduğumu sen de anlıyorsun, değil mi?' },
  { esik: 15, satir: 'Deniz: Bulutlar aralanıyor. Ufukta bir aydınlık seçiyorum.' },
  { esik: 20, satir: 'Deniz: Pilim idare ediyor. Sen cevap verdikçe ayakta kalıyorum.' },
  { esik: 25, satir: 'Deniz: Haritadaki izlerin bana kadar ulaştı. Yalnız değilim artık.' },
  { esik: 30, satir: 'Deniz: Sinyal neredeyse tam. Konumumu bu kadar net tarif edebildiğime inanamıyorum.' },
  { esik: 35, satir: 'Deniz: Şafak söküyor. Sana güveniyorum, çok az kaldı.' },
  { esik: 40, satir: 'Deniz: Sesini duyunca korkum geçiyor. Neredeyse oradasın.' },
  { esik: 45, satir: 'Deniz: Hepsini çözdün. Konumum artık kesin: gel ve beni bul!' },
]

/** İki çözülen-sayısı arasında yeni bir eşik aşıldıysa o eşiğin (en yüksek) satırını verir. */
export function kilometreSatiri(once: number, sonra: number): string | null {
  const gecen = KILOMETRE_TASLARI.filter((k) => once < k.esik && sonra >= k.esik)
  return gecen.length ? gecen[gecen.length - 1].satir : null
}

/** Sahne ilerlemesi 0..1 (şafak, sinyal çubukları). */
export function ilerlemeOrani(biten: number, toplam: number): number {
  return toplam > 0 ? Math.max(0, Math.min(1, biten / toplam)) : 0
}

/** Çözülen vakaların bölgelere göre sayısı (haritadaki kalıcı iz). Sahne anahtarlarıyla. */
export function izSayilari(ortamlar: Ortam[]): Record<string, number> {
  const harita: Record<Ortam, string> = { akdeniz: 'akdeniz', karadeniz: 'karadeniz', karasal: 'karasal', 'sert-karasal': 'sert' }
  const o: Record<string, number> = {}
  for (const x of ortamlar) o[harita[x]] = (o[harita[x]] ?? 0) + 1
  return o
}
