# Doğrulama listesi (`dogrulanacak` vakalar)

Bu dosya `node tools/build_vakalar.js` sonrası `source.status: "dogrulanacak"` olan vakalardan üretildi. Kitaba göre kontrol edilince vakanın `source.status` alanını `dogrulandi` yap, gerekirse metni düzelt, sonra `node tools/build_vakalar.js && node tests/run.js` çalıştır.

| # | Vaka | Zorluk | Ne kontrol edilecek |
|---|---|---|---|
| 1 | `dis-02-obruk-pin` — Çöken Zemin | Kolay | Obruk alanı (Karapınar–Çumra, Konya Kapalı Havzası) yaklaşık 37,65°K 33,2°D; yarıçap 110 km. Atlasta obruk alanını kontrol et. |
| 2 | `dunya-03-aralik-gunes-acisi-enlem` — Kuzeye Uzanan Gölge | Zor | Aynı dönence değeri kontrolü. Hesap 23°27′ ile tam 37° çıkar; kitap 23°26′ kullanıyorsa 37°01′ olur, tolerans (±0,3°) karşılar. |
| 3 | `ekonomi-03-findik-pin` — Bodur Kümeler | Zor | Fındık yoğun üretim merkezi Ordu–Giresun (40,9°K 38,2°D), yarıçap 110 km. Kitapta Sakarya–Düzce çevresi de anılıyorsa vaka yine doğrudur (ipucu "çay yok" Doğu Karadeniz dışını söyler) ama yarıçap/merkez gözden geçirilebilir. |
| 4 | `goc-03-goc-alan-sehir-grafik` — Sanayi Kentinin Piramidi | Zor | Örnek (yaklaşık) veri. Piramit kitaptaki göç alan kent piramidine benzemeli (erkek ağırlıklı, çalışma çağı kabarık). |
| 5 | `elemanlar-03-basinc-yukselti-sicaklik` — Barometre ve Termometre | Zor | İki kural: basınç "her 10 m’de 1 mb" ve sıcaklık "her 200 m’de 1°C". Kitap farklıysa given satırlarını ve cevabı (20°C) yeniden hesapla. |
| 6 | `kayac-03-kara-toprak-pin` — Simsiyah Toprak | Zor | Çernozyom (kara toprak) kitapta hangi iklim ve bölgeyle anılıyor? Cevap "sert karasal" kabul edildi. Kitap "ılıman karasal (İç Anadolu, step)" diyorsa answer.zone değerini değiştir. |
| 7 | `konum-01-gps-adana` — GPS’teki Rakamlar | Kolay | Adana yaklaşık 37°K, 35,3°D; vaka 37°K 35°D noktasını 90 km yarıçapla kabul eder. Atlasla doğrula. |
| 8 | `dunya-01-gunes-acisi-enlem` — Öğle Güneşi | Orta | Ders kitabında Yengeç Dönencesi 23°27′ yazıyorsa vaka olduğu gibi doğrudur (hesap bu değerle 42° çıkar). 23°26′ yazıyorsa cevabın toleransı (±0,3°) yine karşılar. |
| 9 | `elemanlar-01-sicaklik-yukselti` — Soğuyan Termometre | Orta | Kitapta "her 200 m’de 1°C" mi, "her 100 m’de 0,6°C" mi? İkincisiyse vakadaki "given" satırını ve cevabı (2400 m) kitabın kuralına göre güncelle. |
| 10 | `su-01-gol-turu-kart` — Dar ve Uzun Göl | Orta | Eğirdir Gölü kitapta tektonik göl olarak mı geçiyor (bazı kaynaklarda tektonik-karstik)? Gerekirse örnek göl adını değiştir ya da kartı sadeleştir. |
| 11 | `ulasim-01-dogu-koridoru-rota` — Doğu Hattı | Zor | İstanbul–Ankara–Sivas–Erzurum–Kars hattının kitaptaki ana ulaşım koridoruyla uyumunu demiryolu atlasından kontrol et. |
| 12 | `iklim-03-kurak-aylar-grafik` — Kurak Aylar | Orta | Örnek (yaklaşık) Akdeniz istasyon verisi; gerçek istasyon grafiğiyle değiştirmek istenirse selfTest ve answer.months güncellenmeli. |
| 13 | `iklim-04-grafik-iklim-sec` — Hangi İklim? | Zor | Örnek (yaklaşık) Karadeniz istasyon verisi; gerçek grafikle değiştirilirse answer.choice kontrol edilmeli. |
| 14 | `goc-02-piramit-grafik` — Duvardaki Piramit | Orta | Örnek (yaklaşık) veri. İstersen ders kitabındaki gerçek piramitle değiştir; yoksa başlıktaki "örnek" ifadesi kalsın. |
| 15 | `tr-03-ege-kiyisi-pin` — Girintili Kıyı | Zor | Ege kıyısı örnek merkezi İzmir çevresi (38,4°K 27°D), yarıçap 120 km. Kitaptaki "Ege tipi kıyı" tanımıyla uyumlu mu bak. |
| 16 | `ulasim-03-izmir-ankara-rota` — Karlı Yol | Orta | Kurgu senaryo: kapalı bölge Eskişehir çevresi (70 km), ara nokta Afyonkarahisar. Gerçek yol durumu değildir; yalnızca şehir konumlarını atlasla doğrula. |

## Cevap anahtarı (kontrol için)

- **dis-02-obruk-pin**: Bu şekiller hangi bölgede görülür? Deniz’in konumunu işaretle.
  - cevap: `{"mode":"point","lat":37.65,"lon":33.2,"radiusKm":110}`
  - açıklama: Kalkerli arazide suyun çözmesiyle karstik şekiller oluşur; kurak Konya Kapalı Havzası’ndaki obruklar buna örnektir.
