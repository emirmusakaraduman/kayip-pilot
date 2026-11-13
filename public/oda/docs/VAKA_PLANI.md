# 45 vakalık plan: konu, zorluk ve çözüm yöntemi

Her konu için 3 vaka (kolay, orta, zor). Cevap türü `docs/VAKA_SEMASI.md` tablosundaki konu-tür eşleşmesine uyar. Makine okunur hali: `data/vaka_plani.json`. Durum **yazıldı** = vaka `data/vakalar/` içinde var, **planlı** = yazılacak.

`node tests/coverage.js` plan ile yazılan vakaları karşılaştırır.

## Dünya’nın şekli ve hareketleri (`dunya-sekli-hareketleri`)

İzinli yöntemler: Sayı girişi

### Kolay: Kutup Dairesi (`dunya-02-kutup-dairesi`, Sayı girişi, planlı)

- **Ölçülen kazanım:** Eksen eğikliği ile dönence ve kutup dairesi enlemleri
- **Deniz’in gözlemi:** Deniz’in uçuş eğitimi defterinde eksen eğikliği 23°27′ yazıyor; Kuzey Kutup Dairesi’nin enlemini soruyor.
- **Çözüm yolu:** Kutup dairesi enlemi = 90° − eksen eğikliği. 90° − 23°27′ hesaplanır.
- **Doğru cevap:** 66°33′ K (66,55°)
- **Hesap kontrolü:** `90-(23+27/60)` = 66.55

### Orta: Öğle Güneşi (`dunya-01-gunes-acisi-enlem`, Sayı girişi, yazıldı)

- **Ölçülen kazanım:** 21 Haziran öğle güneş açısından enlem bulma
- **Deniz’in gözlemi:** Deniz 21 Haziran öğle vakti güneş ışınlarının yere geliş açısını 71°27′ ölçmüş.
- **Çözüm yolu:** Açı = 90° − (enlem ile dönence arasındaki fark). Fark = 90° − 71°27′ = 18°33′. Kuzey yarım kürede dönencenin kuzeyi: 23°27′ + 18°33′.
- **Doğru cevap:** 42° K
- **Hesap kontrolü:** `(23+27/60)+(90-(71+27/60))` = 42

### Zor: Kış Güneşi (`dunya-03-aralik-gunes-acisi`, Sayı girişi, planlı)

- **Ölçülen kazanım:** 21 Aralık’ta güneş ışınlarının geliş açısını hesaplama
- **Deniz’in gözlemi:** Deniz 42° K enleminde. 21 Aralık öğle vakti güneş ışınlarının yere geliş açısını soruyor.
- **Çözüm yolu:** 21 Aralık’ta ışınlar Oğlak Dönencesi’ne (23°27′ G) dik gelir. Aradaki enlem farkı 42° + 23°27′ = 65°27′. Açı = 90° − 65°27′.
- **Doğru cevap:** 24°33′ (24,55°)
- **Hesap kontrolü:** `90-(42+23+27/60)` = 24.55

## Coğrafi konum (`cografi-konum`)

İzinli yöntemler: Haritaya pin, Sayı girişi

### Kolay: GPS’teki Rakamlar (`konum-01-gps-adana`, Haritaya pin, yazıldı)

- **Ölçülen kazanım:** Mutlak konum: enlem ve boylamdan yer bulma
- **Deniz’in gözlemi:** GPS ekranında 37° kuzey, 35° doğu yazıyor; çevre geniş bir ova, uzakta dağlar.
- **Çözüm yolu:** Önce 37° K enlemi, sonra 35° D boylamı bulunur, kesiştikleri nokta işaretlenir.
- **Doğru cevap:** Adana çevresi (37,0°K 35,0°D)

### Orta: Saat Farkı (`konum-02-yerel-saat-boylam`, Sayı girişi, yazıldı)

- **Ölçülen kazanım:** Yerel saat farkından boylam bulma
- **Deniz’in gözlemi:** Deniz’in yerel saati 14.12, Greenwich saati 12.00.
- **Çözüm yolu:** Fark 2 sa 12 dk = 132 dk. 1° = 4 dk olduğundan 132 ÷ 4 = 33°. Yerel saat ileri, yani Doğu.
- **Doğru cevap:** 33° D
- **Hesap kontrolü:** `(14*60+12-12*60)/4` = 33

### Zor: Kuzeyin Ucu (`konum-03-en-kuzey-nokta-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Türkiye’nin uç noktaları (mutlak konum)
- **Deniz’in gözlemi:** Pusula kuzeye bakıyor, önünde yalnızca deniz var. GPS enlem yaklaşık 42° K, boylam yaklaşık 35° D.
- **Çözüm yolu:** Enlem ve boylam birlikte okunur; 42° K Türkiye’nin en kuzey enlemidir. Karadeniz kıyısında bu enlem ve boylama denk gelen burun bulunur.
- **Doğru cevap:** Sinop çevresi, İnceburun (≈42,1°K 35°D)

