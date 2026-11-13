import type { KonuId, Vaka } from '../game/types'

// ─────────────────────────────────────────────────────────────
// BÜYÜK ARAMA — olay örgüsü
//
// Enkazdan çıkan Deniz'in elinde GPS ve harita yoktur; yalnızca uçuş eğitiminden beri
// ders notlarını yazdığı defteri vardır. Gecenin soğuğunda defterin sayfalarını telsizden
// okur. Her sayfa tek bir ipucu verir; oyuncu ipucunu çözerek arama alanını daraltır ve
// altıncı aşamada Deniz'in yerini haritada işaretler.
//
// Bulgular birbiriyle çelişmez ve sırayla tek bir yere işaret eder:
//   1) 41°K  2) 33,5°D  3) ≈1200 m yükseklik  4) Karadeniz iklimi  5) kireçtaşı karst arazi
//   → Batı Karadeniz'deki Küre Dağları yöresi (Kastamonu).
// Aşamalar, Konu Modu'ndaki sayfalarla aynı konulardan çıkar; o sayfayı kazanmış oyuncu
// defterden okuyarak ücretsiz ipucu alır (Konu Modu ile Büyük Arama birbirini besler).
// ─────────────────────────────────────────────────────────────

export const ARAMA_HIKAYE = {
  baslik: 'Büyük Arama',
  giris: [
    'Gece çöktü. TC-KRT\'nin enkazı uzakta yanmaya devam ediyor; Deniz sağ, ama nerede olduğunu bilmiyor.',
    'Elinde yalnızca uçuş okulundan beri tuttuğu defter var. Telsiz pilinin yettiği kadar sayfaları okuyacak.',
    'Her sayfa bir ipucu. Defterin sayfalarını çöz, arama alanını daralt, Deniz\'in yerini haritada bul.',
  ],
  final: [
    'Arama ekipleri işaretlediğin yere ilerledi. Küre Dağları\'nın karstik yaylasında, enkazdan birkaç kilometre uzakta bir ateş görüldü.',
    'Deniz, defteri göğsünde, yanıyordu: elinde yarım kalmış son sayfa.',
    'Merkez telsizinden tek cümle geldi: "Sayfaları okuduğun için teşekkürler. Yönümü sayende buldum."',
  ],
  odul: 5,
}

export interface AramaAsamasi {
  /** Defterdeki hangi sayfa (konu) okunuyor; oyuncu o sayfayı kazanmışsa ücretsiz ipucu alır. */
  defterSayfa: KonuId
  /** Merkez'in aşama başı anlatısı. */
  merkez: string
  vaka: Vaka
  /** Doğru cevaptan sonra arama panosuna eklenen bulgu. */
  bulgu: string
}

const ORTAM = 'karadeniz' as const

