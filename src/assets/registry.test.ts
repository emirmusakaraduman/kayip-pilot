/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { ASSETS, atifSatiri, yuklenebilirMi, type AssetSlot } from './registry'

const slotlar = Object.values(ASSETS as Record<string, AssetSlot>)

describe('varlık kaydı', () => {
  it('URL verilmiş her varlıkta yazar, kaynak ve lisans dolu; dosya public/ altında var', () => {
    for (const s of slotlar.filter((x) => x.url)) {
      expect(s.yazar.length, s.id).toBeGreaterThan(0)
      expect(s.kaynak, s.id).toMatch(/^https:\/\//)
      expect(s.lisans.length, s.id).toBeGreaterThan(0)
      const dosya = `public${s.url}`
      expect(existsSync(dosya), `${dosya} bulunamadı`).toBe(true)
      expect(statSync(dosya).size, `${dosya} web için fazla büyük`).toBeLessThan(4 * 1024 * 1024)
    }
  })

  it('ticari olmayan (NC) lisanslı bir varlık onaysız yüklenmez', () => {
    const nc: AssetSlot = { id: 'x', etiket: 'x', placeholder: 'person', url: '/models/x.glb', yazar: 'a', kaynak: 'https://a', lisans: 'CC BY-NC 4.0' }
    expect(yuklenebilirMi(nc)).toBe(false)
    expect(yuklenebilirMi({ ...nc, ncOnayli: true })).toBe(true)
    expect(yuklenebilirMi({ ...nc, lisans: 'CC BY 4.0' })).toBe(true)
    for (const s of slotlar) if (s.url) expect(/(^|[\s-])nc([\s-]|$)/i.test(s.lisans), `${s.id} NC lisansı taşıyor`).toBe(false)
  })

  it('düzenlenmiş (sadeleştirilmiş) varlıklar atıfta belirtilir ve atıf satırı her kaynağı içerir', () => {
    const atif = atifSatiri()
    for (const s of slotlar.filter((x) => x.url)) {
      expect(atif, s.id).toContain(s.yazar)
      expect(atif, s.id).toContain(s.kaynak)
      if (s.degistirildi) expect(atif).toContain('sadeleştirildi')
    }
  })

  it('helikopterin rotor düğüm adları ve karakter yönleri tanımlı', () => {
    expect(ASSETS.helikopter.parcalar.anaRotor).toBe('Empty_84')
    expect(ASSETS.helikopter.parcalar.kuyrukRotor).toBe('Empty.003_41')
    expect(ASSETS.nuri.donusY).toBeCloseTo(-Math.PI / 2)
  })
})
