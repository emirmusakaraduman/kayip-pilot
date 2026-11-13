import { useEffect, useRef } from 'react'

const hareketAzalt = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Pencere camında yağmur: düşen çizgiler, camda süzülen damlalar (iz bırakır) ve ara sıra çift vuruşlu şimşek.
 * Şimşek en yakın `.ae-sahne` üzerinde `--ae-sims` (0..1) değişkenini de ayarlar; tüm sahne hafifçe aydınlanır.
 */
export function CamYagmuru({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const g = cv?.getContext('2d')
    if (!cv || !g) return
    const W = 990, H = 340
    cv.width = W
    cv.height = H
    const sahne = cv.closest('.ae-sahne') as HTMLElement | null
    const r = Math.random

    const damlalar = Array.from({ length: 190 }, () => ({ x: r() * (W + 120), y: r() * H, v: 560 + r() * 640, u: 14 + r() * 28, a: 0.16 + r() * 0.34, w: 0.7 + r() * 1.1 }))
    const boncuklar = Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * H, r: 2.2 + r() * 4.4, v: 0, iz: 0 }))
    let flash = 0, faz = 0, bolt: { ana: number[][]; dal: number[][] } | null = null
    let sonraki = 5 + r() * 6

    const simsekYap = () => {
      const ana: number[][] = []
      let x = 160 + r() * (W - 320), y = 0
      ana.push([x, y])
      while (y < H * 0.78) { y += 16 + r() * 26; x += (r() - 0.5) * 46; ana.push([x, y]) }
      const bi = Math.max(2, Math.floor(ana.length * 0.4))
      let bx = ana[bi][0], by = ana[bi][1]
      const dal = [[bx, by]]
      for (let k = 0; k < 4; k++) { by += 14 + r() * 18; bx += (r() < 0.5 ? -1 : 1) * (10 + r() * 20); dal.push([bx, by]) }
      bolt = { ana, dal }
      flash = 1
      faz = 1
    }
    const cizgi = (p: number[][], w: number) => {
      g.beginPath()
      g.moveTo(p[0][0], p[0][1])
      for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1])
      g.lineWidth = w
      g.stroke()
    }

    const ciz = (dt: number) => {
      g.clearRect(0, 0, W, H)
      // düşen yağmur çizgileri
      g.lineCap = 'round'
      for (const d of damlalar) {
        d.y += d.v * dt
        d.x -= d.v * 0.11 * dt
        if (d.y - d.u > H) { d.y = -10; d.x = r() * (W + 120) }
        if (d.x < -20) d.x += W + 120
        g.strokeStyle = `rgba(190,215,235,${d.a})`
        g.lineWidth = d.w
        g.beginPath()
        g.moveTo(d.x + d.u * 0.11, d.y - d.u)
        g.lineTo(d.x, d.y)
        g.stroke()
      }
      // camdaki damlalar: bazıları süzülür, arkasında ince iz bırakır
      for (const b of boncuklar) {
        if (b.v === 0 && r() < 0.0012 * (dt * 60)) b.v = 28 + r() * 60
        if (b.v > 0) {
          g.strokeStyle = 'rgba(170,200,215,0.16)'
          g.lineWidth = b.r * 0.7
          g.beginPath()
          g.moveTo(b.x, b.y - Math.min(60, b.iz))
          g.lineTo(b.x, b.y)
          g.stroke()
          b.y += b.v * dt
          b.iz += b.v * dt
          b.v *= Math.pow(0.55, dt)
          if (b.v < 6) { b.v = 0; b.iz = 0 }
          if (b.y > H + 10) { b.y = -10; b.x = r() * W; b.v = 0; b.iz = 0 }
        }
        const gr = g.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r)
        gr.addColorStop(0, 'rgba(235,245,252,0.7)')
        gr.addColorStop(0.55, 'rgba(120,150,165,0.22)')
        gr.addColorStop(1, 'rgba(8,16,22,0.35)')
        g.fillStyle = gr
        g.beginPath()
        g.ellipse(b.x, b.y, b.r * 0.85, b.r, 0, 0, Math.PI * 2)
        g.fill()
      }
      // şimşek: çift vuruş, kısa süren yıldırım çizgisi
      if (flash > 0) {
        flash -= dt * 3.2
        if (faz === 1 && flash < 0.35) { flash = 0.9; faz = 2 }
        if (flash < 0) flash = 0
      }
      if (bolt && flash > 0.12) {
        g.save()
        g.strokeStyle = `rgba(235,245,255,${Math.min(1, flash * 1.3)})`
        g.shadowColor = '#9cc4ff'
        g.shadowBlur = 16
        g.lineJoin = 'round'
        cizgi(bolt.ana, 3)
        cizgi(bolt.dal, 1.8)
        g.restore()
      }
      if (flash > 0) {
        g.fillStyle = `rgba(190,215,255,${Math.min(0.55, flash * 0.5)})`
        g.fillRect(0, 0, W, H)
      }
      sahne?.style.setProperty('--ae-sims', flash.toFixed(3))
    }

    if (hareketAzalt()) {
      ciz(0)
      return
    }
    let raf = 0, son = performance.now()
    const dongu = (t: number) => {
      raf = requestAnimationFrame(dongu)
      const dt = Math.min(0.05, (t - son) / 1000)
      son = t
      sonraki -= dt
      if (sonraki <= 0) { simsekYap(); sonraki = 9 + r() * 8 }
      ciz(dt)
    }
    raf = requestAnimationFrame(dongu)
    return () => { cancelAnimationFrame(raf); sahne?.style.removeProperty('--ae-sims') }
  }, [])
  return <canvas ref={ref} className={className} aria-hidden />
}

