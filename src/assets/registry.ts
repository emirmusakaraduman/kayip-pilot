// Takılıp çıkarılabilir varlık kaydı.
// GLB dosyasını public/models/ altına koy ve ilgili satırda `url` alanını doldur.
// url boşsa (null) yer tutucu şekil kullanılır.
// Yazar/kaynak/lisans alanlarını dosyayı verince doldur.
// NC (ticari olmayan) lisanslı varlıklar yalnızca `ncOnayli: true` ise yüklenir.
//
// Ham modeller büyüktür; web için `node scripts/glb-optimize.mjs` ile küçültülür
// (kaynak: .kaynak-modeller/, çıktı: public/models/).

export type PlaceholderKind = 'helicopter' | 'tree-pine' | 'tree-broadleaf' | 'tree-palm' | 'person'

export interface AssetSlot {
  id: string
  etiket: string
  placeholder: PlaceholderKind
  /** Örn. '/models/helikopter.glb'. null = yer tutucu. */
  url: string | null

  // ── Yerleşim: model yüklenince sınır kutusundan otomatik ortalanır, ölçeklenir ve yere oturtulur ──
  /** Modelin yüksekliği (metre ≈ sahne birimi) bu değere ölçeklenir (karakterler). */
  hedefBoy?: number
  /** Yatay en uzun boyut (x veya z) bu değere ölçeklenir (helikopter). hedefBoy yoksa kullanılır. */
  hedefUzunluk?: number
  /** Modeli ileri yönü +z olacak şekilde çevirmek için Y ekseni dönüşü (radyan). */
  donusY?: number
  /** Ölçekten sonra modelin tabanının y konumu (varsayılan 0). */
  taban?: number
  /** Model içindeki adlandırılmış parçalar (sinematikte rotor döndürmek/koparmak için). */
  parcalar?: Record<string, string>
  /** Sinematikte yangının çıkacağı nokta (modelin yerel, ölçeklenmiş koordinatlarında). */
  motorNoktasi?: [number, number, number]

  // ── Atıf (CC-BY gibi lisanslar için gerekli) ──
  baslik?: string
  yazar: string
  kaynak: string
  lisans: string
  /** Dosya düzenlendiyse (sadeleştirme vb.) atıfta belirtilir; CC-BY bunu ister. */
  degistirildi?: boolean
  /** Lisans NC ise ve bilerek kullanılacaksa true yap. */
  ncOnayli?: boolean
}

const bos = { yazar: '', kaynak: '', lisans: '' }
const CC_BY = 'CC BY 4.0 (creativecommons.org/licenses/by/4.0)'

export const ASSETS = {
  helikopter: {
    id: 'helikopter',
    etiket: 'Helikopter (TC-KRT)',
    placeholder: 'helicopter',
    url: '/models/helikopter.glb',
    hedefUzunluk: 9,
    taban: -0.7,
    parcalar: { anaRotor: 'Empty_84', kuyrukRotor: 'Empty.003_41' },
    motorNoktasi: [0.55, 0.95, -0.2],
    baslik: 'Helicopter',
    yazar: 'mohamed ouartassi',
    kaynak: 'https://sketchfab.com/3d-models/helicopter-1172f6d424964e6388068076738be429',
    lisans: CC_BY,
    degistirildi: true,
  },
  agacCam: { id: 'agacCam', etiket: 'Ağaç: Çam', placeholder: 'tree-pine', url: null, ...bos },
  agacYaprakli: { id: 'agacYaprakli', etiket: 'Ağaç: Geniş yapraklı', placeholder: 'tree-broadleaf', url: null, ...bos },
  agacPalmiye: { id: 'agacPalmiye', etiket: 'Ağaç: Akdeniz/Zeytin', placeholder: 'tree-palm', url: null, ...bos },
  deniz: { id: 'deniz', etiket: 'Karakter: Deniz (pilot)', placeholder: 'person', url: null, ...bos },
  nuri: {
    id: 'nuri',
    etiket: 'Karakter: Nuri (meteorolog)',
    placeholder: 'person',
    url: '/models/nuri.glb',
    hedefBoy: 1.75,
    donusY: -Math.PI / 2, // model +x'e bakıyor; sahnede +z'ye çevrilir
    baslik: 'Realistic Male Character',
    yazar: 'adhamasalah',
    kaynak: 'https://sketchfab.com/3d-models/realistic-male-character-c67725338c4d40fcafa5918009ccbc37',
    lisans: CC_BY,
    degistirildi: true,
  },
  ayse: {
    id: 'ayse',
    etiket: 'Karakter: Ayşe (haritacı)',
    placeholder: 'person',
    url: '/models/ayse.glb',
    hedefBoy: 1.7,
    baslik: 'Female Character 2',
    yazar: "Empire's 3D",
    kaynak: 'https://sketchfab.com/3d-models/female-character-2-5d139e8d106c425b9ab904674daa4fe5',
    lisans: CC_BY,
    degistirildi: true,
  },
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
    .map((a) => `${a.etiket}: «${a.baslik ?? a.etiket}», ${a.yazar}, ${a.lisans}, ${a.kaynak}${a.degistirildi ? ' (web için sadeleştirildi)' : ''}`)
    .join(' · ')
}
