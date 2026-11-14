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
    id: 'oyun-3',
    ad: 'Oyun 3',
    kisa: 'Yakında',
    aciklama: 'Bu kutuya üçüncü oyun gelecek.',
    etiketler: [],
    yol: 'oyun-3/',
    gorsel: null,
    yakinda: true,
    renk: '#a5733a',
  },
]
