// Zemin dokuları ve gökyüzü yansıması için takılabilir altyapı.
// Dosyayı public/ altına koyup aşağıdaki alanı doldurmak yeterli; null iken kodla üretilen yer tutucu kullanılır.
//
//   Zemin (PBR):  ambientCG / Poly Haven gibi kaynaklardan toprak-çimen seti indirip
//                 public/dokular/zemin/ içine koy → renk, normal, pürüz alanlarını doldur.
//   Gökyüzü:      .hdr dosyasını public/dokular/ içine koy → HDRI_URL'yi doldur.
//
// Lisansı CC0 olmayan dosyaları CREDITS.md'ye eklemeyi unutma.

export const ZEMIN_DOKU: { renk: string | null; normal: string | null; puruz: string | null; tekrar: number } = {
  renk: null, // örn. '/dokular/zemin/renk.jpg'
  normal: null, // örn. '/dokular/zemin/normal.jpg'
  puruz: null, // örn. '/dokular/zemin/puruz.jpg'
  tekrar: 12, // arazi boyunca doku tekrarı
}

/** Helikopter ve zemin yansıması için HDRI. null = ışık levhalarından üretilen yer tutucu ortam. */
export const HDRI_URL: string | null = null