## Harita bilgisi (`harita-bilgisi`)

İzinli yöntemler: Sayı girişi, Rota çizme

### Kolay: Haritadaki Dört Santim (`harita-01-olcek-km`, Sayı girişi, yazıldı)

- **Ölçülen kazanım:** Kesirli ölçekle gerçek uzaklık bulma
- **Deniz’in gözlemi:** Ölçek 1/500.000, haritada iki nokta arası 4 cm.
- **Çözüm yolu:** Gerçek uzaklık = harita uzaklığı × ölçek paydası = 4 × 500.000 = 2.000.000 cm = 20 km.
- **Doğru cevap:** 20 km
- **Hesap kontrolü:** `4*500000/100000` = 20

### Orta: Dik Yamaç (`harita-03-egim-yuzde`, Sayı girişi, planlı)

- **Ölçülen kazanım:** Eş yükselti noktalarından eğim (%) hesabı
- **Deniz’in gözlemi:** A noktası 300 m, B noktası 500 m. Haritada aralarında 4 cm var, ölçek 1/50.000.
- **Çözüm yolu:** Yatay uzaklık = 4 × 50.000 = 200.000 cm = 2000 m. Eğim (%) = yükselti farkı ÷ yatay uzaklık × 100 = 200 ÷ 2000 × 100.
- **Doğru cevap:** % 10
- **Hesap kontrolü:** `(500-300)/(4*50000/100)*100` = 10

### Zor: En Az Tırmanış (`harita-02-esyukselti-rota`, Rota çizme, yazıldı)

- **Ölçülen kazanım:** Eş yükselti eğrilerini okuyup en uygun güzergâhı seçme
- **Deniz’in gözlemi:** Helikopterin motor gücü az; A noktasından B’ye en az tırmanışla gidecek rota isteniyor.
- **Çözüm yolu:** Çizgilerin sık olduğu yer diktir. Tepeyi aşmak yerine çizgilerin seyrek olduğu alçak sahadan dolaşılır; toplam tırmanış 150 m’yi geçmemeli.
- **Doğru cevap:** Kuzey ya da vadi dolaşımı (tırmanış < 150 m)

## İklim elemanları (`iklim-elemanlari`)

İzinli yöntemler: Sayı girişi

### Kolay: İki Uç (`elemanlar-02-yillik-sicaklik-farki`, Sayı girişi, planlı)

- **Ölçülen kazanım:** Yıllık sıcaklık farkı (en sıcak ay − en soğuk ay)
- **Deniz’in gözlemi:** İstasyonun aylık ortalama sıcaklık listesinde en sıcak ay 27°C, en soğuk ay −3°C.
- **Çözüm yolu:** Yıllık sıcaklık farkı = en sıcak ay − en soğuk ay = 27 − (−3). Eksi işaretine dikkat.
- **Doğru cevap:** 30 °C
- **Hesap kontrolü:** `27-(-3)` = 30

### Orta: Soğuyan Termometre (`elemanlar-01-sicaklik-yukselti`, Sayı girişi, yazıldı)

- **Ölçülen kazanım:** Yükselti ile sıcaklık azalışı
- **Deniz’in gözlemi:** Kıyıda 24°C, Deniz’in yerinde 12°C ölçülmüş.
- **Çözüm yolu:** Sıcaklık farkı 12°C. Her 200 m’de 1°C azaldığı için 12 × 200 m.
- **Doğru cevap:** 2400 m
- **Hesap kontrolü:** `(24-12)*200` = 2400

### Zor: Haritadaki Sıcaklık (`elemanlar-03-indirgenmis-sicaklik`, Sayı girişi, planlı)

- **Ölçülen kazanım:** İndirgenmiş sıcaklık: yükselti etkisini ayıklayıp karşılaştırma (iki adımlı)
- **Deniz’in gözlemi:** Deniz 1600 m yükseklikte ve termometre 11°C gösteriyor. Kıyıdaki istasyon 24°C ölçmüş. Yükseltinin etkisi çıkarılınca iki yer arasında kaç derece fark kalır?
- **Çözüm yolu:** Önce Deniz’in sıcaklığı deniz seviyesine indirgenir: 1600 ÷ 200 = 8°C eklenir, 11 + 8 = 19°C. Sonra kıyıdaki 24°C ile fark alınır: 24 − 19.
- **Doğru cevap:** 5 °C
- **Hesap kontrolü:** `24-(11+1600/200)` = 5

## İklim tipleri ve bitki örtüsü (`iklim-tipleri`)

İzinli yöntemler: Haritaya pin, Grafik okuma

