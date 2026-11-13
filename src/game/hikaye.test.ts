import { describe, expect, it } from 'vitest'
import { izSayilari, ilerlemeOrani, kilometreSatiri, KILOMETRE_TASLARI } from './hikaye'

describe('hikaye', () => {
  it('eşik aşılınca satır verir, aşılmadıysa vermez', () => {
    expect(kilometreSatiri(0, 1)).toBe(KILOMETRE_TASLARI[0].satir)
    expect(kilometreSatiri(1, 2)).toBeNull()
    expect(kilometreSatiri(4, 5)).toBe(KILOMETRE_TASLARI[1].satir)
  })
  it('aynı sayıda tekrar vaka (sayı artmaz) satır üretmez', () => {
    expect(kilometreSatiri(5, 5)).toBeNull()
  })
  it('ilerleme oranı 0..1 arasında kalır', () => {
    expect(ilerlemeOrani(0, 45)).toBe(0)
    expect(ilerlemeOrani(45, 45)).toBe(1)
    expect(ilerlemeOrani(90, 45)).toBe(1)
  })
  it('iz sayıları sahne anahtarlarına çevrilir', () => {
    expect(izSayilari(['sert-karasal', 'akdeniz', 'akdeniz'])).toEqual({ sert: 1, akdeniz: 2 })
  })
})
