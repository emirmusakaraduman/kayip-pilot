import { describe, expect, it } from 'vitest'
import { VAKALAR } from './cases'
import { KONULAR } from './topics'
import { degerlendir } from '../game/engine'
import { BOLGELER, bolgeOf, icerde } from '../map/turkey'
import type { Vaka, Verilen, Zorluk } from '../game/types'

const ZORLUKLAR: Zorluk[] = ['kolay', 'orta', 'zor']

/** Vakanın doğru cevabını Verilen biçiminde üretir. */
function dogruVerilen(v: Vaka): Verilen {
  const c = v.cevap
  switch (c.tur) {
    case 'secenek':
    case 'karar':
    case 'grafik':
      return { tur: c.tur, indeks: c.dogru }
    case 'sayi':
      return { tur: 'sayi', deger: c.dogru }
    case 'harita-bolge':
      return { tur: 'harita-bolge', bolgeler: c.dogruBolgeler }
    case 'harita-nokta':
      return { tur: 'harita-nokta', nokta: c.hedef }
    case 'rota':
      return { tur: 'rota', sira: c.dogruSira }
  }
}

describe('vaka veri bütünlüğü', () => {
  it('15 konu × 3 zorluk = 45 vaka, hepsi tek ve eksiksiz', () => {
    expect(VAKALAR).toHaveLength(45)
    expect(new Set(VAKALAR.map((v) => v.id)).size).toBe(45)
    for (const k of KONULAR)
      for (const z of ZORLUKLAR) {
        const bul = VAKALAR.filter((v) => v.konu === k.id && v.zorluk === z)
        expect(bul, `${k.id}/${z}`).toHaveLength(1)
        expect(bul[0].id).toBe(`${k.id}-${z}`)
      }
  })

  it('her vakada metin alanları dolu ve en az bir ipucu var', () => {
    for (const v of VAKALAR) {
      expect(v.baslik.length, v.id).toBeGreaterThan(0)
      expect(v.telsiz.length, v.id).toBeGreaterThan(0)
      expect(v.soru.endsWith('?') || v.soru.endsWith('.'), v.id).toBe(true)
      expect(v.aciklama.length, v.id).toBeGreaterThan(20)
      expect(Boolean(v.ipucuNuri || v.ipucuAyse), v.id).toBe(true)
    }
  })

  it('seçenekli vakalarda doğru indeks geçerli ve seçenekler birbirinden farklı', () => {
    for (const v of VAKALAR) {
      const c = v.cevap
      if (c.tur === 'secenek' || c.tur === 'karar' || c.tur === 'grafik') {
        expect(c.secenekler.length, v.id).toBe(4)
        expect(c.dogru, v.id).toBeGreaterThanOrEqual(0)
        expect(c.dogru, v.id).toBeLessThan(c.secenekler.length)
        expect(new Set(c.secenekler).size, v.id).toBe(c.secenekler.length)
      }
    }
  })

  it('harita cevapları geçerli bölge ve Türkiye sınırları içindeki noktalar', () => {
    for (const v of VAKALAR) {
      const c = v.cevap
      if (c.tur === 'harita-bolge') for (const b of c.dogruBolgeler) expect(BOLGELER, v.id).toContain(b)
      if (c.tur === 'harita-nokta') {
        const [enlem, boylam] = c.hedef
        expect(icerde(boylam, enlem), `${v.id} hedefi haritanın içinde olmalı`).toBe(true)
      }
    }
  })

  it('harita-bolge vakalarında ortam alanı, işaretlenecek bölgeyle uyumlu', () => {
    for (const v of VAKALAR)
      if (v.cevap.tur === 'harita-bolge') expect([v.ortam], v.id).toEqual(v.cevap.dogruBolgeler)
  })

  it('harita-nokta hedefinin iklim bölgesi, vakanın ortamıyla uyumlu', () => {
    for (const v of VAKALAR)
      if (v.cevap.tur === 'harita-nokta') {
        const [enlem, boylam] = v.cevap.hedef
        expect(bolgeOf(boylam, enlem), v.id).toBe(v.ortam)
      }
  })

  it('cevap motoru: doğru cevap doğru, bariz yanlış cevap yanlış', () => {
    for (const v of VAKALAR) {
      expect(degerlendir(v.cevap, dogruVerilen(v)).dogru, v.id).toBe(true)
      const c = v.cevap
      if (c.tur === 'secenek' || c.tur === 'karar' || c.tur === 'grafik')
        expect(degerlendir(c, { tur: c.tur, indeks: (c.dogru + 1) % 4 }).dogru, v.id).toBe(false)
      if (c.tur === 'sayi') expect(degerlendir(c, { tur: 'sayi', deger: c.dogru + c.tolerans + 1 }).dogru, v.id).toBe(false)
      if (c.tur === 'harita-bolge') expect(degerlendir(c, { tur: 'harita-bolge', bolgeler: [] }).dogru, v.id).toBe(false)
      if (c.tur === 'harita-nokta') expect(degerlendir(c, { tur: 'harita-nokta', nokta: [c.hedef[0] + 5, c.hedef[1]] }).dogru, v.id).toBe(false)
      if (c.tur === 'rota') expect(degerlendir(c, { tur: 'rota', sira: [...c.dogruSira].reverse() }).dogru, v.id).toBe(false)
    }
  })
})

describe('coğrafya hesapları (ders kitabı kuralları)', () => {
  const sayi = (id: string) => {
    const c = VAKALAR.find((v) => v.id === id)!.cevap
    if (c.tur !== 'sayi') throw new Error(id)
    return c.dogru
  }
  it('200 m\'de 1°C: 1000 m çıkınca 20 → 15', () => expect(20 - 1000 / 200).toBe(sayi('iklim-elemanlari-kolay')))
  it('1° boylam = 4 dk: 20 dk → 5°, 35−5 = 30', () => expect(35 - 20 / 4).toBe(sayi('cografi-konum-kolay')))
  it('2 enlem farkı ≈ 222 km', () => expect(2 * 111).toBe(sayi('cografi-konum-orta')))
  it('ölçek 1/100.000: 4 cm = 4 km', () => expect((4 * 100000) / 100000).toBe(sayi('harita-kolay')))
  it('eğim: 600 m / 2000 m = %30', () => expect(((1000 - 400) / ((4 * 50000) / 100)) * 100).toBe(sayi('harita-orta')))
  it('21 Haziran, geliş açısı 72,5° → 41°K', () => expect(23.5 + (90 - 72.5)).toBe(sayi('dunya-sekli-zor')))
  it('nüfus yoğunluğu 30.000/600 = 50', () => expect(30000 / 600).toBe(sayi('nufus-yerlesme-kolay')))
  it('nüfus artış hızı 28 − 8 − 5 = 15', () => expect(28 - 8 - 5).toBe(sayi('nufus-yerlesme-zor')))
  it('net göç hızı (8000−12000)/400000×1000 = −10', () => expect(((8000 - 12000) / 400000) * 1000).toBe(sayi('goc-zor')))
})