### Kolay: Kurak Yaz (`iklim-01-akdeniz-pin`, Haritaya pin, yazıldı)

- **Ölçülen kazanım:** Akdeniz iklimi özellikleri ve bitki örtüsü
- **Deniz’in gözlemi:** Yazın hiç yağmur yok, kışlar ılık ve yağmurlu; kızılçam ve maki.
- **Çözüm yolu:** Yağış rejimi ve bitki örtüsünden iklim tipi bulunur, haritada o bölge seçilir.
- **Doğru cevap:** Akdeniz iklim bölgesi

### Orta: Sis ve Çay (`iklim-02-karadeniz-pin`, Haritaya pin, yazıldı)

- **Ölçülen kazanım:** Karadeniz iklimi özellikleri ve bitki örtüsü
- **Deniz’in gözlemi:** Her mevsim yağış, sis; çay tarlaları ve kayın ormanı.
- **Çözüm yolu:** Kurak mevsimin olmaması ve çay, kayın bitki örtüsü Karadeniz iklimini gösterir.
- **Doğru cevap:** Karadeniz iklim bölgesi

### Zor: Hangi İklim? (`iklim-04-grafik-iklim-sec`, Grafik okuma, yazıldı)

- **Ölçülen kazanım:** Yağış-sıcaklık grafiğinden iklim tipi yorumlama
- **Deniz’in gözlemi:** İstasyon grafiğinde yağış çubukları yıl boyu yüksek, kurak ay yok.
- **Çözüm yolu:** Kurak mevsimin olup olmadığına bakılır; yıl boyu yüksek yağış ve ılıman sıcaklık Karadeniz iklimidir.
- **Doğru cevap:** Karadeniz iklimi
- **Doğrulanacak:** Grafik verisi örnek (yaklaşık); gerçek istasyon grafiğiyle değiştirilebilir.

## İç kuvvetler (`ic-kuvvetler`)

İzinli yöntemler: Seçenek kartı

### Kolay: Ani Sarsıntı (`ic-01-sarsinti-kart`, Seçenek kartı, yazıldı)

- **Ölçülen kazanım:** Deprem, orojenez, epirojenez ve volkanizmayı ayırma
- **Deniz’in gözlemi:** Zemin birkaç saniye sarsıldı, yarıklar açıldı, taşlar yuvarlandı.
- **Çözüm yolu:** Olay ani ve kırılma kaynaklı: deprem. Orojenez ve epirojenez yavaş, volkanizma magma çıkışıdır.
- **Doğru cevap:** Deprem

### Orta: Bükülen Tabakalar (`ic-02-kivrim-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Kıvrım şekilleri: antiklinal ve senklinal
- **Deniz’in gözlemi:** Deniz’in önündeki kat kat tabakalar yukarı doğru kemer gibi bükülmüş.
- **Çözüm yolu:** Tabakaların yukarı kemerlenmesi antiklinaldir. Senklinal aşağı çukurdur; horst ve graben ise bükülme değil kırılma şekilleridir.
- **Doğru cevap:** Antiklinal (yukarı kıvrım)
- **Doğrulanacak:** Antiklinal/senklinal ve horst/graben tanımlarını kitapla karşılaştır.

### Zor: Fayların İzi (`ic-03-kirik-sekilleri-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Kırık hareketleriyle oluşan şekiller (horst, graben)
- **Deniz’in gözlemi:** Çevrede yükselmiş sert bir blok, çökmüş uzun bir ova, bükülmüş tabakalar ve bir volkan konisi görünüyor.
- **Çözüm yolu:** Kırık (fay) hareketleriyle horst ve graben oluşur. Bükülmüş tabakalar kıvrım, volkan konisi magma çıkışı ürünüdür. İki doğru kart seçilir.
- **Doğru cevap:** Horst ve Graben (çoklu seçim)

## Dış kuvvetler (`dis-kuvvetler`)

İzinli yöntemler: Haritaya pin

### Kolay: Taştan Kuleler (`dis-01-peribacalari-pin`, Haritaya pin, yazıldı)

- **Ölçülen kazanım:** Rüzgâr ve yağmurla aşınma şekilleri (peribacası)
- **Deniz’in gözlemi:** Konik kayadan kuleler, tepelerinde sert taş şapka; yumuşak soluk taş.
- **Çözüm yolu:** Volkanik tüflerin aşınmasıyla peribacası oluşur; bu şekiller İç Anadolu’da Kapadokya çevresinde görülür.
- **Doğru cevap:** Kapadokya (Nevşehir çevresi)

