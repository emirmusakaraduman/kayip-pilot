# Adım 3: haritasız türler (sayı, kart, grafik, karar)

Görev: `number`, `cards`, `graph`, `decision` türlerindeki örnek vakaların hepsi paneldeki arayüzle oynansın. Bu türlerde `setMapMode('hidden')` ve `setCamera('telsiz')`.

Yapılacaklar:
1. `hidden` modda `mapG.visible = false` (duvardaki harita kalsın). Haritaya geri dönerken yumuşak geçiş (ölçek ya da saydamlık), sahne bozulmasın.
2. Panelin masayla ve karakterlerle çakışmadığını kontrol et (masaüstü ve 390 px mobil). Gerekirse `src/questions/ui.css`'i ayarla.
3. Klavye: Tab ile gezme, Enter ile gönderme, kart ve grafik sütunları tuşla seçilebilsin.
4. Karar vakasında seçenek sonrası geçiş notunu oyuncu okuyabilsin (600 ms yeterli mi bak, kısaysa `KP.config.stepDelayMs`).

Kabul: [ ] `afet-01-deprem-karar`, `ic-01-sarsinti-kart`, `iklim-03-kurak-aylar-grafik`, `goc-02-piramit-grafik`, `harita-01-olcek-km` baştan sona oynandı, [ ] mobilde taşma yok, [ ] testler yeşil.
