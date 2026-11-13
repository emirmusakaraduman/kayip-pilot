# Kayıp Pilot — Başvuru Metni

> İşler Kitabevleri × İşler Teknoloji — 24 Saatlik Eğitim Oyunu Hackathonu (13 Kasım 2026)
> Proje sahibi: [AD SOYAD] · İletişim: [E-POSTA] · Takım: tek kişi (Claude Code ile geliştirildi)
> Köşeli parantezli alanları göndermeden önce doldur.

---

## 1. Tek cümle

**Kayıp Pilot**, TYT coğrafya konularını, düşen bir helikopterin pilotunu telsizden gelen ipuçlarıyla bulmaya çalışan bir dedektif oyununa dönüştüren tarayıcı tabanlı 3D bir eğitim oyunudur.

## 2. Kısa sürüm (≈280 karakter)

Gün batımında bir helikopter ormana düşüyor. Sen telsiz operatörüsün; pilot Deniz yalnızca çevresini tarif edebiliyor: iklim, bitki, harita, yer şekli. İpuçlarından konumu çıkar, TYT coğrafya konularını dedektiflik yaparak öğren.

## 3. Orta sürüm (≈130 kelime)

Kayıp Pilot'ta oyuncu bir kurtarma merkezinde telsiz operatörüdür. Tıbbi malzeme taşıyan helikopter TC-KRT ormanlık bir arazide düşmüştür; pilot Deniz hayattadır ama yerini bilmez. Telsizden yalnızca çevresini anlatır: sıcaklık, bitki örtüsü, harita bilgisi, yer şekilleri. Oyuncu bu ipuçlarını TYT coğrafya bilgisiyle çözerek konumu bulur.

15 konunun her biri için kolay, orta ve zor birer vaka vardır (toplam 45). Çözülen her konu, Deniz'in defterine o konunun ders notunu ekler. Karma mod olan Büyük Arama'da bu defter sayfaları ipucu olarak geri döner. Yanlış cevaplar telsiz pilini düşürür ve her yanlıştan sonra kısa bir açıklama gelir.

Oyun React, Three.js ve Web Audio ile tarayıcıda çalışır; kurulum gerektirmez.

---

## 4. Uzun sürüm

### 4.1 Problem

TYT coğrafya, ezber görüntüsü veren ama aslında çıkarım isteyen bir ders. Öğrenci "200 m'de 1°C" kuralını bilir; ama bir bitki örtüsü tarifinden iklimi, iklimden bölgeyi çıkarmak ayrı bir beceridir. Klasik soru bankaları bu çıkarım zincirini bağlamsız sorular olarak sunar ve öğrenci "bunu neden bilmem gerekiyor?" sorusuna yanıt bulamaz.

### 4.2 Fikir

Coğrafya zaten bir **konum bulma bilimi**: bulunduğun yeri enlem, boylam, iklim, bitki ve yer şekillerinden okursun. Kayıp Pilot bu özelliği doğrudan oyunun çekirdeği yapar. Pilot Deniz'in tarif ettiği her şey bir kanıt, oyuncunun her cevabı bir sonraki adımı daraltan bir bulgudur. Konu bilgisi, oyunun hedefine (pilotu bulmak) hizmet eder; hedeften kopuk bir bilgi sorusu yoktur.

### 4.3 Oyun akışı

1. **Başlık ekranı** ve içerik uyarısı. Tarayıcının ses kuralı gereği ses, "Başla" tıklamasından sonra açılır.
2. **Açılış sinematiği (38 sn):** gün batımında helikopter uçarken sol motor alev alır, kuyruk kontrolü gider, aracın dönerek alçalması, rotorun ağaç tepelerine çarpıp kopması, iniş, yan yatma, patlama ve yanan enkaz; ardından telsiz odasına geçilir. Atla ve Ses düğmeleri vardır. Her bölüm başında yaklaşık 16 saniyelik kısa sürümü, bölümün iklim ortamıyla (Akdeniz, Karadeniz, karasal, sert karasal) oynar.
3. **Telsiz odası:** gece, yağmurlu pencere, masada yeşil ekranlı telsiz, Deniz'in defteri, jeton kavanozu, Türkiye kabartma haritası. Deniz'in tarifi telsiz ekranında ve altyazıda **kelime kelime** yazılır; pil azaldıkça kelimeler `[cızırtı]` olur.
4. **Vaka çözümü:** soru, tarife göre farklı cevap türleriyle sorulur.
5. **Geri bildirim:** doğru cevap jeton ve defter sayfası kazandırır; yanlış cevap telsiz pilini %5 düşürür ve kısa bir açıklama gösterir, vaka "yanlış defteri"ne yazılır.

