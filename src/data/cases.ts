import type { Vaka } from '../game/types'

// 45 vaka (15 konu × 3 zorluk) buraya eklenecek. Şimdilik şemayı doğrulayan örnek vaka.
export const VAKALAR: Vaka[] = [
  {
    id: 'iklim-elemanlari-kolay',
    konu: 'iklim-elemanlari',
    zorluk: 'kolay',
    ortam: 'karasal',
    baslik: 'Soğuyan tepe',
    telsiz: [
      'Merkez, burası Deniz. Kalkış noktasına göre 1000 metre yükseğe tırmandım.',
      'Başlangıçta termometre 20 derece gösteriyordu.',
    ],
    ipucuNuri: 'Sıcaklık yükseldikçe her 200 metrede 1°C azalır.',
    soru: 'Deniz\'in bulunduğu yerde sıcaklık kaç °C olmalıdır?',
    cevap: { tur: 'sayi', dogru: 15, tolerans: 0, birim: '°C' },
    aciklama: '1000 m / 200 m = 5 °C düşüş. 20 − 5 = 15 °C.',
  },
]