/** Kupanın üstünde yükselen, savrulan, yayılıp sönen buhar telleri (yumuşak parçacıklar). */
export function KupaBuhari({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const g = cv?.getContext('2d')
    if (!cv || !g) return
    const W = 220, H = 200
    cv.width = W
    cv.height = H
    const r = Math.random

    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 64
    const sg = sprite.getContext('2d')!
    const gr = sg.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(240,232,222,1)')
    gr.addColorStop(0.45, 'rgba(240,232,222,0.45)')
    gr.addColorStop(1, 'rgba(240,232,222,0)')
    sg.fillStyle = gr
    sg.fillRect(0, 0, 64, 64)

    type P = { x0: number; y: number; yas: number; omur: number; vy: number; faz: number; genlik: number; b0: number; b1: number; a: number }
    const yeni = (yas = 0): P => ({
      x0: W / 2 + (r() - 0.5) * 34, y: H - 8, yas, omur: 3.6 + r() * 1.6, vy: 30 + r() * 20,
      faz: r() * 6.28, genlik: 8 + r() * 14, b0: 9 + r() * 5, b1: 26 + r() * 12, a: 0.10 + r() * 0.08,
    })
    let ps: P[] = []
    let t = 0, birikim = 0
    const ilerle = (dt: number) => {
      t += dt
      birikim += dt * 22
      while (birikim >= 1) { ps.push(yeni()); birikim -= 1 }
      for (const p of ps) { p.yas += dt; p.y -= p.vy * dt * (0.8 + 0.4 * (p.yas / p.omur)) }
      ps = ps.filter((p) => p.yas < p.omur)
    }
    const ciz = () => {
      g.clearRect(0, 0, W, H)
      const esinti = Math.sin(t * 0.45) * 10 // yavaş yan savrulma
      for (const p of ps) {
        const n = p.yas / p.omur
        const x = p.x0 + Math.sin(p.yas * 1.25 + p.faz) * p.genlik * n + Math.sin(p.yas * 0.55 + p.faz * 2) * 5 * n + esinti * n * n
        const s = p.b0 + (p.b1 - p.b0) * n
        g.globalAlpha = p.a * Math.pow(Math.sin(Math.PI * Math.min(1, n)), 1.1) * (1 - 0.35 * n)
        g.drawImage(sprite, x - s, p.y - s, s * 2, s * 2)
      }
      g.globalAlpha = 1
    }

    // başlangıçta boş görünmesin: birkaç saniye önceden ilerlet
    for (let i = 0; i < 240; i++) ilerle(1 / 60)
    if (hareketAzalt()) { ciz(); return }
    let raf = 0, son = performance.now()
    const dongu = (now: number) => {
      raf = requestAnimationFrame(dongu)
      const dt = Math.min(0.05, (now - son) / 1000)
      son = now
      ilerle(dt)
      ciz()
    }
    raf = requestAnimationFrame(dongu)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className={className} aria-hidden />
}
