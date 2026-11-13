# Adım 2: nötr harita ve nokta cevapları

Görev: `setMapMode('neutral')`. Haritadaki iklim renkleri ve bölge ipuçları gizlensin (iklim dışı pin sorularında harita cevabı sızdırmamalı).

Yapılacaklar:
1. Bölge malzemelerine `onBeforeCompile` ile `uNeutral` ekle (renkleri gri-sıcak tonlu kabartmaya çevir), mod değişiminde 0↔1 yumuşak geçiş.
2. `neutral` modda: bölge etiketleri gizli, bölge yükseltme ve amber çerçeve kapalı, fare üstü vurgu yok. Tıklama yine nokta döndürsün.
3. `climate` modda mevcut davranış aynen kalsın.
4. Vakalar: `konum-01-gps-adana`, `dis-01-peribacalari-pin` oynansın.

Kabul: [ ] neutral modda harita bölge renklerini göstermiyor, [ ] climate moduna dönünce renkler geri geliyor, [ ] nokta cevabı yarıçap içinde doğru, dışında "Yakınsın ama biraz uzak", [ ] testler yeşil.
