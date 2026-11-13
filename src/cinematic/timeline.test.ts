import { describe, expect, it } from 'vitest'
import { ALTYAZILAR, ENKAZ, OLAY, TOPLAM, altyaziMetni, heliDurum, kamera, rotorParca } from './timeline'

const adimlar = Array.from({ length: Math.round(TOPLAM / 0.05) + 1 }, (_, i) => i * 0.05)

describe('sinematik zaman çizelgesi', () => {
  it('helikopter hiçbir anda yerin altına inmez', () => {
    for (const t of adimlar) expect(heliDurum(t).poz[1], `t=${t}`).toBeGreaterThanOrEqual(0.6)
  })

  it('helikopter konumu sıçramaz (komşu karelerde 1 birimden az)', () => {
    for (let i = 1; i < adimlar.length; i++) {
      const a = heliDurum(adimlar[i - 1]).poz
      const b = heliDurum(adimlar[i]).poz
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), `t=${adimlar[i]}`).toBeLessThan(1)
    }
  })

  it('kamera kesintileri dışında kamera da sıçramaz', () => {
    const kesit = [6, OLAY.kuyrukKaybi, OLAY.agacCarpma, OLAY.yereInis, OLAY.patlama, 32]
    for (let i = 1; i < adimlar.length; i++) {
      if (kesit.some((k) => adimlar[i - 1] < k && adimlar[i] >= k - 1e-9)) continue
      const a = kamera(adimlar[i - 1]).poz
      const b = kamera(adimlar[i]).poz
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), `t=${adimlar[i]}`).toBeLessThan(3)
    }
  })

  it('olaylar sıralı: yangın < kuyruk < ağaç < iniş < patlama < bitiş', () => {
    const o = OLAY
    expect(o.yanginBasla < o.kuyrukKaybi && o.kuyrukKaybi < o.agacCarpma && o.agacCarpma < o.yereInis).toBe(true)
    expect(o.yereInis < o.yanYatma && o.yanYatma < o.patlama && o.patlama < TOPLAM).toBe(true)
  })

  it('helikopter enkaz bölgesine iner, yan yatar ve rotor önceden kopar', () => {
    const son = heliDurum(TOPLAM)
    expect(Math.hypot(son.poz[0] - ENKAZ[0], son.poz[2] - ENKAZ[2])).toBeLessThan(2)
    expect(son.roll).toBeCloseTo(-Math.PI / 2, 5)
    expect(heliDurum(OLAY.agacCarpma + 0.01).rotorHiz).toBe(0)
    expect(rotorParca(OLAY.agacCarpma - 0.1)).toBeNull()
    expect(rotorParca(OLAY.agacCarpma + 5)?.yerde).toBe(true)
  })

  it('altyazılar çakışmaz ve toplam süre içinde biter', () => {
    for (let i = 1; i < ALTYAZILAR.length; i++) expect(ALTYAZILAR[i].t0).toBeGreaterThanOrEqual(ALTYAZILAR[i - 1].t1 - 0.01)
    expect(ALTYAZILAR[ALTYAZILAR.length - 1].t1).toBeLessThanOrEqual(TOPLAM)
    const yarim = altyaziMetni(ALTYAZILAR[1].t0 + 0.5)!
    expect(yarim.metin.split(' ').length).toBeLessThan(ALTYAZILAR[1].metin.split(' ').length)
    expect(altyaziMetni(ALTYAZILAR[1].t1 - 0.2)!.metin).toBe(ALTYAZILAR[1].metin)
  })
})