- **dunya-03-aralik-gunes-acisi-enlem**: Deniz hangi enlemde? (derece ve yön)
  - cevap: `{"value":37,"tolerance":0.3,"dir":"K","angle":true}`
  - açıklama: 90° − 29°33′ = 60°27′ fark vardır. Gölge kuzeye düştüğü için Oğlak Dönencesi’nin kuzeyindedir: 60°27′ − 23°27′ = 37° K.
- **ekonomi-03-findik-pin**: Bu ürün hangi yörede yetiştirilir? Deniz’in konumunu işaretle.
  - cevap: `{"mode":"point","lat":40.9,"lon":38.2,"radiusKm":110}`
  - açıklama: Fındık Karadeniz’in nemli ve ılık yamaçlarında yetişir; Ordu–Giresun çevresi yoğun üretim alanıdır. Basamaklı çay tarlaları ise daha doğuda yoğundur.
- **goc-03-goc-alan-sehir-grafik**: Bu piramit kentin nüfus hareketi hakkında neyi gösterir?
  - cevap: `{"choice":"alan"}`
  - açıklama: Çalışma çağındaki grupların kabarık, erkeklerin fazla olduğu piramit iş için gelen göçü gösterir. Dar taban doğumun yüksek olmadığını gösterir.
- **elemanlar-03-basinc-yukselti-sicaklik**: Deniz’in bulunduğu yerde sıcaklık kaç °C’dir?
  - cevap: `{"value":20,"tolerance":0.5}`
  - açıklama: Basınç farkı 100 mb × 10 m = 1000 m yükseltidir. 1000 ÷ 200 = 5°C düşer; 25 − 5 = 20°C.
- **kayac-03-kara-toprak-pin**: Bu toprağın oluştuğu iklim bölgesini haritadan seç.
  - cevap: `{"mode":"zone","zone":"sert"}`
  - açıklama: Çernozyom gibi siyah, humuslu topraklar soğuk ve yarı kurak step koşullarında oluşur. Kışı uzun ve sert olan sert karasal iklim bölgesine uyar.
- **konum-01-gps-adana**: Deniz’in konumunu haritada işaretle.
  - cevap: `{"mode":"point","lat":37,"lon":35,"radiusKm":90}`
  - açıklama: Enlem ekvatora göre kuzey-güney, boylam başlangıç meridyenine göre doğu-batı konumunu verir; 37°K 35°D Adana çevresine denk gelir.
- **dunya-01-gunes-acisi-enlem**: Deniz hangi enlemde? (derece ve yön)
  - cevap: `{"value":42,"tolerance":0.3,"dir":"K","angle":true}`
  - açıklama: 90° − 71°27′ = 18°33′ fark; kuzey yarım kürede dönencenin kuzeyinde: 23°27′ + 18°33′ = 42° K.
- **elemanlar-01-sicaklik-yukselti**: Deniz kıyıdan kaç metre yüksekte?
  - cevap: `{"value":2400,"tolerance":50}`
  - açıklama: Fark 24 − 12 = 12°C; 12 × 200 m = 2400 m.
- **su-01-gol-turu-kart**: Bu göl hangi türdedir?
  - cevap: `{"correct":["b"]}`
  - açıklama: Fay hareketleriyle çöken çukurluklarda oluşan göllere tektonik göl denir; Eğirdir Gölü tektonik kökenlidir.
- **ulasim-01-dogu-koridoru-rota**: İstanbul’dan Kars’a, Ankara, Sivas ve Erzurum’dan geçen rotayı çiz.
  - cevap: `{}`
  - açıklama: İstanbul–Ankara–Sivas–Erzurum–Kars hattı, ülkeyi doğu-batı doğrultusunda kat eden ana ulaşım koridorlarından biridir.
- **iklim-03-kurak-aylar-grafik**: Grafikte yağışın en az olduğu 3 ayı işaretle.
  - cevap: `{"months":[6,7,8]}`
  - açıklama: Haziran, Temmuz ve Ağustos’ta yağış çok az, sıcaklık yüksektir; yazın kurak, kışın yağışlı grafik Akdeniz iklimini gösterir.
- **iklim-04-grafik-iklim-sec**: Bu grafik hangi iklim tipine aittir?
  - cevap: `{"choice":"karadeniz"}`
  - açıklama: Her ay yüksek yağış, ılıman sıcaklıklar ve kurak mevsimin olmaması Karadeniz iklimini gösterir.
- **goc-02-piramit-grafik**: Bu piramit nüfusun hangi özelliğini gösterir?
  - cevap: `{"choice":"genc"}`
  - açıklama: Tabanı geniş, tepesi dar piramit doğum oranının yüksek ve genç nüfusun fazla olduğunu gösterir.
- **tr-03-ege-kiyisi-pin**: Bu kıyı tipi hangi kıyıda görülür? Deniz’in konumunu işaretle.
  - cevap: `{"mode":"point","lat":38.4,"lon":27,"radiusKm":120}`
  - açıklama: Dağların kıyıya dik uzandığı Ege’de denizin sokulmasıyla girintili çıkıntılı kıyı oluşur. Zeytin ve kızılçam Akdeniz iklimini gösterir, kıyı tipini değil.
- **ulasim-03-izmir-ankara-rota**: İzmir’den Ankara’ya, Afyonkarahisar’dan geçen ve kapalı bölgeden kaçınan rotayı çiz.
  - cevap: `{}`
  - açıklama: Rotada ara nokta ve yasak bölge birlikte düşünülür: önce güneydeki Afyonkarahisar’a, oradan Ankara’ya giden hat kapalı bölgenin dışında kalır.
