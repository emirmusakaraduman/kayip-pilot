# Adım 1: sahne köprüsü ve pin türü

Görev: `main.js`'e `window.KPScene` köprüsünü yaz ve `iklim-01-akdeniz-pin` vakasını panelle baştan sona çalıştır.

Yapılacaklar (`docs/PLAN.md` "KPScene sözleşmesi" ve "main.js'te yapılacak yamalar"):
1. `pick(ev)`'i ısabet noktasını da saklayacak şekilde yamala (`lastPickPt`), tıklama işleyicisinde `KPS.pickCb` varsa `KP.geo.localToLatLon` ile `{lat, lon, x, y, zone}` ver ve eski seçim akışını atla.
2. `setBattery`, `setCamera`, `radioShow` (kuyruklu), `flash`, `setMapMode('climate'|'hidden')`, `enableMapPick`, `disableMapPick`, `addMarker`, `clearMarkers`.
3. Eski demo akışını kapat (`KP.engine.active` iken `.hud-bottom` gizli, `sendBtn` işleyicisi erken dönsün). `?eski=1` eski demoyu çalıştırsın.
4. Başlatma: `KP.geo.setMapData(window.MAP_DATA)`, `KP.scene = window.KPScene`, vakaları yükle, `KP.engine.start()`.

Kabul ölçütleri (tarayıcıda dene ve tek tek işaretleyerek raporla):
- [ ] Sayfa açılınca panel görünüyor, telsiz ekranı vakanın radio mesajlarını sırayla yazıyor.
- [ ] Haritada bir bölgeye dokununca panelde koordinat yazıyor, iğne görünüyor, Gönder açılıyor.
- [ ] Doğru bölgede: "+N jeton", Sonraki vaka düğmesi çıkıyor.
- [ ] Yanlışta: pil %5 düşüyor, telsiz pil göstergesi ve ekran paraziti güncelleniyor, `feedback.wrong` görünüyor.
- [ ] İpucu düğmesi 1 jeton düşürüyor, ipucu metni Nuran/Fatma adıyla çıkıyor.
- [ ] Sayfa yenilenince pil ve jeton korunuyor.
- [ ] `node tests/run.js` yeşil.

Yapma: motoru ya da doğrulayıcıları değiştirme; harita dokusunu ya da kamerayı değiştirme.
