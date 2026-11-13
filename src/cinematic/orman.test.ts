import { describe, expect, it } from 'vitest'
import { ACIKLIK, AGAC_BOY, arazi, ormanUret, toprakAgirlik } from './orman'
import { ORTAMLAR } from './ortam'
import { ENKAZ, OLAY, SURUKLEME, heliDurum, rotorParca } from './timeline'

const ortamlar = Object.keys(ORTAMLAR) as (keyof typeof ORTAMLAR)[]

describe('arazi', () => {
  it('enkaz açıklığında düz (y=0) ve toprak, ormanda dalgalı', () => {
    for (let a = 0; a < 6.28; a += 0.5) {
      const x = ENKAZ[0] + Math.cos(a) * (ACIKLIK - 1), z = ENKAZ[2] + Math.sin(a) * (ACIKLIK - 1)
      expect(arazi(x, z)).toBe(0)
      expect(toprakAgirlik(x, z)).toBeGreaterThan(0.9)
    }
    const yuk = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => arazi(-120 + i * 31, 90 - i * 17))
    expect(Math.max(...yuk) - Math.min(...yuk)).toBeGreaterThan(2)
    expect(arazi(4000, 4000)).toBe(0)
  })

  it('sürekli: komşu noktalar arasında sıçrama yok', () => {
    for (let x = -200; x < 300; x += 3) expect(Math.abs(arazi(x + 3, 40) - arazi(x, 40))).toBeLessThan(6)
  })
})

describe.each(ortamlar)('orman (%s): helikopter hiçbir ağacın içinden geçmez', (ad) => {
  const { agaclar, kirilmalar } = ormanUret(ORTAMLAR[ad])

  it('açıklıkta ağaç yok', () => {
    for (const a of agaclar) expect(Math.hypot(a.x - ENKAZ[0], a.z - ENKAZ[2])).toBeGreaterThanOrEqual(ACIKLIK)
  })

  it('gövde yolunda (kırılma sonrası boyla) hiçbir ağaç tepesi gövdeye değmez', () => {
    const son = OLAY.yereInis + SURUKLEME + 0.5
    for (let t = OLAY.kuyrukKaybi; t <= son; t += 0.1) {
      const h = heliDurum(t)
      const alt = h.poz[1] - 0.9 - 4.5 * Math.abs(Math.sin(h.pitch)) - 1.2 * Math.abs(Math.sin(h.roll))
      for (const a of agaclar) {
        if (Math.hypot(a.x - h.poz[0], a.z - h.poz[2]) >= 5) continue
        // ağacın o andaki boyu: kırıksa kırılma anından sonra kırık boyda
        const olcek = a.kirikT !== undefined && t >= a.kirikT + 0.3 ? a.kirikOlcek! : a.olcek
        if (a.kirikT !== undefined && t >= a.kirikT - 0.06 && t < a.kirikT + 0.3) continue // kısalma anı (0,25 sn)
        expect(a.y + AGAC_BOY * olcek, `t=${t.toFixed(1)} ağaç (${a.x.toFixed(1)},${a.z.toFixed(1)})`).toBeLessThanOrEqual(alt + 1e-6)
      }
    }
  })

  it('kopan pervane ağaç tepesine gömülmez', () => {
    for (let t = OLAY.agacCarpma; t < OLAY.agacCarpma + 3; t += 0.1) {
      const p = rotorParca(t)!
      for (const a of agaclar) {
        if (Math.hypot(a.x - p.poz[0], a.z - p.poz[2]) >= 3.4) continue
        const olcek = a.kirikT !== undefined && t >= a.kirikT + 0.3 ? a.kirikOlcek! : a.olcek
        if (a.kirikT !== undefined && t >= a.kirikT - 0.06 && t < a.kirikT + 0.3) continue
        expect(a.y + AGAC_BOY * olcek).toBeLessThanOrEqual(p.poz[1] - 0.4 + 1e-6)
      }
    }
  })

  it('çarpma sahnesi var: bazı ağaçların tepesi çarpma anında kırılır', () => {
    expect(kirilmalar.length).toBeGreaterThan(5)
    for (const k of kirilmalar) expect(k.t).toBeGreaterThanOrEqual(OLAY.agacCarpma - 1.01)
  })
})
