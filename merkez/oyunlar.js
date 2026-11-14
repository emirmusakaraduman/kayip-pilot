// TYT DERS LİSTESİ: oyun merkezindeki kartlar buradan gelir.
//
// Her dersin bir `oyun` alanı vardır:
//   oyun: null          → ders "YAKINDA" olarak gri görünür, tıklanamaz.
//   oyun: { ... }       → ders renkli görünür. `yol` varsa tıklayınca oyun açılır, yoksa "Hazırlanıyor" yazar.
//
// Bir derse oyun eklemek için `oyun: null` yerine şunu yaz:
//   oyun: {
//     id: 'oyun-adi',                  // küçük harf, tire (adreste kullanılır)
//     ad: 'Oyunun Adı',
//     kisa: 'Kısa başlık',
//     aciklama: '1-2 cümle',
//     etiketler: ['3B', 'Macera'],
//     yapimci: 'Ad Soyad',
//     gorsel: 'gorseller/oyun-adi.jpg',  // kapak görseli (merkez/gorseller/ altına koy), yoksa null
//     yol: 'oyunlar-klasoru/',           // bu sitede duran oyun (oyunlar/<klasör>)  YA DA
//     // yol: 'oyun/?id=oyun-adi', cerceve: 'https://oyun.vercel.app/',   (başka adreste duran oyun, geri çubuklu çerçevede açılır)
//   }
// `renk` dersin vurgu rengidir.
window.DERSLER = [
  { id: 'turkce', ad: 'Türkçe', ikon: 'ti-book-2', renk: '#e0675a', oyun: null },
  {
    id: 'matematik', ad: 'Matematik', ikon: 'ti-math-function', renk: '#35b8c9',
    oyun: {
      id: 'kayip-formul',
      ad: 'Kayıp Formül',
      kisa: 'Matematik zaman yolculuğu',
      aciklama: 'Matematik silindi, zaman makinesi susuyor. Üç çağa yolculuk et, kayıp formülü geri getir.',
      etiketler: ['3B', 'Matematik', 'Zaman yolculuğu'],
      yapimci: 'Mehmet Ali',
      gorsel: 'gorseller/kayip-formul.jpg',
      yol: 'oyun/?id=kayip-formul', // oyun merkezinin çerçeve sayfası: üstte "Ana sayfaya dön" çubuğu
      cerceve: 'https://kayip-formul.vercel.app/', // oyunun kendi adresi
    },
  },
  { id: 'geometri', ad: 'Geometri', ikon: 'ti-triangle-square-circle', renk: '#8a78e0', oyun: null },
  { id: 'tarih', ad: 'Tarih', ikon: 'ti-hourglass-high', renk: '#c9a24a', oyun: null },
  {
    id: 'cografya', ad: 'Coğrafya', ikon: 'ti-world', renk: '#f0a64a',
    oyun: {
      id: 'kayip-pilot',
      ad: 'Kayıp Pilot',
      kisa: 'TYT Coğrafya macerası',
      aciklama: 'Düşen helikopterin pilotu Deniz telsizden yardım istiyor. Coğrafya sorularını çöz, ipuçlarını birleştir, onu bul.',
      etiketler: ['3B', 'Coğrafya', 'Macera'],
      yapimci: 'Emir Musa',
      gorsel: 'gorseller/kayip-pilot.jpg',
      yol: 'kayip-pilot/',
    },
  },
  { id: 'felsefe', ad: 'Felsefe', ikon: 'ti-bulb', renk: '#d77ab5', oyun: null },
  { id: 'din', ad: 'Din Kültürü', ikon: 'ti-moon-stars', renk: '#5aa7e0', oyun: null },
  { id: 'fizik', ad: 'Fizik', ikon: 'ti-atom', renk: '#e0a05a', oyun: null },
  { id: 'kimya', ad: 'Kimya', ikon: 'ti-flask', renk: '#9ad05a', oyun: null },
  {
    id: 'biyoloji', ad: 'Biyoloji', ikon: 'ti-dna-2', renk: '#5ecb7a',
    oyun: {
      id: 'kizil-tohum',
      ad: 'Kızıl Tohum',
      kisa: 'TYT Biyoloji macerası',
      aciklama: 'Kızıl bir gezegende kurulan seranın görevlerini biyoloji bilginle çöz.',
      etiketler: ['3B', 'Biyoloji', 'Görev'],
      yapimci: 'Umut',
      gorsel: 'gorseller/kizil-tohum.jpg',
      yol: 'oyun/?id=kizil-tohum', // çerçeve sayfası: üstte "Ana sayfaya dön" çubuğu
      cerceve: 'https://kizil-tohum.vercel.app/?t=1',
    },
  },
]

// Çerçeve sayfası (oyun/index.html) için düz oyun listesi
window.OYUNLAR = window.DERSLER.filter(function (d) { return d.oyun; }).map(function (d) {
  return Object.assign({ ders: d.ad }, d.oyun);
});
