import { baglam, muzikCikis, sesHazirOlunca } from './audio'

// Sahne müziği ve ortam sesi: dosya yok, Web Audio ile üretilir (sinematikSes.ts ile aynı yaklaşım).
// 'menu' = ana ekran (sakin pad + seyrek nota), 'oda' = telsiz odası (yağmur, uğultu, uzaktan gök gürültüsü, telsiz paraziti).

export type MuzikSahne = 'yok' | 'menu' | 'oda'

interface Katman {
  g: GainNode
  temizle(): void
}

let istenen: MuzikSahne = 'yok'
let aktif: Katman | null = null

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function gurultu(c: AudioContext, sn = 3) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * sn), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

/** Yavaş değişen akorlarla yumuşak pad. */
function padKur(c: AudioContext, hedef: AudioNode, akorlar: number[][], seviye: number, parlaklik: number) {
  const g = c.createGain()
  g.gain.value = seviye
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = parlaklik
  f.Q.value = 0.5
  g.connect(f).connect(hedef)
  // yavaş süzgeç nefesi
  const lfo = c.createOscillator()
  const lfoG = c.createGain()
  lfo.frequency.value = 0.07
  lfoG.gain.value = parlaklik * 0.3
  lfo.connect(lfoG).connect(f.frequency)
  lfo.start()

  let i = 0
  const notaCal = () => {
    const t = c.currentTime
    const sure = 9
    for (const m of akorlar[i % akorlar.length]) {
      for (const det of [-6, 6]) {
        const o = c.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = mtof(m)
        o.detune.value = det
        const v = c.createGain()
        v.gain.setValueAtTime(0.0001, t)
        v.gain.linearRampToValueAtTime(0.05, t + 3.5)
        v.gain.linearRampToValueAtTime(0.0001, t + sure + 3)
        o.connect(v).connect(g)
        o.start(t)
        o.stop(t + sure + 3.2)
      }
    }
    i++
  }
  notaCal()
  const iv = window.setInterval(notaCal, 9000)
  return () => {
    window.clearInterval(iv)
    lfo.stop()
  }
}

/** Gecikmeli, seyrek pentatonik notalar. */
function notaKur(c: AudioContext, hedef: AudioNode, notalar: number[], seviye: number) {
  const gecikme = c.createDelay(1)
  gecikme.delayTime.value = 0.42
  const geri = c.createGain()
  geri.gain.value = 0.45
  gecikme.connect(geri).connect(gecikme)
  const cikis = c.createGain()
  cikis.gain.value = seviye
  cikis.connect(hedef)
  cikis.connect(gecikme)
  gecikme.connect(hedef)
  let tm = 0
  const cal = () => {
    const t = c.currentTime
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = mtof(notalar[Math.floor(Math.random() * notalar.length)])
    const v = c.createGain()
    v.gain.setValueAtTime(0.0001, t)
    v.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    v.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    o.connect(v).connect(cikis)
    o.start(t)
    o.stop(t + 2.3)
    tm = window.setTimeout(cal, rnd(3500, 8000))
  }
  tm = window.setTimeout(cal, 2500)
  return () => window.clearTimeout(tm)
}

function menuKur(c: AudioContext, cikisNode: AudioNode): Katman {
  const g = c.createGain()
  g.gain.value = 0
  g.connect(cikisNode)
  // La minör: Am – F – C – G (alçak, geniş dizilim)
  const akorlar = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]]
  const p = padKur(c, g, akorlar, 0.5, 900)
  const n = notaKur(c, g, [69, 72, 74, 76, 79, 81], 0.12)
  return { g, temizle: () => { p(); n() } }
}

