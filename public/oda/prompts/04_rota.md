# Adım 4: rota çizme (harita ve eş yükselti)

Görev: `route` türünün iki modu da çalışsın.

Yapılacaklar:
1. `drawRoute(noktalar)`: harita üzerinde amber tüp (TubeGeometry, kalınlığı harita ölçeğine uygun) + nokta topları. `clearRoute()`.
2. `showEndpoints(board)`: başlangıç (yeşil halka, "A" ya da şehir adı), varış (kırmızı), ara noktalar (beyaz halka, sıra numarası), `forbidden` daireleri (kırmızı yarı saydam disk). Etiketler okunur olsun.
3. Kontur panosu (`harita-02-esyukselti-rota`): SVG zaten çiziliyor; çizgilerin okunabilirliğini, dokunma hedeflerini ve canlı tırmanış göstergesini kontrol et.
4. Rota noktalarının haritaya tıklayarak eklenmesi `enableMapPick` ile; ardışık hızlı tıklamalarda çift nokta eklenmesini önle.

Kabul: [ ] `ulasim-01-dogu-koridoru-rota` doğru rotayla geçiyor, ara şehri atlayınca "Şu noktadan geçmedin: Sivas." yazıyor, [ ] `harita-02-esyukselti-rota`: düz çizgi yanlış (tırmanış mesajı), kuzey dolaşımı doğru, [ ] Son noktayı sil ve Temizle çalışıyor, [ ] testler yeşil.
