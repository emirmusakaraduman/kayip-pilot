# İçerik yazım kuralları (vaka metinleri)

Amaç: TYT öğrencisi dedektif gibi düşünür: **ipucu → çıkarım → cevap**. Metin cevabı söylemez, gözlemi verir.

## Deniz'in ağzı (radio)
1. Deniz gördüğünü, duyduğunu, ölçtüğünü anlatır. **Cevabın adını (ör. "Akdeniz iklimi", "tektonik göl") asla söylemez.** İpucu ile cevap arasında en az bir çıkarım adımı olmalı.
2. Kısa cümleler, telsiz konuşması: "Merkez, ..." gibi başlayabilir ama her mesajda tekrarlama.
3. Her mesaj en çok 240 karakter. Telsiz ekranı yaklaşık 7 satır alır, tek mesaj ekrana sığmalı.
4. Duygu az ve gerçek: acele, korku, merak. Abartma, şiddet ve kan yok.
5. Gözlemler birbirini desteklesin ama tek başına yeterli olmasın (iki ya da üç ipucu birlikte cevabı verir).

## İpucu merdiveni (hints)
- 1. ipucu (Nuri ya da Ayşe): konuyu hatırlatır, kuralı söyler, cevabı vermez.
- 2. ipucu: yöntemi gösterir (formül, hangi veriye bakılacağı) ya da yanlış seçenekleri eler (`eliminate`).
- 3. ipucu (isteğe bağlı): neredeyse cevabı verir.
- Nuri hava ve iklim, hesap ve formül; Ayşe harita, koordinat, yer şekilleri konularında konuşur.

## Geri bildirim
- `feedback.wrong`: tek cümle, ipucu niteliğinde, cevabı açıklamaz. İlk yanlışta yalnızca bu gösterilir, ikinci yanlıştan itibaren `explain` de eklenir.
- `feedback.correct`: Deniz'in tepkisi, tek cümle.
- `feedback.explain`: en çok 2 cümle. Önce kural, sonra bu vakadaki uygulaması ("Fark 24 − 12 = 12°C; 12 × 200 = 2400 m").
- Yanlış kartların `why` metni: neden yanlış olduğunu bu vakaya bağlayarak anlatır, kartın tanımını tekrarlamaz.

## Zorluk
- **Kolay (1):** tek kavram, doğrudan ipucu, hesap en çok bir adım.
- **Orta (2):** iki ipucunu birleştirmek ya da iki adımlı hesap.
- **Zor (3):** çok adımlı çıkarım, dağıtıcı (yanıltıcı) ipucu, rota ve karar gibi uygulama.

## Dil
- Türkçe, sade, 11. sınıf düzeyi. Terimler ders kitabındaki yazımıyla (ör. "Yengeç Dönencesi", "eş yükselti", "mevsimlik göç").
- Aynı vaka içinde terim tutarlı olsun.

## Coğrafya doğruluğu (ÇOK ÖNEMLİ)
- Emin olmadığın her bilgiyi **uydurma**. `source.status` alanına `dogrulanacak` yaz ve `note`'a neyin kontrol edileceğini yaz. Bu vakaları listeleyip kullanıcıya bildir.
- Şu bilgiler özellikle ders kitabına göre doğrulanmalı: yükseldikçe sıcaklık düşüşü (200 m'de 1°C kuralı mı?), Yengeç Dönencesi değeri (23°27′ mi 23°26′ mı?), 1° boylam = 4 dakika, Van Gölü'nün volkanik set gölü olduğu, Eğirdir Gölü'nün tektonik oluşu, çernozyom toprağın KD Anadolu'daki yayılışı, iklim grafikleri ve nüfus piramidi verileri.
- Grafik verisi gerçek bir istasyon verisi değilse başlıkta "örnek" yaz, `dogrulanacak` işaretle.
- Harita yalnızca 4 iklim bölgesi gösterir (ılıman karasal, Akdeniz, Karadeniz, sert karasal). Ege kıyısı Akdeniz bölgesi olarak boyalıdır. İklim bölgesi sorularında bu 4 sınıfın dışına çıkma.
- Eğim, yükselti gibi konularda haritadaki yükseklikler yaklaşık el modellemesidir, gerçek veri değildir. Yükselti gerektiren soruları **eş yükselti panosunda** (sentetik arazi) sor, 3D haritaya dayandırma.
- Yeni vaka yazarken sahte kaynak, sahte sayfa numarası yazma.

## Yasaklar
- Cevabı radio metninde açık yazma.
- Tek bir seçenekle ilgisiz, saçma yanlış kartlar (yanlış kartlar akla yatkın ama hatalı olmalı).
- Gerçek kişi, kurum ya da olay adı kullanma (yer adları serbest).
- Şiddet, ölüm tasviri. Afet vakaları güvenlik bilgisi öğretir, korkutmaz.
