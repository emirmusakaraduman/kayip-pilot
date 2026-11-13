# Soru sistemi: uygulama planı

Hedef: Telsiz odasındaki masada artık tek bir iklim sorusu değil, **altı cevap türüyle çözülen, konu konu ve vaka vaka değişen** bir soru sistemi çalışsın. Masadaki Türkiye haritası yalnızca haritayla çözülen türlerde (pin, harita rotası) görünür.

Hazır olan: `src/questions/` (motor, altı tür, doğrulayıcılar, panel arayüzü, coğrafya katmanı, eş yükselti), `data/vakalar/` (19 örnek vaka), `tests/` (79 test). **Eksik olan: sahne köprüsü (`KPScene`), haritanın nötr modu, telsiz ekranı bağlantısı ve 45 vakanın içeriği.**

Her adımda: önce `node tests/run.js` (yeşil), sonra tarayıcıda dene. Bir adım bitmeden diğerine geçme. Bitince kısa özet ver.

## Mimari (değiştirme)

```
vaka (JSON)  ->  KP.engine  ->  KP.types[tür].mount/validate  ->  KP.ui (panel)
                    |                      |
                    |                      +--> KP.scene (KPScene)  <-- main.js'in köprüsü (SEN YAZACAKSIN)
                    +--> pil, jeton, ipucu, yanlış defteri, kayıt (localStorage 'kp_save_v1')
```
- Motor sahneyi **yalnızca `KP.scene` (= `window.KPScene`) üzerinden** çağırır. Motor three.js bilmez.
- Doğrulayıcılar saf fonksiyondur ve Node'da test edilir. Sahne ve tarayıcıdan bağımsız kalmalı.
- Düz script, derleme yok. React/Vite'a geçme.

## KPScene sözleşmesi (main.js'in sağlaması gereken)

`main.js` içinde (animasyon döngüsünden önce) `window.KPScene = { ... }` tanımla. Hepsi isteğe bağlıdır ama aşağıdaki işlevler çalışmalı:

| İşlev | Ne yapar |
|---|---|
| `setBattery(pct)` | `state.pil = pct; updateBattery();` |
| `setCoins(n)` | jeton kavanozundaki "N jeton" etiketini günceller |
| `setCamera(ad)` | `setCam('oda' \| 'telsiz' \| 'harita')` |
| `radioShow(satırlar[])` | telsiz ekranında mesajları sırayla daktilo yazısıyla yazar (aşağıya bak) |
| `flash('right'\|'wrong')` | yanlışta mevcut `triggerFlash()`; doğruda yeşil LED titreşimi |
| `setMapMode(mod, board)` | `'climate'` (renkli bölgeler, etiketler, vurgu), `'neutral'` (renksiz harita, etiket ve bölge vurgusu yok), `'hidden'` (`mapG.visible = false`) |
| `enableMapPick(cb)` / `disableMapPick()` | haritaya dokununca `cb({lat, lon, x, y, zone})` çağırır |
| `addMarker(lat, lon)` / `clearMarkers()` | haritada kırmızı iğne |
| `drawRoute(noktalar[{lat,lon}])` / `clearRoute()` | haritada amber rota (tüp) ve nokta topları |
| `showEndpoints(board)` | başlangıç (yeşil A), varış (kırmızı B), ara noktalar (beyaz halka), yasak daireler (kırmızı yarı saydam) |
| `openNotebookPage(n)` | defter katmanını n. sayfada açar (sayfa içeriği 5. adımda) |

### main.js'te yapılacak yamalar (satır numaraları yaklaşık, önce oku)

1. **Nokta bilgisi.** `pick(ev)` (≈1404) yalnızca bölge adı döndürüyor. Isabet noktasını da sakla:
   ```js
   var lastPickPt = null;                       // pick'in üstüne
   // pick içinde, döngüden sonraki if'te (döngü isabette break ettiği için wx, wz isabet noktasıdır):
   if (cv < 5 && tHit > 0 && tHit < bestD) { best = ZKEY[cv]; bestD = tHit; lastPickPt = { x: wx, y: -wz, zone: ZKEY[cv] }; }
   else if (best !== 'notebook') lastPickPt = null;
   ```
   `x` doğu, `y` kuzey yönünde metre (harita levhasının merkezinden). Dönüşüm: `KP.geo.localToLatLon(x, y)`.