export const ARAMA_ASAMALARI: AramaAsamasi[] = [
  {
    defterSayfa: 'dunya-sekli',
    merkez: 'Aşama 1/6 — Önce paralel: Deniz gökyüzüne bakıyor.',
    bulgu: 'Deniz 41° Kuzey paralelinde.',
    vaka: {
      id: 'buyuk-arama-1',
      konu: 'dunya-sekli',
      zorluk: 'kolay',
      ortam: ORTAM,
      baslik: 'Sayfa 1: Yıldızlar',
      telsiz: [
        'Merkez, burası Deniz. Defterimin 1. sayfasına bakıyorum.',
        'Gökyüzü açık. Kutup Yıldızı\'nı ufkun tam 41 derece üstünde ölçtüm.',
      ],
      ipucuAyse: 'Kuzey Yarım Küre\'de Kutup Yıldızı\'nın ufuktan yüksekliği, bulunulan yerin enlemine eşittir.',
      soru: 'Deniz hangi enlemde (paralelde) bulunuyor?',
      cevap: { tur: 'sayi', dogru: 41, tolerans: 0, birim: '°K' },
      aciklama: 'Kutup Yıldızı\'nın ufuktan yüksekliği enleme eşittir: 41° ise enlem 41° Kuzey\'dir.',
    },
  },
  {
    defterSayfa: 'cografi-konum',
    merkez: 'Aşama 2/6 — Şimdi meridyen: Deniz saatini Merkez\'inkiyle karşılaştırıyor.',
    bulgu: 'Deniz 33,5° Doğu meridyeninde. Enlem ve boylam kesişti.',
    vaka: {
      id: 'buyuk-arama-2',
      konu: 'cografi-konum',
      zorluk: 'orta',
      ortam: ORTAM,
      baslik: 'Sayfa 2: Saat farkı',
      telsiz: [
        'Merkez, defterimin 2. sayfası: saat farkını yazmışım.',
        'Güneş tam tepedeyken yerel saatimi 12.00 yaptım; o anda Merkez\'deki saat 11.46 idi.',
        'Merkez 30° Doğu boylamında.',
      ],
      ipucuAyse: '1° boylam 4 dakikadır. Saati ileri olan yer doğudadır.',
      soru: 'Deniz kaç °D boylamında?',
      cevap: { tur: 'sayi', dogru: 33.5, tolerans: 0, birim: '°D' },
      aciklama: 'Fark 14 dakika; 14 ÷ 4 = 3,5° boylam. Deniz\'in saati ileri olduğundan doğudadır: 30° + 3,5° = 33,5° Doğu.',
    },
  },
  {
    defterSayfa: 'iklim-elemanlari',
    merkez: 'Aşama 3/6 — Yükselti: Deniz\'in termometresi yeri biraz daha daraltacak.',
    bulgu: 'Deniz kıyıdan yaklaşık 1200 m yüksekte: dağlık bir iç kesim.',
    vaka: {
      id: 'buyuk-arama-3',
      konu: 'iklim-elemanlari',
      zorluk: 'orta',
      ortam: ORTAM,
      baslik: 'Sayfa 4: Termometre',
      telsiz: [
        'Merkez, defterimin 4. sayfasında sıcaklık ölçümlerim var.',
        'Kıyıdaki ilk gözlem noktasında, deniz seviyesinde termometre 22 derece göstermişti.',
        'Şimdi burada 16 derece gösteriyor.',
      ],
      ipucuNuri: 'Yükseldikçe sıcaklık her 200 metrede 1°C azalır.',
      soru: 'Deniz, kıyıya göre kaç metre yüksekte?',
      cevap: { tur: 'sayi', dogru: 1200, tolerans: 0, birim: 'm' },
      aciklama: '22 − 16 = 6°C düşüş. Her 1°C için 200 m: 6 × 200 = 1200 m.',
    },
  },
  {
    defterSayfa: 'iklim-bitki',
    merkez: 'Aşama 4/6 — Bitkiler: çevresindeki ormanı anlatıyor.',
    bulgu: 'Arama alanı Karadeniz iklim kuşağında.',
    vaka: {
      id: 'buyuk-arama-4',
      konu: 'iklim-bitki',
      zorluk: 'orta',
      ortam: ORTAM,
      baslik: 'Sayfa 5: Orman',
      telsiz: [
        'Merkez, defterimin 5. sayfası: çevremi anlatayım.',
        'Her mevsim yağış var, sis hiç eksik olmuyor; yazlar bile serin ve nemli.',
        'Kayın ve göknar ormanları çok sık; ağaçların altı yosunla kaplı.',
      ],
      ipucuNuri: 'Yıl boyu yağışlı, sık ve geniş yapraklı ormanın bulunduğu iklim hangisi?',
      soru: 'Deniz hangi iklim bölgesinde? Haritadan seç.',
      cevap: { tur: 'harita-bolge', dogruBolgeler: ['karadeniz'] },
      aciklama: 'Her mevsim yağışlı, ılık-nemli iklim ve kayın-göknar ormanları Karadeniz iklimine aittir.',
    },
  },
  {
    defterSayfa: 'dis-kuvvetler',
    merkez: 'Aşama 5/6 — Zemin: Deniz ayağının altındaki kayaları anlatıyor.',
    bulgu: 'Arama alanı kireçtaşı bir karst arazi: Batı Karadeniz\'deki Küre Dağları gibi.',
    vaka: {
      id: 'buyuk-arama-5',
      konu: 'dis-kuvvetler',
      zorluk: 'orta',
      ortam: ORTAM,
      baslik: 'Sayfa 7: Delik deşik zemin',
      telsiz: [
        'Merkez, defterimin 7. sayfası: yerin altı çok ilginç.',
        'Zemin delik deşik; derin çukurlar ve mağaralar var, ama yüzeyde akarsu yok.',
        'Kayalar beyaz kireçtaşı; sular aşağıdaki kaynaklardan çıkıyor.',
      ],
      ipucuNuri: 'Kireçtaşı yağmur suyunda yavaşça çözünür.',
      soru: 'Bu yer şekillerini hangi süreç oluşturmuştur?',
      cevap: { tur: 'secenek', secenekler: ['Kimyasal çözünme (karstlaşma)', 'Buzul aşındırması', 'Rüzgâr aşındırması', 'Volkanizma'], dogru: 0 },
      aciklama: 'Kireçtaşında suyun kimyasal çözmesiyle dolin, düden ve mağara oluşur; buna karstlaşma denir.',
    },
  },
  {
    defterSayfa: 'harita',
    merkez: 'Aşama 6/6 — Son sayfa: tüm bulguları birleştirip Deniz\'in yerini işaretle.',
    bulgu: 'Deniz bulundu!',
    vaka: {
      id: 'buyuk-arama-6',
      konu: 'harita',
      zorluk: 'zor',
      ortam: ORTAM,
      baslik: 'Son sayfa: Beni bul',
      telsiz: [
        'Merkez, defterimin son sayfasını yarım bıraktım; pilim bitmek üzere.',
        'Bildiklerini birleştir: 41 derece Kuzey, 33,5 derece Doğu, Karadeniz iklim kuşağı, 1200 metre yükseklik, kireçtaşı bir dağ.',
        'Beni bul.',
      ],
      ipucuAyse: 'Önce paralel ile meridyenin kesiştiği noktayı bul; sonra Karadeniz kıyısına yakın dağlık kuşakta kal.',
      soru: 'Deniz\'in bulunduğu yeri haritada işaretle.',
      cevap: { tur: 'harita-nokta', hedef: [41.2, 33.5], yaricapKm: 100 },
      aciklama: '41°K paraleli ile 33,5°D meridyeninin kesiştiği yer, Karadeniz kuşağında, Batı Karadeniz\'deki Küre Dağları yöresidir.',
    },
  },
]

export const ARAMA_VAKALARI: Vaka[] = ARAMA_ASAMALARI.map((a) => a.vaka)
