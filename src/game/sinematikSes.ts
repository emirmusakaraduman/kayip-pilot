import { baglam, cikis } from './audio'
import { useOyun } from './store'
import { OLAY } from '../cinematic/timeline'

// Açılış sinematiğinin tüm sesleri Web Audio ile kodla üretilir; dosya yok.

const yum = (x: number) => {
  const u = Math.min(1, Math.max(0, x))
  return u * u * (3 - 2 * u)
}

function gurultuTamponu(c: AudioContext, sn: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * sn), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

export interface SinematikSes {
  guncelle(t: number): void
  durdur(): void
}

export function sinematikSesBaslat(): SinematikSes | null {
  const c = baglam()
  if (!c || c.state !== 'running') return null

  const master = c.createGain()
  master.connect(cikis() ?? c.destination)
  const gurultu = gurultuTamponu(c, 2)
  const dongu = (tip: BiquadFilterType, f: number) => {
    const s = c.createBufferSource()
    s.buffer = gurultu
    s.loop = true
    const filt = c.createBiquadFilter()
    filt.type = tip
    filt.frequency.value = f
    const g = c.createGain()
    g.gain.value = 0
    s.connect(filt).connect(g).connect(master)
    s.start()
    return { g, filt, s }
  }

  // Motor: testere dişi osilatör + düşük geçiren süzgeç
  const motorOsc = c.createOscillator()
  motorOsc.type = 'sawtooth'
  const motorFiltre = c.createBiquadFilter()
  motorFiltre.type = 'lowpass'
  motorFiltre.frequency.value = 420
  const motorG = c.createGain()
  motorG.gain.value = 0
  motorOsc.connect(motorFiltre).connect(motorG).connect(master)
  motorOsc.start()

  // Rotor vuruşu: gürültü, düşük frekans salınımıyla (LFO) kesik kesik
  const rotor = dongu('lowpass', 240)
  const lfo = c.createOscillator()
  lfo.type = 'square'
  const lfoG = c.createGain()
  lfoG.gain.value = 0.5
  lfo.connect(lfoG).connect(rotor.g.gain)
  lfo.start()

  // Kuyruk rotoru savrulması: kontrol kaybında hızlı, düzensiz vuruşlar
  const kuyruk = dongu('bandpass', 700)
  const kuyrukLfo = c.createOscillator()
  kuyrukLfo.type = 'square'
  kuyrukLfo.frequency.value = 26
  const kuyrukLfoG = c.createGain()
  kuyrukLfoG.gain.value = 0.5
  kuyrukLfo.connect(kuyrukLfoG).connect(kuyruk.g.gain)
  kuyrukLfo.start()

  const ruzgar = dongu('bandpass', 520)
  const yangin = dongu('highpass', 2500)

  // Alarm
  const alarm = c.createOscillator()
  alarm.type = 'square'
  const alarmG = c.createGain()
  alarmG.gain.value = 0
  alarm.connect(alarmG).connect(master)
  alarm.start()

  const patlat = (sure: number, tip: BiquadFilterType, f0: number, f1: number, ses: number) => {
    const s = c.createBufferSource()
    s.buffer = gurultu
    const f = c.createBiquadFilter()
    f.type = tip
    f.frequency.setValueAtTime(f0, c.currentTime)
    f.frequency.exponentialRampToValueAtTime(f1, c.currentTime + sure)
    const g = c.createGain()
    g.gain.setValueAtTime(ses, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + sure)
    s.connect(f).connect(g).connect(master)
    s.start()
    s.stop(c.currentTime + sure)
  }
  const gurleme = (f0: number, f1: number, sure: number, ses: number) => {
    const o = c.createOscillator()
    o.frequency.setValueAtTime(f0, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + sure)
    const g = c.createGain()
    g.gain.setValueAtTime(ses, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + sure)
    o.connect(g).connect(master)
    o.start()
    o.stop(c.currentTime + sure)
  }

  // Yankı: ormandaki çarpma sesinin kuyruğu için sentetik oda yanıtı (üstel sönen stereo gürültü)
  const yanit = c.createBuffer(2, Math.floor(c.sampleRate * 2.6), c.sampleRate)
  for (let k = 0; k < 2; k++) {
    const d = yanit.getChannelData(k)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2)
  }
  const yanki = c.createConvolver()
  yanki.buffer = yanit
  const yankiG = c.createGain()
  yankiG.gain.value = 0.38
  yanki.connect(yankiG).connect(master)
  const gonder = (n: AudioNode, islak: number) => {
    n.connect(master)
    const e = c.createGain()
    e.gain.value = islak
    n.connect(e).connect(yanki)
  }
  // Darbe: alçak "göğüs" vuruşu (sinüs süpürmesi) + kısa, sert tıkırtı
  const darbe = (ses: number, sure = 0.8, f0 = 120, f1 = 26) => {
    const t = c.currentTime
    const o = c.createOscillator()
    o.frequency.setValueAtTime(f0, t)
    o.frequency.exponentialRampToValueAtTime(f1, t + sure)
    const g = c.createGain()
    g.gain.setValueAtTime(ses, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure)
    o.connect(g)
    gonder(g, 0.5)
    o.start(t)
    o.stop(t + sure + 0.05)
    const s2 = c.createBufferSource()
    s2.buffer = gurultu
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 1800
    const g2 = c.createGain()
    g2.gain.setValueAtTime(ses * 0.9, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    s2.connect(f).connect(g2)
    gonder(g2, 0.3)
    s2.start(t)
    s2.stop(t + 0.1)
  }
  // Metal çınlaması: uyumsuz (inharmonik) kısmî sesler, kısmî başına farklı sönüm
  const metal = (taban: number, ses: number, sure = 1.4) => {
    const t = c.currentTime
    for (const [i, oran] of [1, 2.76, 5.4, 8.93].entries()) {
      const o = c.createOscillator()
      o.type = i === 0 ? 'triangle' : 'sine'
      o.frequency.value = taban * oran * (1 + (Math.random() - 0.5) * 0.01)
      const g = c.createGain()
      const d = sure / (1 + i * 0.7)
      g.gain.setValueAtTime(ses / (1 + i * 0.8), t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d)
      o.connect(g)
      gonder(g, 0.45)
      o.start(t)
      o.stop(t + d + 0.05)
    }
  }
  // Kırılan dal ve saçılan enkaz: rastgele zamanlı, çok kısa bant geçiren patlamalar
  const kirik = (adet: number, sure: number, ses: number, f0 = 1400, f1 = 5200) => {
    const t = c.currentTime
    for (let i = 0; i < adet; i++) {
      const at = t + Math.pow(Math.random(), 1.4) * sure
      const s2 = c.createBufferSource()
      s2.buffer = gurultu
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = f0 + Math.random() * (f1 - f0)
      f.Q.value = 2 + Math.random() * 4
      const g = c.createGain()
      const d = 0.02 + Math.random() * 0.05
      g.gain.setValueAtTime(ses * (0.4 + Math.random() * 0.6), at)
      g.gain.exponentialRampToValueAtTime(0.0001, at + d)
      s2.connect(f).connect(g)
      gonder(g, 0.35)
      s2.start(at, Math.random() * 1.5)
      s2.stop(at + d + 0.02)
    }
  }
  // Metal sürtünmesi: alçalan, hafif titreyen çığlık
  const surtunme = (sure: number, ses: number) => {
    const t = c.currentTime
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(980, t)
    o.frequency.exponentialRampToValueAtTime(140, t + sure)
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(2400, t)
    f.frequency.exponentialRampToValueAtTime(500, t + sure)
    f.Q.value = 3
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(ses, t + 0.15)
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure)
    const v = c.createOscillator()
    v.frequency.value = 38
    const vg = c.createGain()
    vg.gain.value = ses * 0.5
    v.connect(vg).connect(g.gain)
    o.connect(f).connect(g)
    gonder(g, 0.3)
    o.start(t); v.start(t)
    o.stop(t + sure + 0.05); v.stop(t + sure + 0.05)
  }
  // Şok sonrası kulak çınlaması
  const cinlama = (sure: number) => {
    const t = c.currentTime
    const o = c.createOscillator()
    o.frequency.value = 3900
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t + 0.1)
    g.gain.exponentialRampToValueAtTime(0.02, t + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + sure + 0.05)
  }

  let onceki = -1
  const olaylar: [number, () => void][] = [
    // ağaç çarpması: dal çıtırtıları, rotorun gövdeye vurup kırılması
    [OLAY.agacCarpma - 0.25, () => kirik(5, 0.3, 0.12)],
    [OLAY.agacCarpma, () => { darbe(0.45, 0.5, 150, 40); patlat(0.7, 'bandpass', 1600, 220, 0.45); metal(430, 0.1, 0.9); kirik(14, 1.1, 0.2) }],
    // sert iniş: ana darbe, gövde metali, savrulan enkaz, şok sonrası çınlama
    [OLAY.yereInis, () => { darbe(0.8, 1.0, 110, 24); patlat(1.2, 'lowpass', 900, 70, 0.75); metal(190, 0.16, 1.8); metal(310, 0.08, 1.2); kirik(22, 1.8, 0.22, 900, 4200); cinlama(5) }],
    [OLAY.yereInis + 0.3, () => { patlat(2.6, 'bandpass', 2600, 380, 0.3); surtunme(2.2, 0.05) }], // yerde sürtünen metal
    [OLAY.yereInis + 1.6, () => kirik(6, 2, 0.1, 800, 2800)], // yerleşen enkaz
    [OLAY.durma, () => { gurleme(70, 40, 0.8, 0.25); metal(150, 0.05, 1.6) }], // son sarsıntı; patlama yok
    [OLAY.durma + 1.4, () => kirik(3, 2.5, 0.06, 600, 2200)], // metal soğurken tıkırtı
  ]

  return {
    guncelle(t) {
      const now = c.currentTime
      const sok = t < OLAY.yereInis ? 1 : 0.55 + 0.45 * yum((t - OLAY.yereInis - 0.3) / 3.5) // iniş şoku: ses boğulur, sonra açılır
      master.gain.setTargetAtTime(useOyun.getState().sesAcik ? 0.9 * sok : 0, now, 0.05)

      const kayip = yum((t - OLAY.kuyrukKaybi) / 10)
      motorOsc.frequency.setTargetAtTime(86 - 42 * kayip + (t > OLAY.kuyrukKaybi ? 5 * Math.sin(t * 23) + (Math.random() - 0.5) * 22 * kayip : 0), now, 0.03)
      motorG.gain.setTargetAtTime(t < OLAY.yereInis + 0.5 ? (t < OLAY.kuyrukKaybi ? 0.1 : 0.12 * (1 - 0.7 * kayip)) : 0, now, 0.1)

      lfo.frequency.setTargetAtTime(13 - 4 * yum((t - OLAY.kuyrukKaybi) / 6.5), now, 0.1)
      rotor.g.gain.setTargetAtTime(t < OLAY.agacCarpma ? 0.35 : 0, now, 0.03)

      const savrul = t > OLAY.kuyrukKaybi && t < OLAY.agacCarpma ? 0.12 * yum((t - OLAY.kuyrukKaybi) / 2) : 0
      kuyruk.g.gain.setTargetAtTime(savrul, now, 0.05)
      kuyrukLfo.frequency.setTargetAtTime(22 + 8 * Math.sin(t * 3) + 6 * yum((t - OLAY.kuyrukKaybi) / 8), now, 0.05)

      ruzgar.g.gain.setTargetAtTime(t < OLAY.yereInis ? 0.03 + 0.1 * yum(t / 17) : 0.03, now, 0.2)

      const alarmAcik = t > OLAY.yanginBasla + 0.5 && t < OLAY.yereInis + 0.5
      const vurus = Math.floor(t * 2.5)
      alarm.frequency.setValueAtTime(vurus % 2 === 0 ? 880 : 660, now)
      alarmG.gain.setTargetAtTime(alarmAcik && vurus % 2 === 0 ? 0.025 : 0, now, 0.01)

      const ates = t > OLAY.yanginBasla ? (t > OLAY.durma ? 0.05 : 0.03) : 0
      yangin.g.gain.setTargetAtTime(Math.random() < 0.35 ? ates * (0.5 + Math.random()) : 0, now, 0.02)

      for (const [te, fn] of olaylar) if (onceki < te && t >= te) fn()
      onceki = t
    },
    durdur() {
      const now = c.currentTime
      master.gain.setTargetAtTime(0, now, 0.05)
      setTimeout(() => {
        motorOsc.stop()
        lfo.stop()
        kuyrukLfo.stop()
        kuyruk.s.stop()
        alarm.stop()
        rotor.s.stop()
        ruzgar.s.stop()
        yangin.s.stop()
        master.disconnect()
      }, 300)
    },
  }
}