### Orta: Kaybolan Dere (`dis-02-karst-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Kimyasal çözünme: karstik şekiller
- **Deniz’in gözlemi:** Kalkerli platoda çukurlar (düden, dolin), yere gömülüp kaybolan dere, mağaralar; Akdeniz’e uzak değil.
- **Çözüm yolu:** Karstik şekiller kalkerli (kireçtaşı) arazide çözünmeyle oluşur. Türkiye’de en yaygın olduğu yer Toroslardır: Taşeli Platosu, Teke Yöresi ve Göller Yöresi. Bu üç bölgenin her biri doğru kabul edilir.
- **Doğru cevap:** Toroslar (Taşeli, Teke ve Göller Yöresi)

### Zor: Karlı Sirk (`dis-03-buzul-kackar-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Buzul aşındırması: sirk, U vadi, buzul gölü
- **Deniz’in gözlemi:** Yaz ortasında bile karlı yüksek zirveler; çanak biçimli çukurlar (sirk), U biçimli vadiler ve küçük göller; Karadeniz’e yakın.
- **Çözüm yolu:** Sirk, U vadi ve buzul gölleri buzul aşındırması ürünüdür. Türkiye’de Karadeniz’e yakın yüksek buzullu dağ Kaçkar Dağları’dır.
- **Doğru cevap:** Kaçkar Dağları (Rize–Artvin)
- **Doğrulanacak:** Kaçkar zirve koordinatının (≈40,84°K 41,15°D) atlasla kontrolü.

## Kayaçlar ve topraklar (`kayaclar-topraklar`)

İzinli yöntemler: Haritaya pin

### Kolay: Beyaz Kabuk (`kayac-01-tuz-golu-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Tuzlu topraklar ve kuru göl çevresi
- **Deniz’in gözlemi:** Zemin beyaz tuz kabuğuyla kaplı, bitki yok; sığ bir gölün kıyısındayım.
- **Çözüm yolu:** Kurak kapalı havzada buharlaşma tuz biriktirir (tuzlu toprak). İç Anadolu’daki büyük tuz gölü çevresi.
- **Doğru cevap:** Tuz Gölü çevresi

### Orta: Kara Taş (`kayac-02-taskomuru-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Tortul (organik) kayaç: taşkömürü
- **Deniz’in gözlemi:** Siyah, yanabilen, tabaka tabaka bir kayaç; yeraltı ocakları deniz kıyısına yakın, Karadeniz’in batısında.
- **Çözüm yolu:** Taşkömürü bitkisel kökenli tortul kayaçtır; Türkiye’de Zonguldak havzasında çıkarılır.
- **Doğru cevap:** Zonguldak çevresi
- **Doğrulanacak:** Havza yayılışı atlasla doğrulansın.

### Zor: Siyah Bazalt (`kayac-03-volkanik-agri-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Volkanik (püskürük) kayaç: bazalt
- **Deniz’in gözlemi:** Taban siyah, gözenekli bazalt akıntılarıyla kaplı; tepe her mevsim karlı bir koni.
- **Çözüm yolu:** Bazalt volkanik kayaçtır; karlı, uzun, sönmüş yanardağ konisi Türkiye’nin en yüksek dağı olan Ağrı’dır.
- **Doğru cevap:** Ağrı Dağı çevresi
- **Doğrulanacak:** Ağrı Dağı haritanın doğu ucunda kalır; tıklanabilirlik tarayıcıda denenmeli.

## Su kaynakları (`su-kaynaklari`)

İzinli yöntemler: Seçenek kartı

### Kolay: Soğuk Su (`su-02-kaynak-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Yeraltı suyu türleri: kaynak, artezyen, gayzer
- **Deniz’in gözlemi:** Yamaçta kayanın dibinden kendiliğinden süzülen soğuk bir su var; çevrede delik ya da kuyu yok.
- **Çözüm yolu:** Yeraltı suyunun doğal olarak yüzeye çıktığı yer kaynaktır. Artezyen kuyuyla basınçlı çıkar, gayzer sıcak su-buhar fışkırtır.
- **Doğru cevap:** Kaynak (pınar)

### Orta: Dar ve Uzun Göl (`su-01-gol-turu-kart`, Seçenek kartı, yazıldı)

- **Ölçülen kazanım:** Göl türleri: tektonik göl
- **Deniz’in gözlemi:** Uzun, dar, dik yamaçlı gölde fay izleri; çukur yerin çökmesiyle oluşmuş.
- **Çözüm yolu:** Fayların oluşturduğu çukurluktaki göl tektonik göldür.
- **Doğru cevap:** Tektonik göl

### Zor: Kabaran ve Çekilen (`su-03-akarsu-rejimi-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Akarsu rejimi (yağmur, kar, karma)
- **Deniz’in gözlemi:** Akarsu kışın ve ilkbaharda coşkun, yazın neredeyse kuruyor; yüksek dağlarda kalıcı kar yok.
- **Çözüm yolu:** Yağışa bağlı, yazın kuruyan düzensiz rejim Akdeniz ve Ege tipi akarsulara özgüdür. Kar rejiminde su ilkbahar sonu ve yazın yükselir (Doğu Anadolu).
- **Doğru cevap:** Düzensiz yağmur rejimi (Akdeniz–Ege tipi)

