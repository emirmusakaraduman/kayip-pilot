import type { DefterSayfasi } from '../game/types'

// Deniz'in defteri: her konu bitince bir sayfa açılır (toplam 15).
// Metinler pilotun ağzından yazılmış kısa ders notlarıdır; satır başı \n ile ayrılır.
export const DEFTER: DefterSayfasi[] = [
  {
    konu: 'dunya-sekli',
    metin: `Dünya kutuplardan hafif basık bir küredir (geoid).
Dönme: 24 saat, batıdan doğuya. Sonucu: gece-gündüz, yerel saat farkı, hareketli cisimlerin sapması (Kuzey Yarım Küre'de sağa).
Dolanma: yaklaşık 365 gün 6 saat. Eksen eğikliği (23°27') yüzünden mevsimler oluşur.
21 Haziran: ışınlar Yengeç Dönencesi'ne dik. 21 Aralık: Oğlak Dönencesi'ne dik. 21 Mart ve 23 Eylül: gece-gündüz eşit.
Not: Kutup Yıldızı'nın ufuktan yüksekliği = bulunduğum enlem.`,
  },
  {
    konu: 'cografi-konum',
    metin: `Matematik konum: enlem ve boylamla bulunur. Türkiye yaklaşık 36°-42° Kuzey, 26°-45° Doğu arasında.
Özel konum: üç tarafı deniz, Asya ile Avrupa'nın kavşağı, boğazlar Türkiye'de.
1° boylam = 4 dakika. Doğuya gidince saat ileri, batıya gidince geri gider.
İki paralel arası her yerde yaklaşık 111 km. Meridyenler arası uzaklık ekvatorda en fazla, kutuplarda sıfır.
Not: Türkiye'nin doğusu ile batısı arasında yerel saat farkı yaklaşık 76 dakika.`,
  },
  {
    konu: 'harita',
    metin: `Ölçek haritanın küçültme oranıdır. 1/100.000 ölçekte 1 cm = 1 km. Ölçek küçüldükçe alan genişler, ayrıntı azalır.
Eş yükselti eğrileri: sık ise yamaç dik, seyrek ise eğim az. Yüksek kotlara girinti yapan eğri vadi, alçak kotlara çıkıntı yapan eğri sırt demektir.
Eğim (%) = yükselti farkı ÷ yatay uzaklık × 100.
İzdüşüm: küreyi düzleme, silindire veya koniye yansıtarak harita çizilir; her yöntemde bir şey bozulur.
Not: Haritayı okurken önce ölçeğe, sonra eğrilere bak.`,
  },
  {
    konu: 'iklim-elemanlari',
    metin: `Sıcaklık: yükseldikçe her 200 m'de 1°C azalır. Enlem, denize uzaklık, akıntılar ve bakı da etkiler.
Basınç: sıcak hava hafif, alçak basınç; soğuk hava ağır, yüksek basınç. Rüzgâr yüksek basınçtan alçak basınca eser.
Meltem: gündüz denizden karaya, gece karadan denize.
Yağış: yamaç yağışı (dağa çarpıp yükselen nemli hava), konveksiyonel (ısınıp yükselen hava), cephe yağışı (sıcak ve soğuk havanın karşılaşması).
Fön: dağın arkasına inen sıcak ve kuru rüzgâr.`,
  },
  {
    konu: 'iklim-bitki',
    metin: `Akdeniz iklimi: yaz sıcak ve kurak, kış ılık ve yağışlı. Bitki örtüsü maki; zeytin, incir, narenciye yetişir.
Karadeniz iklimi: her mevsim yağışlı. Sık ormanlar; çay ve fındık.
Karasal iklim: yağış az, yaz-kış farkı büyük. Bitki örtüsü bozkır (step); buğday ve arpa.
Sert karasal iklim (Doğu Anadolu): kış çok uzun ve karlı, yaz kısa. Yüksek yerlerde çayır ve mera.
Not: Bitkiyi görünce iklimi tahmin edebilirim.`,
  },
  {
    konu: 'ic-kuvvetler',
    metin: `İç kuvvetler yer kabuğunu içeriden şekillendirir.
Orojenez: tabakaların kıvrılması ve kırılması (dağ oluşumu). Epirojenez: geniş alanların yavaşça yükselmesi veya alçalması.
Deprem: fay hatlarında enerji boşalması. Türkiye'de en önemlileri Kuzey Anadolu ve Doğu Anadolu fay hatları.
Volkanizma: magmanın yüzeye çıkması (Erciyes, Ağrı, Nemrut).
Ege'de doğu-batı uzanan horst ve grabenler var. Van Gölü, Nemrut'un lavlarının oluşturduğu volkanik set gölüdür.`,
  },
  {
    konu: 'dis-kuvvetler',
    metin: `Dış kuvvetler yüzeyi aşındırır, taşır, biriktirir.
Ayrışma: fiziksel (don çatlaması) ve kimyasal (suyla çözünme).
Akarsu: yüksek eğimde derin V vadi, ovada menderes, ağızda delta.
Rüzgâr: kurak yerlerde kum tepeleri. Buzul: sirk ve U vadi. Dalga: falez, tombolo.
Karstlaşma: kireçtaşında çözünme; dolin, düden, polye, mağara. Yüzeyde akarsu yok, kaynaklar güçlü.
Kapadokya peribacaları: sert ve yumuşak tabakaların farklı aşınması.`,
  },
  {
    konu: 'kayac-toprak',
    metin: `Kayaçlar: magmatik (derinlik: granit; püskürük: bazalt), tortul (kil, kireçtaşı, kömür; katmanlı, fosilli), başkalaşım (mermer, gnays).
Topraklar iklime göre oluşur.
Terra rossa: Akdeniz ikliminde kireçtaşı üstünde, kırmızı.
Çernozyom: bozkırda, kara ve humusça zengin; Türkiye'de Kuzeydoğu Anadolu'da görülür.
Podzol: soğuk ve nemli ormanlık alanlarda, kumlu ve verimsiz.
Alüvyal toprak: akarsuların biriktirdiği taze, verimli toprak.`,
  },
  {
    konu: 'su-kaynaklari',
    metin: `Akarsu rejimi beslenmeye bağlı: Doğu Anadolu'da karla beslenir (ilkbahar-yaz başında yüksek), Akdeniz kıyısında yağmurla beslenir (kışın yüksek, yazın düşük), Karadeniz'de düzenlidir.
Fırat, Karasu ile Murat'ın birleşmesiyle oluşur ve Basra Körfezi'ne ulaşır.
Kızılırmak Türkiye'nin en uzun akarsuyudur ve Karadeniz'e dökülür.
Göller: tektonik (Tuz Gölü), volkanik set (Van Gölü), karstik ve baraj gölleri.
Ağızda biriken alüvyon delta oluşturur; Çukurova bir örnektir.`,
  },
  {
    konu: 'turkiye-yer-iklim',
    metin: `Dağlar: Kuzey Anadolu Dağları Karadeniz'e, Toroslar Akdeniz'e paralel uzanır. En yüksek nokta Ağrı Dağı (5137 m).
Ovalar: Çukurova, Konya, Ergene. Ege'de grabenler denize açılır.
İklim: kıyılar ılıman, iç kesimler karasal. En çok yağış Doğu Karadeniz'de, en az yağış İç Anadolu'da.
Tuz Gölü İç Anadolu'da, Türkiye'nin ikinci büyük gölü.
Not: Denizi hangi yanımda gördüğüm, hangi kıyıda olduğumu söyler.`,
  },
  {
    konu: 'nufus-yerlesme',
    metin: `Nüfus yoğunluğu = nüfus ÷ yüzölçümü (kişi/km²).
Doğal artış hızı = doğum hızı − ölüm hızı. Nüfus artış hızı = doğal artış + net göç.
Türkiye'de nüfus kıyılarda ve Marmara ile Ege'de yoğun, Doğu Anadolu'nun yüksek kesimlerinde seyrek.
Yerleşme: toplu (düz, verimli, su kıt yerler) ve dağınık (engebeli, yağışlı, ormanlık yerler; Karadeniz kırsalı).
Not: Köy ve kent ayrımını işlevlerine bakarak yapıyorum.`,
  },
  {
    konu: 'goc',
    metin: `Göç, yer değiştirmedir: iç göç (ülke içi) ve dış göç.
Gönüllü göçte itici (işsizlik, arazi azlığı) ve çekici (iş, eğitim, sağlık) etkenler vardır. Zorunlu göç: savaş, afet, mübadele (1923).
Mevsimlik göç geçicidir: yaylacılık, tarım işçiliği.
Net göç hızı = (gelen − giden) ÷ nüfus × 1000. Negatifse bölge göç verir.
Sonuç: göç veren yerde yaşlı oranı artar; göç alan yerde konut ve altyapı sorunları yaşanır.`,
  },
  {
    konu: 'ekonomi',
    metin: `Tarım: çay ve fındık Karadeniz'de, zeytin ve incir Ege'de, narenciye ve pamuk Akdeniz kıyılarında, buğday İç Anadolu'da.
Hayvancılık: ekstansif (geniş meralar, düşük sermaye) ve entansif (ahır, yem, yüksek sermaye).
Madencilik: Zonguldak Türkiye'nin tek taş kömürü havzası; linyit, bor ve krom da önemli.
Sanayi ham maddeye, enerjiye, pazara ve ulaşıma yakın kurulur.
Turizm: deniz, tarih, kış ve inanç turizmi.`,
  },
  {
    konu: 'ulasim',
    metin: `Karayolu Türkiye'de yük ve yolcu taşımacılığında en çok kullanılan yoldur.
Denizyolu: en ucuz, büyük miktarda ağır yük için ideal. Havayolu: en hızlı ama pahalı. Demiryolu: ağır yük ve uzun mesafe.
Boğazlar: Karadeniz, İstanbul Boğazı, Marmara, Çanakkale Boğazı, Ege sırasıyla birbirine bağlanır.
Boru hatları ham petrol ve doğal gaz taşır.
Dağlar yolları geçitlere ve tünellere mecbur bırakır; kar kışın yolları kapatabilir.`,
  },
  {
    konu: 'dogal-afet',
    metin: `Deprem: fay hatlarında oluşur. Kuzey Anadolu ve Doğu Anadolu fayları en riskli olanlardır. Sarsıntıda: Çök-Kapan-Tutun.
Heyelan: eğimli, bitki örtüsü zayıf, suya doymuş yamaçlarda toprak kayması (Karadeniz).
Sel: ani ve şiddetli yağışlarda taşkın. Çığ: eğimli yamaçta taze kar kütlesinin kayması.
Orman yangını ve erozyon da insan eliyle büyür.
Hazırlık: afet çantası, toplanma alanı, yapı denetimi ve ağaçlandırma.
Not: Kurtarma ekibi gelene kadar sakin kalmak en önemli şey.`,
  },
]