function odaKur(c: AudioContext, cikisNode: AudioNode): Katman {
  const g = c.createGain()
  g.gain.value = 0
  g.connect(cikisNode)
  const tampon = gurultu(c, 4)
  const dongu = (tip: BiquadFilterType, f: number, seviye: number, q = 0.7) => {
    const s = c.createBufferSource()
    s.buffer = tampon
    s.loop = true
    s.loopStart = Math.random() * 2
    const fl = c.createBiquadFilter()
    fl.type = tip
    fl.frequency.value = f
    fl.Q.value = q
    const v = c.createGain()
    v.gain.value = seviye
    s.connect(fl).connect(v).connect(g)
    s.start()
    return { s, v }
  }
  // Yağmur: pencere dışında iki bant; hafif salınım
  const yagmur1 = dongu('bandpass', 5200, 0.045, 0.5)
  const yagmur2 = dongu('highpass', 2200, 0.02)
  const damla = c.createOscillator()
  const damlaG = c.createGain()
  damla.frequency.value = 0.11
  damlaG.gain.value = 0.015
  damla.connect(damlaG).connect(yagmur1.v.gain)
  damla.start()
  // Oda uğultusu: düşük geçiren gürültü + 50 Hz elektrik uğultusu
  const ugultu = dongu('lowpass', 160, 0.12)
  const hum = c.createOscillator()
  hum.type = 'sine'
  hum.frequency.value = 50
  const humG = c.createGain()
  humG.gain.value = 0.012
  hum.connect(humG).connect(g)
  hum.start()
  // Alçak, karanlık pad ve çok seyrek notalar
  const p = padKur(c, g, [[38, 45, 50, 53], [36, 43, 48, 52], [34, 41, 46, 50], [36, 43, 48, 55]], 0.3, 520)
  const n = notaKur(c, g, [57, 60, 62, 64, 67], 0.05)

  const olay = (f: () => void, ara: [number, number]) => {
    let t = 0
    const planla = () => { t = window.setTimeout(() => { f(); planla() }, rnd(...ara)) }
    planla()
    return () => window.clearTimeout(t)
  }
  // Uzaktan gök gürültüsü
  const gok = olay(() => {
    const t = c.currentTime
    const s = c.createBufferSource()
    s.buffer = tampon
    const fl = c.createBiquadFilter()
    fl.type = 'lowpass'
    fl.frequency.setValueAtTime(420, t)
    fl.frequency.exponentialRampToValueAtTime(60, t + 4)
    const v = c.createGain()
    v.gain.setValueAtTime(0.0001, t)
    v.gain.exponentialRampToValueAtTime(0.35, t + 0.6)
    v.gain.exponentialRampToValueAtTime(0.0001, t + 4.5)
    s.connect(fl).connect(v).connect(g)
    s.start(t)
    s.stop(t + 4.6)
  }, [22000, 48000])
  // Telsizin arka plan paraziti: kısa, çok kısık
  const telsiz = olay(() => {
    const t = c.currentTime
    const sure = rnd(0.15, 0.5)
    const s = c.createBufferSource()
    s.buffer = tampon
    const fl = c.createBiquadFilter()
    fl.type = 'bandpass'
    fl.frequency.value = rnd(1200, 2600)
    const v = c.createGain()
    v.gain.setValueAtTime(0.03, t)
    v.gain.exponentialRampToValueAtTime(0.0001, t + sure)
    s.connect(fl).connect(v).connect(g)
    s.start(t)
    s.stop(t + sure + 0.05)
  }, [6000, 16000])

  return {
    g,
    temizle: () => {
      p(); n(); gok(); telsiz()
      for (const k of [yagmur1, yagmur2, ugultu]) k.s.stop()
      damla.stop()
      hum.stop()
    },
  }
}

function uygula() {
  const c = baglam()
  const yol = muzikCikis()
  if (!c || !yol || c.state !== 'running') return
  if (aktif && (aktif as Katman & { ad?: string }).ad === istenen) return
  const eski = aktif
  aktif = null
  if (eski) {
    eski.g.gain.setTargetAtTime(0, c.currentTime, 0.7)
    window.setTimeout(() => eski.temizle(), 4000)
  }
  if (istenen === 'yok') return
  const yeni = (istenen === 'menu' ? menuKur : odaKur)(c, yol) as Katman & { ad?: string }
  yeni.ad = istenen
  yeni.g.gain.setTargetAtTime(1, c.currentTime, 1.2)
  aktif = yeni
}

sesHazirOlunca(uygula)

/** Hangi sahnenin müziği/ortamı çalsın. Bağlam henüz açılmadıysa ilk tıklamada başlar. */
export function muzikSahne(s: MuzikSahne) {
  istenen = s
  uygula()
}

// Ses bağlamı modül başına bir kez oluşur; sıcak yenileme eski bağlamı canlı bırakıp çift ses üretir, bu yüzden tam yenileme.
import.meta.hot?.accept(() => location.reload())
