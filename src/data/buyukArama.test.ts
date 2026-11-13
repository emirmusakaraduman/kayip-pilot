import { describe, expect, it } from 'vitest'
import { ARAMA_ASAMALARI, ARAMA_HIKAYE, ARAMA_VAKALARI } from './buyukArama'
import { VAKALAR } from './cases'
import { DEFTER } from './defter'
import { degerlendir } from '../game/engine'
import { bolgeOf, icerde } from '../map/turkey'

const asama = (n: number) => ARAMA_ASAMALARI[n - 1].vaka

describe('Büyük Arama: veri bütünlüğü', () => {
  it('6 aşama, benzersiz id, konu vakalarıyla çakışmayan kimlikler', () => {
    expect(ARAMA_ASAMALARI).toHaveLength(6)
    expect(new Set(ARAMA_VAKALARI.map((v) => v.id)).size).toBe(6)
    for (const v of ARAMA_VAKALARI) expect(VAKALAR.find((x) => x.id === v.id), v.id).toBeUndefined()
  })

  it('her aşamanın defter sayfası gerçek bir sayfa ve telsiz metni o sayfa numarasını anıyor', () => {
    const sayfaNo: Record<string, number> = { 'dunya-sekli': 1, 'cografi-konum': 2, 'iklim-elemanlari': 4, 'iklim-bitki': 5, 'dis-kuvvetler': 7 }
    for (const a of ARAMA_ASAMALARI) {
      expect(DEFTER.some((d) => d.konu === a.defterSayfa), a.vaka.id).toBe(true)
      if (sayfaNo[a.defterSayfa]) expect(a.vaka.telsiz.join(' '), a.vaka.id).toContain(`${sayfaNo[a.defterSayfa]}. sayfa`)
      expect(a.bulgu.length).toBeGreaterThan(10)
      expect(a.merkez).toContain(`${ARAMA_ASAMALARI.indexOf(a) + 1}/6`)
    }
  })

  it('hikâye metinleri dolu ve ödül tanımlı', () => {
    expect(ARAMA_HIKAYE.giris.length).toBeGreaterThanOrEqual(3)
    expect(ARAMA_HIKAYE.final.length).toBeGreaterThanOrEqual(3)
    expect(ARAMA_HIKAYE.odul).toBeGreaterThan(0)
  })
})

describe('Büyük Arama: bulgular birbiriyle ve haritayla tutarlı', () => {
  it('aşama cevapları metindeki sayılardan ders kitabı kurallarıyla çıkıyor', () => {
    // 1) Kutup Yıldızı yüksekliği = enlem
    expect(asama(1).telsiz.join(' ')).toContain('41 derece')
    expect(degerlendir(asama(1).cevap, { tur: 'sayi', deger: 41 }).dogru).toBe(true)
    // 2) 30°D merkez; Deniz'in saati 14 dk ileri → 14/4 = 3,5° doğuda
    expect(30 + (12 * 60 - (11 * 60 + 46)) / 4).toBe(33.5)
    expect(degerlendir(asama(2).cevap, { tur: 'sayi', deger: 33.5 }).dogru).toBe(true)
    // 3) 22°C kıyıda, 16°C burada; 200 m'de 1°C
    expect((22 - 16) * 200).toBe(1200)
    expect(degerlendir(asama(3).cevap, { tur: 'sayi', deger: 1200 }).dogru).toBe(true)
    // 4) Karadeniz iklimi
    expect(degerlendir(asama(4).cevap, { tur: 'harita-bolge', bolgeler: ['karadeniz'] }).dogru).toBe(true)
    // 5) karstlaşma
    expect(degerlendir(asama(5).cevap, { tur: 'secenek', indeks: 0 }).dogru).toBe(true)
  })

  it('1., 2. ve 4. aşamanın bulguları son aşamanın hedefini işaret ediyor', () => {
    const son = asama(6).cevap
    if (son.tur !== 'harita-nokta') throw new Error('son aşama harita-nokta olmalı')
    // 41°K, 33,5°D kesişimi hedef yarıçapı içinde
    expect(degerlendir(son, { tur: 'harita-nokta', nokta: [41, 33.5] }).dogru).toBe(true)
    // hedef haritanın içinde ve 4. aşamanın cevabı olan iklim bölgesinde
    expect(icerde(son.hedef[1], son.hedef[0])).toBe(true)
    expect(bolgeOf(son.hedef[1], son.hedef[0])).toBe('karadeniz')
    expect(bolgeOf(33.5, 41)).toBe('karadeniz')
    // yanlış yer (Ege kıyısı) kabul edilmez
    expect(degerlendir(son, { tur: 'harita-nokta', nokta: [38.4, 27.1] }).dogru).toBe(false)
  })

  it('aşama zorluğu giderek artıyor ve hepsi Karadeniz ortamında geçiyor', () => {
    const sira = { kolay: 0, orta: 1, zor: 2 } as const
    for (let i = 1; i < ARAMA_VAKALARI.length; i++)
      expect(sira[ARAMA_VAKALARI[i].zorluk]).toBeGreaterThanOrEqual(sira[ARAMA_VAKALARI[i - 1].zorluk])
    for (const v of ARAMA_VAKALARI) expect(v.ortam).toBe('karadeniz')
  })
})
