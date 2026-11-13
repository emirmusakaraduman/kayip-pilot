import { describe, expect, it } from 'vitest'
import { LAT0, LAT1, LON0, LON1, haritaUret, icerde, yukseklikKm } from './turkey'
import { YUK_B64, YUK_BIRIM, YUK_H, YUK_W } from './yukseklikVeri'

const m = (lat: number, lon: number) => yukseklikKm(lon, lat) * 1000

describe('gerçek yükseklik verisi (AWS Terrain Tiles / SRTM dâhil)', () => {
  it('ızgara boyutu ve kodlaması tutarlı', () => {
    expect(atob(YUK_B64).length).toBe(YUK_W * YUK_H)
    expect(YUK_BIRIM).toBe(21)
  })

  it('bilinen düzlük ve göl yüksekliklerini (±%8) tutturuyor', () => {
    const bilinen: [string, number, number, number][] = [
      ['Tuz Gölü', 38.75, 33.4, 905],
      ['Konya', 37.87, 32.48, 1020],
      ['Ankara', 39.93, 32.86, 900],
      ['Van Gölü yüzeyi', 38.6, 42.9, 1646],
      ['Erzurum', 39.9, 41.27, 1850],
      ['Diyarbakır', 37.91, 40.24, 660],
    ]
    for (const [ad, lat, lon, gercek] of bilinen) expect(Math.abs(m(lat, lon) - gercek) / gercek, ad).toBeLessThan(0.08)
  })

  it('deniz seviyesine yakın yerler alçak, deniz noktaları sıfır (yön hatası yok)', () => {
    expect(m(36.5, 30.7)).toBe(0) // Antalya Körfezi
    expect(m(42.3, 31.0)).toBe(0) // Karadeniz
    expect(m(36.8, 34.6)).toBeLessThan(100) // Mersin kıyısı
    expect(m(41.0, 29.0)).toBeLessThan(150) // İstanbul
    expect(m(41.67, 26.56)).toBeLessThan(150) // Edirne (en batı)
    expect(m(38.42, 27.14)).toBeLessThan(150) // İzmir
  })

  it('yüksek dağlar yüksek: Ağrı > Erciyes ≈ Kaçkar > Uludağ (5 km ortalamasıyla zirveler biraz düşük)', () => {
    expect(m(39.7, 44.3)).toBeGreaterThan(3600)
    expect(m(38.53, 35.45)).toBeGreaterThan(2800)
    expect(m(40.84, 41.15)).toBeGreaterThan(2800)
    expect(m(40.07, 29.22)).toBeGreaterThan(1800)
    expect(m(39.7, 44.3)).toBeGreaterThan(m(38.53, 35.45))
  })

  it('Türkiye içindeki en yüksek ızgara noktası Ağrı çevresinde ve 5,4 km altında', () => {
    let en = { h: 0, lon: 0, lat: 0 }
    for (let y = 0; y < YUK_H; y++)
      for (let x = 0; x < YUK_W; x++) {
        const lon = LON0 + (x / (YUK_W - 1)) * (LON1 - LON0)
        const lat = LAT1 - (y / (YUK_H - 1)) * (LAT1 - LAT0)
        if (!icerde(lon, lat)) continue
        const h = yukseklikKm(lon, lat)
        if (h > en.h) en = { h, lon, lat }
      }
    expect(en.h).toBeGreaterThan(3.8)
    expect(en.h).toBeLessThan(5.4)
    expect(Math.hypot(en.lon - 44.3, en.lat - 39.7)).toBeLessThan(1.2)
  })

  it('harita üretimi gerçek veriyle çalışır: kara hücreleri var, yükseklikler negatif değil, deniz yaklaşık düz', () => {
    const v = haritaUret()
    let kara = 0, deniz = 0, maks = 0, denizToplam = 0
    for (let i = 0; i < v.yuk.length; i++) {
      expect(v.yuk[i]).toBeGreaterThanOrEqual(0)
      if (v.kara[i]) {
        kara++
        maks = Math.max(maks, v.yuk[i])
      } else {
        deniz++
        denizToplam += v.yuk[i]
        expect(v.yuk[i]).toBeLessThan(0.3) // dağlık kıyıda 2 piksellik yumuşatmadan gelen taşma
      }
    }
    expect(kara).toBeGreaterThan(20000)
    expect(deniz).toBeGreaterThan(20000)
    expect(denizToplam / deniz).toBeLessThan(0.005) // deniz ortalaması 5 m'nin altında
    expect(maks).toBeGreaterThan(3.0)
  })
})