## Türkiye’nin yer şekilleri ve iklimi (`turkiye-yer-sekilleri-iklimi`)

İzinli yöntemler: Haritaya pin

### Kolay: Sodalı Göl (`tyer-01-van-golu-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Doğu Anadolu: yüksek plato, volkanik dağlar, büyük göl
- **Deniz’in gözlemi:** Yükselti 1600 m’nin üstü, kışlar çok sert; tuzlu ve sodalı büyük bir gölün kıyısı, çevrede sönmüş volkanlar.
- **Çözüm yolu:** Doğu Anadolu’da yüksek, soğuk ve volkanik bir bölge; ülkenin en büyük gölü Van Gölü’dür.
- **Doğru cevap:** Van Gölü çevresi

### Orta: Kapalı Havza (`tyer-02-konya-ovasi-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** İç Anadolu: kapalı havza, bozkır iklimi
- **Deniz’in gözlemi:** Denize hiçbir akarsu ulaşmıyor, geniş düz bir havza; kışlar soğuk, yağış az, ağaçsız bozkır; sulama için yer altı suyu çekiliyor.
- **Çözüm yolu:** Çevresi dağlarla çevrili, dışarıya akışı olmayan geniş ova İç Anadolu’nun güneyindeki Konya Ovası’dır.
- **Doğru cevap:** Konya Ovası

### Zor: Denize Dik Dağlar (`tyer-03-ege-enine-daglar-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Ege: dağların denize dik uzanışı, girintili kıyı, iklimin iç kesime sızışı
- **Deniz’in gözlemi:** Dağlar denize dik uzanıyor, vadiler batıya açılıyor, kıyı çok girintili çıkıntılı; deniz etkisi iç kesimlere kadar sokuluyor.
- **Çözüm yolu:** Dağların kıyıya dik uzandığı, çukur ovaların (grabenlerin) denize açıldığı bölge Ege Bölgesi’dir.
- **Doğru cevap:** Ege Bölgesi (İzmir–Manisa–Aydın)
- **Doğrulanacak:** Bölge geniş: merkez ve yarıçap atlasla ayarlanmalı.

## Nüfus ve yerleşme (`nufus-yerlesme`)

İzinli yöntemler: Seçenek kartı

### Kolay: Kalabalık Kıyı (`nufus-02-yogun-nufus-nedeni-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Nüfus yoğunluğunu etkileyen faktörler
- **Deniz’in gözlemi:** Marmara kıyılarında nüfus çok yoğun; Deniz nedenini soruyor.
- **Çözüm yolu:** Sanayi, ticaret ve ulaşımın gelişmiş olması nüfusu toplar; engebe ve sert iklim nüfusu azaltır.
- **Doğru cevap:** Sanayi, ticaret ve ulaşımın gelişmiş olması

### Orta: Evler Nerede? (`nufus-01-yerlesme-tipi-kart`, Seçenek kartı, yazıldı)

- **Ölçülen kazanım:** Dağınık ve toplu yerleşme
- **Deniz’in gözlemi:** Evler birbirinden uzak, ormanlık yamaçlara dağılmış; bol yağış, çok dere.
- **Çözüm yolu:** Bol yağış, bol su ve engebeli ormanlık arazi evlerin dağınık kurulmasına yol açar.
- **Doğru cevap:** Dağınık yerleşme

### Zor: Köyün Yeri (`nufus-03-yer-secimi-kart`, Seçenek kartı, planlı)

- **Ölçülen kazanım:** Yerleşme yeri seçimini etkileyen doğal faktörler (çoklu seçim)
- **Deniz’in gözlemi:** Köy akarsu kıyısında, düz ve verimli bir ovada kurulmuş; çevrede maden ve turistik tesis yok.
- **Çözüm yolu:** Yerleşme yerini en çok su kaynağı ve tarıma elverişli düz arazi belirler. Maden ve turizm bu köyün kuruluşunda etkili değildir. İki doğru seçilir.
- **Doğru cevap:** Su kaynağı ve düz tarım arazisi (çoklu seçim)

## Göç (`goc`)

İzinli yöntemler: Seçenek kartı, Grafik okuma

### Kolay: Fındık Mevsimi (`goc-01-mevsimlik-kart`, Seçenek kartı, yazıldı)

- **Ölçülen kazanım:** Süresine göre göç türleri: mevsimlik göç
- **Deniz’in gözlemi:** Fındık toplamak için başka şehirlerden gelen işçiler iş bitince evlerine dönüyor.
- **Çözüm yolu:** Dönüşü olan, iş mevsimine bağlı göç mevsimlik göçtür.
- **Doğru cevap:** Mevsimlik göç

