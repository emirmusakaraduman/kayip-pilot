// Takılıp çıkarılabilir varlık kaydı.
// GLB dosyasını public/models/ altına koy ve ilgili satırda `url` alanını doldur.
// url boşsa (null) yer tutucu şekil kullanılır.
// Yazar/kaynak/lisans alanlarını dosyayı verince doldur.
// NC (ticari olmayan) lisanslı varlıklar yalnızca `ncOnayli: true` ise yüklenir.

export type PlaceholderKind = 'helicopter' | 'tree-pine' | 'tree-broadleaf' | 'tree-palm' | 'person'

export interface AssetSlot {
  id: string
  etiket: string
  placeholder: PlaceholderKind
  /** Örn. '/models/helikopter.glb'. null = yer tutucu. */
  url: string | null
  /** Modelin ölçeği ve y ofseti (modele göre ayarlanır). */
  olcek?: number
  yOfset?: number
  yazar: string
  kaynak: string
  lisans: string
  /** Lisans NC ise ve bilerek kullanılacaksa true yap. */
  ncOnayli?: boolean
}

const bos = { yazar: '', kaynak: '', lisans: '' }

export const ASSETS = {
  helikopter: { id: 'helikopter', etiket: 'Helikopter (TC-KRT)', placeholder: 'helicopter', url: null, ...bos },
  agacCam: { id: 'agacCam', etiket: 'Ağaç: Çam', placeholder: 'tree-pine', url: null, ...bos },
  agacYaprakli: { id: 'agacYaprakli', etiket: 'Ağaç: Geniş yapraklı', placeholder: 'tree-broadleaf', url: null, ...bos },
  agacPalmiye: { id: 'agacPalmiye', etiket: 'Ağaç: Akdeniz/Zeytin', placeholder: 'tree-palm', url: null, ...bos },
  deniz: { id: 'deniz', etiket: 'Karakter: Deniz (pilot)', placeholder: 'person', url: null, ...bos },
  nuri: { id: 'nuri', etiket: 'Karakter: Nuri (meteorolog)', placeholder: 'person', url: null, ...bos },
  ayse: { id: 'ayse', etiket: 'Karakter: Ayşe (haritacı)', placeholder: 'person', url: null, ...bos },
} as const satisfies Record<string, AssetSlot>

export type AssetId = keyof typeof ASSETS

/** NC lisans taşıyıp onaylanmamış varlıkları engeller. */
export function yuklenebilirMi(slot: AssetSlot): boolean {
  if (!slot.url) return false
  const nc = /(^|[\s-])nc([\s-]|$)|noncommercial|non-commercial/i.test(slot.lisans)
  if (nc && !slot.ncOnayli) {
    console.warn(`[varlık] ${slot.id}: NC lisansı onaylanmadan kullanılamaz, yer tutucuya dönüldü.`)
    return false
  }
  return true
}

/** Başlık ekranındaki atıf satırı: yalnızca doldurulmuş varlıklar. */
export function atifSatiri(): string {
  return Object.values(ASSETS as Record<string, AssetSlot>)
    .filter((a) => a.url && a.yazar)
    .map((a) => `${a.etiket}: ${a.yazar} (${a.lisans}) — ${a.kaynak}`)
    .join(' · ')
}