2. **Tıklama.** Mevcut `pointerup` işleyicisinde (≈1440-1455, `state.selected = z` satırının olduğu yer) en başa ekle: `KPS.pickCb` varsa ve `lastPickPt` doluysa `KP.geo.localToLatLon` ile `cb({...})` çağır ve **eski seçim mantığını atla**.
3. **Vurgu.** Bölge kabartma ve amber çerçeve döngüsünde (≈1620-1640) `KPS.mode !== 'climate'` iken bölge yükseltme/vurgu yapma.
4. **Nötr harita.** Bölge malzemelerine (`texMats`) `onBeforeCompile` ekle: `#include <map_fragment>` satırının ardına `float lum = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(1.05,1.0,0.9), uNeutral);` yaz ve `uNeutral` değerini mod değişince 0 ↔ 1 arasında yumuşakça geçir (çerçeve döngüsünde). Bölge etiketi sprite'larını (`zoneInfo[k].sprite`) `neutral` modda gizle. Bu yöntem harita dokusunu yeniden üretmeden iklim renklerini gizler.
5. **İğne ve rota konumu.** Dünya konumu: `new THREE.Vector3(MAP_X + x, DY + yükseklik + 0.02, MAP_Z - y)`; `yükseklik = gridH[satır*GW + sütun] / 255 * 0.30` (pick'teki hesapla aynı, `u = x/PWm + 0.5`, `v = y/PHm + 0.5`, `satır = floor((1-v)*GH)`, `sütun = floor(u*GW)`).
6. **Telsiz ekranı.** `MSG`, `LINES` (`wrapText(MSG, 36)`), `TOTAL` değişkenleri `var` ile tanımlı, yeniden atanabilir. `radioShow(satırlar)`: kuyruğa al, ilk mesajı `MSG` yap, `LINES = wrapText(MSG, 36); TOTAL = MSG.length + 2; typed = 0; holdT = 0;`. Mevcut `holdT > 7` sıfırlama mantığı (≈1701) aynı mesajı baştan yazıyor; bunun yerine kuyruktaki **sonraki mesaja** geç, sona gelince başa dön. Ekran yaklaşık 7 satır alır, uzun mesajlar sığmazsa uyar.
7. **Eski demoyu kapat.** `sendBtn` işleyicisi (≈1482) ve `refreshHud` eski akışta kalmasın: `KP.engine.active` iken `.hud-bottom` gizlensin (`document.body.classList.add('kp-on')` ve CSS `.kp-on .hud-bottom{display:none}`), `sendBtn` işleyicisi erken dönsün. Eski demo istenirse `?eski=1` ile çalışsın.
8. **Başlatma.** Sahne hazır olunca: `KP.geo.setMapData(window.MAP_DATA); KP.scene = window.KPScene; KP.engine.load(); KP.engine.addCases(window.KP_CASES); KP.engine.start();`

## Adımlar ve kabul ölçütleri

**Adım 0 (hazırlık).** `CLAUDE.md`, `docs/*.md` oku. `node tests/run.js` yeşil. `npx serve` ile mevcut sahne açılıyor. *Kabul:* sahneyi bozmadan çalıştırdığını raporla.

**Adım 1 (köprü ve pin, iklim bölgesi).** KPScene'i yaz: batarya, kamera, telsiz, flash, `setMapMode('climate')`, `enableMapPick`, `addMarker`. `iklim-01-akdeniz-pin` vakası panelle çözülsün. *Kabul:* haritaya dokununca panelde "Seçtiğin yer: ..." yazıyor, Gönder doğru bölgede ✓, yanlışta pil %5 düşüyor ve telsiz ekranında ve pil göstergesinde görünüyor, ipucu jeton düşürüyor.

**Adım 2 (nötr harita ve nokta cevapları).** `neutral` mod (renksiz harita, etiket yok, vurgu yok). `konum-01-gps-adana` ve `dis-01-peribacalari-pin`. *Kabul:* nötr modda harita bölge renklerini göstermiyor ve bölgeler yükselmiyor; nokta cevabı yarıçap içinde doğru, dışında "Yakınsın" ya da "uzak".

**Adım 3 (haritasız türler).** `number`, `cards`, `graph`, `decision` vakaları (örnek vakaların hepsi) panelden çözülsün, harita `hidden` olsun ve kamera `telsiz`e gitsin. *Kabul:* her tür için en az bir örnek vaka baştan sona oynanıyor; klavye ile (Tab, Enter) oynanabiliyor; mobilde (390 px) panel taşmıyor.

**Adım 4 (rota).** `drawRoute`, `showEndpoints`; harita rotası (`ulasim-01-dogu-koridoru-rota`) ve eş yükselti rotası (`harita-02-esyukselti-rota`). *Kabul:* nokta ekle, son noktayı sil, temizle çalışıyor; kontur panosunda çizgiler görünüyor ve canlı tırmanış değeri güncelleniyor.

**Adım 5 (ekonomi ve kalıcılık).** Jeton kavanozu etiketi, yanlış defteri (en son 100 yanlış, `KP.engine.state.wrong`), defter sayfaları: çözülen vaka `reward.notebookPage` sayfasını açar, sayfa metinleri `data/defter/sayfalar.json`'dan. Sayfa yenilenince kayıt korunur. *Kabul:* sayfa yenilenince pil, jeton, çözülenler korunuyor.

**Adım 6 (içerik, en uzun adım).** `docs/ICERIK_KURALLARI.md` ve `docs/VAKA_SEMASI.md`'ye göre **15 konu × 3 zorluk = 45 vaka**. Konu başına bir dosya: `data/vakalar/konu-adi.json`. Her vakada `selfTest` zorunlu. Her konu bitince `node tools/build_vakalar.js && node tests/run.js && node tests/coverage.js`. *Kabul:* testler yeşil, kapsama 45/45, `source.status: "dogrulanacak"` olan vakaların listesi kullanıcıya verildi.

**Adım 7 (cila).** Hata durumları (harita yüklenmedi, localStorage kapalı), performans, `prefers-reduced-motion`, odak halkaları. Sunum akışı: ilk vaka otomatik başlasın.

## Kurallar (bozma)

1. **Test yeşil değilse bitti sayma.** Doğrulayıcı davranışını değiştirirsen testi de güncelle ve nedenini yaz.
2. **Her vakada `selfTest`.** Eksik vaka eklenmez.
3. **Türü konuya uydur** (`KP.TYPE_TOPICS`). Tabloyu değiştirmek istersen önce kullanıcıya sor.
4. **Haritada gerçek yükseklik yok.** Yükselti/eğim sorularını 3D haritaya dayandırma, kontur panosu (sentetik arazi) kullan.
5. **Uydurma yok.** Emin olmadığın coğrafya bilgisine `dogrulanacak` yaz.
6. **Mevcut görünüm bozulmasın:** oda, ışıklar, karakterler, harita dokusu, kamera, defter aynı kalır. Değişiklikleri küçük tut.
7. **Erişilebilirlik:** her etkileşim klavye ile, dokunma hedefi en az 44 px, `aria-*` alanları korunur.
8. **Yeni bağımlılık ekleme** (kütüphane, framework). Düz JS.