### Orta: Duvardaki Piramit (`goc-02-piramit-grafik`, Grafik okuma, yazıldı)

- **Ölçülen kazanım:** Nüfus piramidinden genç nüfus yorumu
- **Deniz’in gözlemi:** Piramidin tabanı geniş, tepesi sivri.
- **Çözüm yolu:** Geniş taban yüksek doğum oranını ve genç nüfusu gösterir.
- **Doğru cevap:** Genç nüfus oranı yüksektir
- **Doğrulanacak:** Veri örnek (yaklaşık).

### Zor: Boşalan Orta Yaşlar (`goc-03-koyden-goc-piramit`, Grafik okuma, planlı)

- **Ölçülen kazanım:** Göçün nüfus piramidindeki izi (yaş ve cinsiyet seçiciliği)
- **Deniz’in gözlemi:** Köyün nüfus piramidinde genç ve orta yaş erkek çubukları belirgin biçimde dar.
- **Çözüm yolu:** İş için göç eden genç yetişkinler köyden ayrıldığı için 15-29 ve 30-44 yaş grupları azalır. Bu iki grup işaretlenir.
- **Doğru cevap:** 15-29 ve 30-44 yaş grupları
- **Doğrulanacak:** Veri örnek (yaklaşık); kitaptaki piramitle değiştirilebilir.

## Ekonomik faaliyetler (`ekonomik-faaliyetler`)

İzinli yöntemler: Haritaya pin

### Kolay: Yeşil Sıralar (`ekon-01-cay-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Tarım ürünleri ve yetiştiği yer: çay
- **Deniz’in gözlemi:** Yamaçlarda sıra sıra yeşil çalılar, yaprak toplayan işçiler; her gün yağış ve sis.
- **Çözüm yolu:** Çay bol, düzenli yağış ve nemli yamaç ister; Türkiye’de Doğu Karadeniz’de yetişir.
- **Doğru cevap:** Rize çevresi

### Orta: Kuru Tepelerde Fıstık (`ekon-02-antep-fistigi-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Tarım ürünleri ve iklim: antep fıstığı
- **Deniz’in gözlemi:** Kurak, kireçli ve taşlık tepelerde sıra sıra fıstık ağaçları; yazlar çok sıcak ve kurak.
- **Çözüm yolu:** Antep fıstığı sıcak ve kurak yazlara, kireçli taşlık topraklara dayanır. Türkiye’de Güneydoğu Anadolu’da, başta Gaziantep, Şanlıurfa ve Siirt çevresinde yetişir.
- **Doğru cevap:** Gaziantep–Şanlıurfa çevresi (Güneydoğu Anadolu)

### Zor: Beyaz Maden (`ekon-03-bor-pin`, Haritaya pin, planlı)

- **Ölçülen kazanım:** Madencilik: bor yatakları
- **Deniz’in gözlemi:** Açık ocaklardan beyaz, ince bir toz çıkarılıyor; dünyanın en büyük rezervi bu ülkede; Batı Anadolu’dayım.
- **Çözüm yolu:** Türkiye’nin bor yatakları Eskişehir (Kırka), Kütahya (Emet), Balıkesir (Bigadiç) ve Bursa (Kestelek) çevresinde yoğundur; dünya rezervinin yaklaşık dörtte üçü Türkiye’dedir.
- **Doğru cevap:** Eskişehir–Kütahya–Balıkesir çevresi (Batı Anadolu)

## Ulaşım (`ulasim`)

İzinli yöntemler: Rota çizme, Karar verme

### Kolay: Hangi Taşıma? (`ulasim-02-tasima-turu-karar`, Karar verme, planlı)

- **Ölçülen kazanım:** Taşıma türlerini seçme: hız, kapasite, maliyet
- **Deniz’in gözlemi:** 20 kg tıbbi malzeme Deniz’e 2 saat içinde ulaşmalı.
- **Çözüm yolu:** Adım 1: acil ve hafif yük için hava yolu en uygun. Adım 2: helikopterde hafif ve öncelikli malzeme yüklenir, ağır erzak sonraya bırakılır.
- **Doğru cevap:** Hava yolu, hafif ve acil malzeme önceliği

### Orta: Toros Geçidi (`ulasim-03-gulek-gecidi-rota`, Rota çizme, planlı)

- **Ölçülen kazanım:** Doğal geçitler ve ulaşım hatları (Çukurova–İç Anadolu bağlantısı)
- **Deniz’in gözlemi:** Yardım malzemesi Mersin limanından Ankara’ya kara yoluyla gidecek; Toroslar önde bir engel.
- **Çözüm yolu:** Çukurova’dan İç Anadolu’ya Toroslar Gülek Boğazı’ndan aşılır. Rota Mersin → Gülek Boğazı → Ankara sırasıyla çizilir.
- **Doğru cevap:** Mersin → Gülek Boğazı → Ankara

