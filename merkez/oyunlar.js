// OYUN LİSTESİ: oyun merkezindeki kartlar buradan gelir.
// Yeni oyun eklemek için bir kutu ekle, `yakinda: true` satırını sil.
//   yol:    oyunun sitedeki klasörü (oyunlar/<klasör> içine konur ve "klasör/" olarak açılır)
//   gorsel: kapak görseli (merkez/gorseller/ altına koy)
window.OYUNLAR = [
  {
    id: 'kayip-pilot',
    ad: 'Kayıp Pilot',
    kisa: 'TYT Coğrafya macerası',
    aciklama: 'Düşen helikopterin pilotu Deniz telsizden yardım istiyor. Coğrafya sorularını çöz, ipuçlarını birleştir, onu bul.',
    etiketler: ['3B', 'Coğrafya', 'Macera'],
    yol: 'kayip-pilot/',
    gorsel: 'gorseller/kayip-pilot.jpg',
    yapimci: 'Emir Musa',
  },
  {
    id: 'oyun-2',
    ad: 'Oyun 2',
    kisa: 'Yakında',
    aciklama: 'Bu kutuya ikinci oyun gelecek.',
    etiketler: [],
    yol: 'oyun-2/',
    gorsel: null,
    yakinda: true,
    renk: '#3a6ea5',
  },
  {
    id: 'kayip-formul',
    ad: 'Kayıp Formül',
    kisa: 'Matematik zaman yolculuğu',
    aciklama: 'Matematik silindi, zaman makinesi susuyor. Üç çağa yolculuk et, kayıp formülü geri getir.',
    etiketler: ['3B', 'Matematik', 'Zaman yolculuğu'],
    yol: 'https://kayip-formul.vercel.app/',
    gorsel: 'gorseller/kayip-formul.jpg',
    yapimci: 'Mehmet Ali',
  },
]
