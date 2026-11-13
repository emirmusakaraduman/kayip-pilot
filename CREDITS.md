# CREDITS — Kayıp Pilot

Üçüncü taraf varlıklar ve veriler. Atıf, oyunda başlık ekranında da gösterilir (`src/assets/registry.ts` → `atifSatiri()`).
CC BY 4.0 gereği: eser adı, yazar, bağlantı, lisans ve **yapılan değişiklik** belirtilir.

## 3B modeller (CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/)

| Eser | Yazar | Kaynak | Lisans | Değişiklik |
|---|---|---|---|---|
| "Helicopter" | mohamed ouartassi | https://sketchfab.com/3d-models/helicopter-1172f6d424964e6388068076738be429 | CC BY 4.0 | Web için sadeleştirildi (üçgen sayısı ≈604 bin → ≈61 bin), dokular 1024 px WebP, meshopt sıkıştırma, gömülü animasyon silindi; rotorlar kodla döndürülüyor ve kopuyor. |
| "Realistic Male Character" (oyunda: Nuri) | adhamasalah | https://sketchfab.com/3d-models/realistic-male-character-c67725338c4d40fcafa5918009ccbc37 | CC BY 4.0 | Sadeleştirildi (≈642 bin → ≈31 bin üçgen), doku WebP, **kollar T-pozdan aşağı indirildi (ağ düzenlendi)**, sahnede yüzü +z'ye çevrildi. |
| "Female Character 2" (oyunda: Ayşe) | Empire's 3D | https://sketchfab.com/3d-models/female-character-2-5d139e8d106c425b9ab904674daa4fe5 | CC BY 4.0 | Sadeleştirildi (≈127 bin → ≈32 bin üçgen), dokular 1024 px WebP, **kemik pozu değiştirildi** (kollar indirildi, klavyeye uzatıldı), idle animasyonu kodla eklendi. |

Lisans bilgisi, yazar ve kaynak, dosyaların kendi `asset.extras` alanlarından alınmıştır. Dönüştürme: `scripts/glb-optimize.mjs` (ham dosyalar `.kaynak-modeller/`, repoda yok).

## Veri

| Veri | Kaynak | Not |
|---|---|---|
| Harita yükseklikleri | AWS Open Data "Terrain Tiles" (terrarium, z=7), Mapzen/Tilezen birleşik veri; SRTM (NASA/USGS) dâhil | Atıf kaynağı: https://github.com/tilezen/joerd/blob/master/docs/attribution.md · Üretim: `scripts/yukseklik-uret.mjs` |

## Kodla üretilenler (üçüncü taraf varlık yok)

Odadaki tüm eşyalar (masa, telsiz, defter, kavanoz, kupa, saat, lamba, pencere, perde, harita), tüm sesler (Web Audio), sinematik ve ağaç/helikopter yer tutucuları kodla üretilmiştir.

## Açık kaynak kütüphaneler

React, Three.js, React Three Fiber, drei, postprocessing, Zustand, Vite, Vitest, pngjs, sharp, glTF-Transform, meshoptimizer. Lisansları gönderim öncesi ayrıca gözden geçirilmelidir.

## NC (ticari olmayan) kuralı

CC BY-NC lisanslı varlıklar bilerek onaylanmadıkça kullanılmaz (`registry.ts` → `yuklenebilirMi`, test: `src/assets/registry.test.ts`).