### Zor: Doğu Hattı (`ulasim-01-dogu-koridoru-rota`, Rota çizme, yazıldı)

- **Ölçülen kazanım:** Doğu-batı ana ulaşım koridoru (Doğu Ekspresi hattı)
- **Deniz’in gözlemi:** Yardım Ankara’dan trenle Kars’a gidecek; hat Kayseri, Sivas ve Erzurum’dan geçmeli.
- **Çözüm yolu:** Rota Ankara → Kayseri → Sivas → Erzurum → Kars sırasıyla çizilir.
- **Doğru cevap:** Ankara–Kayseri–Sivas–Erzurum–Kars

## Doğal afetler (`dogal-afetler`)

İzinli yöntemler: Karar verme

### Kolay: Sarsıntı Anı (`afet-01-deprem-karar`, Karar verme, yazıldı)

- **Ölçülen kazanım:** Deprem anında ve sonrasında doğru davranış
- **Deniz’in gözlemi:** Binanın ikinci katında sarsıntı başlıyor.
- **Çözüm yolu:** Adım 1: çök-kapan-tutun. Adım 2: sarsıntı bitince merdivenle çıkıp açık toplanma alanına gidilir.
- **Doğru cevap:** Çök-Kapan-Tutun, sonra açık alan

### Orta: Yükselen Dere (`afet-02-sel-karar`, Karar verme, yazıldı)

- **Ölçülen kazanım:** Sel anında doğru davranış
- **Deniz’in gözlemi:** Dere kenarında sağanak, su bulanıklaşıp yükseliyor.
- **Çözüm yolu:** Adım 1: dere yatağından uzaklaşıp yükseğe çık. Adım 2: güvenli yerde telsizle konum bildir.
- **Doğru cevap:** Yükseğe çık, konum bildir

### Zor: Kayan Yamaç (`afet-03-heyelan-karar`, Karar verme, planlı)

- **Ölçülen kazanım:** Heyelan belirtilerini tanıma ve davranış (üç adımlı)
- **Deniz’in gözlemi:** Yağmurlu yamaçta zeminde yeni çatlaklar, eğilmiş ağaçlar ve yeni su sızıntıları görülüyor.
- **Çözüm yolu:** Adım 1: belirtileri heyelan riski olarak oku, hemen uzaklaş. Adım 2: hareket yönüne dik, yüksek ve sağlam zemine git. Adım 3: telsizle bildir, bölgeye geri dönme.
- **Doğru cevap:** Uzaklaş, dik yönde yükseğe, bildir

## Doğrulama günlüğü (13 Kasım 2026)

Bu kontrol web kaynaklarıyla yapıldı (MEB materyalleri, Ankara Üniv. açık ders notları, akademik makaleler, AFAD özetleri). Öğrencinin kullanacağı ders kitabıyla son kontrol yine de gerekir.

