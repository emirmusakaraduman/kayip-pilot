import { describe, expect, it } from 'vitest'
import { ARALIK_GUN, dogruIsle, konuKarnesi, tekrarGelenler, yanlisIsle, type VakaIst } from './karne'

const GUN = 24 * 60 * 60 * 1000

describe('aralıklı tekrar', () => {
  it('doğru cevap kutuyu yükseltir ve tekrarı geciktirir', () => {
    let i: VakaIst | undefined
    for (let k = 1; k <= 3; k++) {
      i = dogruIsle(i, 0)
      expect(i.kutu).toBe(k)
      expect(i.sonraki).toBe(ARALIK_GUN[k] * GUN)
    }
  })
  it('kutu en üst seviyeyi aşmaz', () => {
    let i: VakaIst | undefined
    for (let k = 0; k < 10; k++) i = dogruIsle(i, 0)
    expect(i!.kutu).toBe(ARALIK_GUN.length - 1)
  })
  it('yanlış cevap kutuyu sıfırlar, vaka hemen tekrar gelir', () => {
    const i = yanlisIsle(dogruIsle(dogruIsle(undefined, 0), 0), 5000)
    expect(i.kutu).toBe(0)
    expect(i.yanlis).toBe(1)
    expect(tekrarGelenler({ a: i }, 5000)).toEqual(['a'])
  })
  it('tekrar listesi yalnız zamanı gelenleri, en eski önce verir', () => {
    const ist = {
      a: { dogru: 1, yanlis: 0, kutu: 1, sonraki: 300, son: 0 },
      b: { dogru: 1, yanlis: 0, kutu: 1, sonraki: 100, son: 0 },
      c: { dogru: 1, yanlis: 0, kutu: 2, sonraki: 9000, son: 0 },
    }
    expect(tekrarGelenler(ist, 500)).toEqual(['b', 'a'])
  })
})

describe('konu karnesi', () => {
  it('oranı ve çözülen sayısını hesaplar', () => {
    const vakalar = [
      { id: 'goc-kolay', konu: 'goc' as const },
      { id: 'goc-orta', konu: 'goc' as const },
      { id: 'ulasim-kolay', konu: 'ulasim' as const },
    ]
    const ist = { 'goc-kolay': { dogru: 3, yanlis: 1, kutu: 1, sonraki: 0, son: 0 } }
    const k = konuKarnesi(ist, ['goc-kolay'], vakalar, 10)
    expect(k.find((x) => x.konu === 'goc')).toMatchObject({ cozulen: 1, toplam: 2, oran: 0.75, tekrar: 1 })
    expect(k.find((x) => x.konu === 'ulasim')).toMatchObject({ cozulen: 0, oran: null, tekrar: 0 })
  })
})