### 4.4 İki mod

- **Konu Modu:** 15 konu × 3 zorluk = **45 vaka**. Konular: dünyanın şekli ve hareketleri, coğrafi konum, harita bilgisi, iklim elemanları, iklim tipleri ve bitki örtüsü, iç kuvvetler, dış kuvvetler, kayaçlar ve topraklar, su kaynakları, Türkiye'nin yer şekilleri ve iklimi, nüfus ve yerleşme, göç, ekonomik faaliyetler, ulaşım, doğal afetler.
- **Büyük Arama:** karma, 6 aşamalı bir hikâye. Deniz'in defterinden okunan her sayfa tek bir ipucu verir; oyuncu sırayla enlemi, boylamı, yüksekliği, iklim kuşağını ve karstik arazi yapısını bulup son aşamada Deniz'in yerini haritada işaretler. Bulgular birbiriyle çelişmez ve tek bir yere işaret eder. Konu Modu'nda kazanılmış defter sayfaları, Büyük Arama'da **ücretsiz ipucu** olarak okunabilir; iki mod birbirini besler.

### 4.5 Cevap türleri

Tek bir cevap motoru bütün vakaları değerlendirir. Kullanılan türler: seçenek kartları, sayı girişi, haritada iklim bölgesi seçme, haritada nokta işaretleme, rota sıralama, karar. Motor grafik türünü de destekler (vakalarda henüz kullanılmadı).

### 4.6 Öğrenme tasarımı