| Vaka | Bilgi | Sonuç | Kaynak ve not |
|---|---|---|---|
| dunya-02, dunya-01, dunya-03 | Dönence 23°27′, kutup dairesi 66°33′; 21 Haziran’da Yengeç, 21 Aralık’ta Oğlak Dönencesi’ne dik | **Doğrulandı** | MEB 9. sınıf materyalleri, Ankara Üniv. açık ders notları |
| konum-02 | 1° boylam = 4 dakika (Türkiye’nin 19° boylam farkı = 76 dk ile tutarlı) | **Doğrulandı** | MEB 9. sınıf Türkiye’nin coğrafi konumu |
| konum-01, konum-03 | Türkiye 36°-42° K, 26°-45° D arasında; en kuzey nokta Sinop–İnceburun (42°05′43″K) | **Doğrulandı** | MEB 9. sınıf kitabı. Bazı kaynaklar Kırklareli sınırını (42°06′21″K) gösterir, vakada kitap esas alındı |
| harita-01 | Ölçek hesabı: harita uzaklığı × paydası | **Doğrulandı** | MEB 9. sınıf ölçek örnekleri |
| harita-03 | Eğim (%) = yükselti farkı ÷ yatay uzaklık × 100 | **Doğrulandı** | TYT ders notları. Bazı kaynaklar binde (‰) kullanır, vakada formül açıkça yazıldı |
| elemanlar-01, elemanlar-03 | Yükseldikçe her 200 m’de yaklaşık 1°C azalma; indirgenmiş sıcaklık = gerçek sıcaklık + yükseltiden kaybedilen | **Doğrulandı** | MEB/TYT kaynakları, Ankara Üniv. ders notları |
| elemanlar-03 (eski sürüm) | Basınç: her 10 m’de 1 mb azalma | **Düzeltildi** | Türkçe kaynaklar 10,5 m’de 1 mm Hg ya da yaklaşık 11 m’de 1 mb veriyor. Kural kitaplar arasında değiştiği için vaka kaldırıldı, yerine indirgenmiş sıcaklık vakası yazıldı |
| su-01 | Eğirdir Gölü tektonik göldür | **Düzeltildi** | Birçok kaynakta Eğirdir ve Beyşehir “karma (tektonik-karstik)” sayılıyor. Örnek olarak İznik, Burdur, Hazar kullanıldı |
| tyer-01 | Van Gölü: en büyük, sodalı, volkanik set/tektonik-volkanik, yaklaşık 1646 m | **Doğrulandı** | Ankara Üniv. ders notları, haber ve ansiklopedi kaynakları. Yükselti ifadesi “1600 m’nin üstü” yapıldı |
| ulasim-03 | Gülek Boğazı: Toroslar’ın en önemli geçidi, Akdeniz’i İç Anadolu’ya bağlar, ≈37°17′K 34°47′D | **Doğrulandı** | Akademik makale ve Cilician Gates kaydı |
| dis-03 | Kaçkar Dağları’nda sirk, tekne (U) vadi, buzul gölleri, güncel buzullar | **Doğrulandı** | Ankara Üniv. ders notu, dergipark makaleleri. Buzulların en zengin olduğu yer Güneydoğu Toroslar’dır, bu yüzden vakada “Karadeniz’e yakın” ipucu şart |
| dis-02 | Karstik şekiller: Taşeli, Teke, Göller Yöresi; Konya obruk platosu | **Düzeltildi** | Tek merkezli cevap haksız yanlış üretirdi; birden çok kabul alanı (alternatif hedef) eklendi |
| ekon-03 | Bor yatakları: Kırka (Eskişehir), Emet (Kütahya), Bigadiç (Balıkesir), Kestelek (Bursa); dünya rezervinin ≈%72-73’ü | **Düzeltildi** | Kabul alanı dört yatağı kapsayacak şekilde genişletildi, metinde sayı verilmedi |
| ekon-02 | Antep fıstığı: Güneydoğu Anadolu; Şanlıurfa en geniş alan, Gaziantep ve Siirt önemli | **Düzeltildi** | “Kışlar ılık” ifadesi kaldırıldı, kabul alanı Şanlıurfa’yı kapsayacak şekilde kaydırıldı |
| su-03 | Akdeniz ve Ege akarsuları yağmur rejimli ve düzensiz; Doğu Anadolu ve Doğu Karadeniz akarsuları kar rejimli | **Doğrulandı** | Ankara Üniv. ders notu. “Karadeniz akarsuları düzenli” ifadesi kaynaklarda tartışmalı olduğu için çıkarıldı |
| afet-01, afet-02, afet-03 | Çök-kapan-tutun; sel sırasında suyun içinden geçmeme, aracı terk etme; heyelan belirtileri ve kayma hattından yana uzaklaşma | **Doğrulandı** | AFAD kaynaklı özetler |
| ulasim-01 | Doğu Ekspresi: Ankara–Kırıkkale–Kayseri–Sivas–Erzincan–Erzurum–Kars (1310 km) | **Düzeltildi** | Hat bugün Ankara’dan başlıyor ve Kayseri’den geçiyor (İstanbul çıkışı 1936’daki ilk seferdi). Vaka Ankara başlangıçlı yazıldı |
| konum-01, dis-01, kayac-01, kayac-02, kayac-03, ekon-01, tyer-02, tyer-03 | Koordinatlar ve bilgiler: Adana yöresi, Kapadokya tüf aşınması, Tuz Gölü (tuzlu toprak), Zonguldak taşkömürü, Ağrı Dağı volkanik, Rize çayı, Konya kapalı havzası, Ege’de dağların dik uzanışı | **Kontrol edilmedi** | Genel bilgi; bu oturumda ayrı kaynakla tek tek denetlenmedi (Konya kapalı havzası ve Ağrı Dağı kısmen kaynaklarda görüldü). Ders kitabından hızlı kontrol önerilir |
| ic-01, ic-02, ic-03, nufus-02, nufus-03, goc-01, goc-03 | İç kuvvet tanımları (deprem, kıvrım, horst, graben), nüfus yoğunluğu ve yerleşme yeri faktörleri, mevsimlik göç, göçün piramit etkisi | **Kontrol edilmedi** | Temel kavramlar; bu oturumda ayrı kaynakla denetlenmedi. Ders kitabıyla karşılaştırılmalı |
| iklim-03, iklim-04, goc-02, goc-03 | Grafik verileri (iklim ve nüfus piramidi) | **Kontrol edilmedi** | Verilerin tamamı örnek (yaklaşık) değerlerdir, gerçek istasyon verisi değildir |