# Vaka şeması

Her vaka `data/vakalar/*.json` içinde bir nesnedir. Dosya biçimi: `{ "surum": 1, "vakalar": [ ... ] }`.
Yeni vaka yazınca: `node tools/build_vakalar.js` (tarayıcı için `vakalar.js` üretir) ve `node tests/run.js` (hepsi yeşil olmalı).
Kapsamı görmek için: `node tests/coverage.js`.

## Ortak alanlar (hepsi zorunlu)

| Alan | Kural |
|---|---|
| `id` | küçük harf ve tire, örn. `iklim-01-akdeniz-pin`. Benzersiz. |
| `topic` | 15 konu kodundan biri (aşağıda). |
| `difficulty` | 1 kolay, 2 orta, 3 zor. |
| `type` | `pin`, `number`, `cards`, `route`, `decision`, `graph`. Konuya uygun olmalı (tablo aşağıda), doğrulayıcı reddeder. |
| `title` | en çok 60 karakter, kısa ve merak uyandıran. |
| `radio` | 1-4 telsiz mesajı. Her biri en çok 240 karakter. Deniz'in ağzından, ipucu verir, cevabı söylemez. |
| `question` | oyuncuya net görev cümlesi, en çok 140 karakter. |
| `hints` | 2-3 ipucu. `{from:"nuri"|"ayse", text, cost?, eliminate?}`. Her ipucu bir öncekinden daha açık. |
| `feedback` | `correct` (Deniz'in kısa tepkisi), `wrong` (ipucu niteliğinde, cevabı açıklamaz), `explain` (en çok 2 cümle, kural + hesap). |
| `reward` | `{jeton: 1-4, notebookPage?: sayı}` |
| `source` | `{status:"dogrulandi"|"dogrulanacak", note}`. Emin olmadığın bilgi için `dogrulanacak`. |
| `selfTest` | `{correct:[...], wrong:[...]}`. Cevap nesneleri `getAnswer()` çıktısıyla aynı biçimde. En az 1 doğru, 1 yanlış. |

Konu kodları: `dunya-sekli-hareketleri`, `cografi-konum`, `harita-bilgisi`, `iklim-elemanlari`, `iklim-tipleri`, `ic-kuvvetler`, `dis-kuvvetler`, `kayaclar-topraklar`, `su-kaynaklari`, `turkiye-yer-sekilleri-iklimi`, `nufus-yerlesme`, `goc`, `ekonomik-faaliyetler`, `ulasim`, `dogal-afetler`.

## Hangi tür hangi konuya (tasarım tablosu, kodda `KP.TYPE_TOPICS`)

| Tür | Nasıl çalışır | Uyan konular |
|---|---|---|
| `pin` | Oyuncu Deniz'in konumunu haritada işaretler | cografi-konum, iklim-tipleri, dis-kuvvetler, kayaclar-topraklar, turkiye-yer-sekilleri-iklimi, ekonomik-faaliyetler |
| `number` | Hesabı yapıp değeri yazar | dunya-sekli-hareketleri (enlem), cografi-konum (boylam), harita-bilgisi (ölçek), iklim-elemanlari (yükselti) |
| `cards` | 3-4 karttan doğrusunu seçer | ic-kuvvetler, su-kaynaklari, nufus-yerlesme, goc |
| `route` | Rota çizer (haritada ya da eş yükselti panosunda) | harita-bilgisi (eş yükselti), ulasim |
| `decision` | Senaryoda Deniz'e ne yapacağını söyler | dogal-afetler, ulasim |
| `graph` | Grafikte nokta seçer ya da yorumlar | iklim-tipleri (yağış-sıcaklık), goc (nüfus piramidi) |

## Türe özel alanlar

### pin
```json
"board":  { "mapMode": "neutral" | "climate" },
"answer": { "mode": "zone", "zone": "akdeniz|karadeniz|karasal|sert" }
```
ya da
```json
"answer": { "mode": "point", "lat": 38.64, "lon": 34.83, "radiusKm": 90 }
```
- `mapMode: "climate"` yalnızca iklim bölgesi seçtirilen sorularda (renkler bölgeleri gösterir). Diğer pin sorularında `neutral`: harita renksiz, bölge etiketi yok, bölge vurgusu yok.
- Haritanın ölçeği ve kıyı çizgisi sadeleştirilmiştir. Nokta cevaplarında `radiusKm` en az 70 olsun (kıyı şehirleri haritada hafif içeri kayar).
- `selfTest` cevabı: `{lat, lon, zone?}`.
- `board.cities: false`: klavye/koordinat formunda şehir listesi gösterilmez. Koordinat okunarak bulunan vakalarda (ör. GPS, saat farkı) şehir adı cevabı vereceği için kullan.

### number
```json
"board":  { "unit": "km", "dirs": ["K","G"], "placeholder": "Örn. 12", "given": ["Verilen 1", "Verilen 2"] },
"answer": { "value": 20, "tolerance": 0.1, "dir": "K", "angle": true, "accepts": [ {"value": 20.5, "tolerance": 0.1} ] }
```
- `dirs` yalnızca enlem/boylam gibi yönlü cevaplarda. `angle: true` ise `42°`, `71°27′` gibi girişler kabul edilir.
- `selfTest` cevabı: `{raw: "42", dir: "K"}`. Boş giriş yanlış sayılır.

### cards
```json
"board":  { "multi": false, "cards": [ {"id":"a","title":"Deprem","text":"..."}, {"id":"b","title":"Orojenez","text":"...","why":"Bu seçenek neden yanlış (1 cümle)"} ] },
"answer": { "correct": ["a"] }
```
- 3 ya da 4 kart. Her yanlış kartta `why` zorunlu. İpucunda `eliminate: ["b"]` yalnızca yanlış kartları eler.
- `selfTest` cevabı: `["a"]`.

### decision
```json
"board":  { "start": "s1", "steps": [ { "id":"s1", "text":"Durum", "options":[
              {"id":"s1a","text":"...","end":"bad","note":"Sonuç cümlesi"},
              {"id":"s1b","text":"...","next":"s2","note":"Sonuç cümlesi"} ] } ] },
"answer": { "okEndings": ["best"] }
```
- Her seçenekte ya `next` ya `end` (`best|ok|bad`) ve `note` zorunlu. Adım başına 2-4 seçenek, en çok 3 adım.
- `selfTest` cevabı: seçenek id'leri sırayla, örn. `["s1b","s2b"]`. Yanlış yol seçilince adımlar baştan başlar.

### graph
```json
"board": { "kind": "climograph", "pickMode": "months", "data": { "temp": [12 değer], "precip": [12 değer] } },
"answer": { "months": [6,7,8] }
```
- `kind: "pyramid"` için `data: { groups:[...], male:[...], female:[...] }`, `pickMode: "bars"` (`answer.bars`: grup indeksleri) ya da `"choice"`.
- `pickMode: "choice"` için `board.choices: [{id,text,why?}]` (3-4) ve `answer.choice`.
- Veriler gerçek istasyon verisi değilse `source.status: "dogrulanacak"` yaz ve notu ekle.
- `selfTest` cevabı: `{months:[6,7,8]}` ya da `{choice:"karadeniz"}`.

### route
Harita rotası:
```json
"board": { "mode":"map", "mapMode":"neutral",
  "start": {"lat":41.01,"lon":28.98,"radiusKm":70,"name":"İstanbul"}, "end": {"lat":40.6,"lon":43.09,"radiusKm":80,"name":"Kars"},
  "ordered": true, "waypoints": [{"lat":39.93,"lon":32.86,"radiusKm":70,"name":"Ankara"}],
  "forbidden": [{"lat":40.4,"lon":36,"radiusKm":60,"name":"Fırtına hücresi"}],
  "maxLengthKm": 1700, "maxPoints": 10 }
```
E� yükselti rotası (sentetik arazi, gerçek coğrafya değil):
```json
"board": { "mode":"contour", "terrain": {"base":100,"hills":[{"x":0.5,"y":0.5,"h":700,"r":0.17}]},
  "start":{"x":0.1,"y":0.85,"r":0.06}, "end":{"x":0.9,"y":0.15,"r":0.06},
  "widthKm":12, "contourInterval":50, "maxAscentM":150, "maxLengthKm":20, "maxPoints":8 }
```
- Eş yükselti vakasında düz rota başarısız, bir dolaşma başarılı olmalı; `selfTest` ikisini de içersin.
- `selfTest` cevabı: harita için `{points:[{lat,lon},...]}`, kontur için `{points:[[x,y],...]}`.