- **Bağlam içinde çıkarım:** bilgi, bir hedefe giden delil olarak sorulur.
- **Yanlıştan öğrenme:** her yanlışta kısa açıklama; "yanlış defteri" tekrar için birikir.
- **Kademeli ipucu:** meteorolog Nuri ve haritacı Ayşe ipucu verir (1 jeton). İpucusuz bitirmek ek jeton kazandırır, böylece ipucu kullanımı bir tercih haline gelir.
- **Biriken not defteri:** konu bittiğinde açılan sayfa, o konunun özet kurallarını ve ilgili formülleri içerir (15 sayfa). Defter, öğrencinin tekrar için kullanabileceği bir ders notuna dönüşür.
- **Tekrarın doğal yolu:** Büyük Arama aynı konuları farklı bir bağlamda yeniden sorar.
- **Doğrulama:** ders kitabı kuralları (200 m'de 1°C, 1° boylam = 4 dakika, ardışık paraleller arası ≈111 km, ölçek ve eğim hesabı, nüfus artış ve net göç hızı) otomatik testlerle vakaların cevaplarına karşı kontrol edilir.

### 4.6.1 Ölçülebilir hedefler (iddia değil, tasarım hedefi)

Henüz öğrenci verisiyle test edilmedi. Hedef: oyuncunun bir konuyu bitirdiğinde o konudaki çıkarım zincirini (tarif → kural → sonuç) bir sonraki konuda tekrar kullanabilmesidir. Pilot kullanımda ölçülecek göstergeler: vaka başına yanlış sayısı, ipucu kullanım oranı, Büyük Arama'yı ipucusuz bitirme oranı.

### 4.7 Kitap bağlantısı (yol haritası)

İşler Kitabevleri'nin basılı yayınlarıyla bağlantı için tasarlanan mekanik: kitap QR'ı ile jeton kazanma. Bu özellik bu sürümde **yoktur**; jeton ekonomisi (kazanma/harcama) kodda hazırdır, QR bağlantısı eklenmeye uygundur.

### 4.8 Teknik yapı

- **Teknoloji:** React, Vite, TypeScript, React Three Fiber (Three.js), Zustand (yerel depolamada kalıcı oyun durumu), Web Audio, Vitest.
- **Sinematik:** gökyüzü ve bulut gölgelendiricisi, ufukta sisli dağ katmanları, tarla parçalı zemin, güneş gölgeleri, rüzgârda sallanan ağaçlar, ortam yansıması, bloom. Ağaçlar çok sayıda olduğu için yakınlığa göre ayrıntı seviyesi (LOD) ve örnekli çizim kullanılır.
- **Ses:** tüm sesler (motor, rotor vuruşu, rüzgâr, alarm, çarpma, patlama, yangın, telsiz paraziti) Web Audio ile kodla üretilir; ses dosyası yoktur.
- **Harita:** Türkiye kabartma haritası, iklim bölgeleri maskesinden üretilir. Tıklanabilir; vakalar haritayı cevap aracı olarak kullanır.
- **Takılıp çıkarılabilir varlık sistemi:** helikopter, ağaç türleri ve üç karakter için birer yuva vardır; hepsi şimdilik basit yer tutucu şekillerle çalışır. GLB dosyası verildiğinde tek satırla değişir. Her varlık için yazar, kaynak ve lisans alanı tutulur; ticari kullanıma uygun olmayan (NC) lisanslı bir varlık, bilerek onaylanmadıkça yüklenmez.
- **Kalite:** 31 otomatik test (45 vakanın bütünlüğü, cevap motoru, coğrafya hesapları, defter metinleri, Büyük Arama tutarlılığı, sinematik zaman çizelgesi).
- **Boyut:** üretim derlemesi yaklaşık 1,5 MB JS (gzip ≈ 414 KB); henüz kod bölme yapılmadı.

### 4.9 Bu sürümde olanlar / olmayanlar

**Hazır ve çalışıyor:** başlık ekranı, 38 sn açılış sinematiği ve kısa sürümü, telsiz odası ve 5 kamera açısı, kabartma harita, 45 vaka, 15 defter sayfası, yanlış defteri, jeton ve pil mekaniği, Büyük Arama (6 aşama), Web Audio sesleri, yerel kayıt.

**Henüz yok (dürüstçe):**
- Gerçek 3D varlıklar (helikopter, ağaçlar, Deniz/Nuri/Ayşe) — yer tutucu kullanılıyor; modeller sonradan eklenecek.
- Gerçek yükseklik verisi (SRTM) — harita yükseklikleri ve iklim sınırları şimdilik elle tahmin edilmiş kaba bir yaklaşımdır.
- Günlük ve tekrar jetonu, kitap QR'ı, otomatik zorluk uyarlaması (motorda hazır, arayüze bağlı değil), grafik cevap arayüzü, ek hak mekaniği.
- Öğrenci verisiyle bir pilot test.
- Mobil için ayrıca uyarlanmış arayüz.

### 4.10 Özgünlük ve lisans beyanı

- Oyunun hikâyesi, 45 vakası, 15 defter sayfası ve Büyük Arama olay örgüsü bu proje için özgün olarak yazılmıştır.
- Üçüncü taraf 3D model, doku, ses veya görsel kullanılmamıştır; modeller yer tutucu geometridir, sesler kodla üretilir.
- Kullanılan açık kaynak kütüphanelerin lisansları (React, Three.js, React Three Fiber, drei, postprocessing, Zustand, Vite, Vitest) gönderimden önce son kez gözden geçirilmelidir.
- Geliştirme sürecinde yapay zekâ kodlama asistanı (Claude Code) kullanılmıştır.

---

## 5. 90 saniyelik demo senaryosu

1. (0–10 sn) Başlık ekranı → **Başla**. Açılış sinematiği: helikopterin düşüşü ve patlama.
2. (10–25 sn) Telsiz odası: Deniz'in tarifi kelime kelime yazılır. Soru: "Güneş ışınları 72,5° geliyor, hangi enlemdeyim?" Doğru cevap → jeton ve defter sayfası.
3. (25–45 sn) Bir vakada **yanlış cevap**: pil düşer, açıklama çıkar, yanlış defterine yazılır.
4. (45–65 sn) **Haritadan bölge seçme:** "Yazlar kurak, çevrede zeytin ve maki." Kabartma haritada Akdeniz kuşağına tıkla.
5. (65–90 sn) **Büyük Arama:** arama panosunda biriken bulgular, defter sayfasından ücretsiz ipucu, finalde Deniz'i haritada işaretle.

## 6. Yol haritası (hackathon sonrası)

1. Gerçek 3D varlıkların eklenmesi (lisans ve atıf alanlarıyla).
2. SRTM yükseklik verisi ve gerçek sınır/iklim maskesi.
3. İşler Kitabevleri kitap QR'ı ile jeton kazanma; günlük ve tekrar jetonları.
4. Zorluk uyarlamasının arayüze bağlanması; grafik cevapları.
5. Pilot sınıf testi ve ölçüm göstergeleri (bkz. 4.6.1).
6. Mobil uyum ve kod bölme ile ilk yükleme süresinin düşürülmesi.
