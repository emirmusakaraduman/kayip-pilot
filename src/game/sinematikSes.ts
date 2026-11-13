import { baglam } from './audio'
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
  master.connect(c.destination)
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

  let onceki = -1
  const olaylar: [number, () => void][] = [
    [OLAY.agacCarpma, () => { patlat(0.7, 'bandpass', 1400, 200, 0.5); gurleme(160, 60, 0.5, 0.3) }], // dal ve rotor kırılması
    [OLAY.yereInis, () => { gurleme(140, 32, 1.0, 0.7); patlat(1.0, 'lowpass', 900, 80, 0.7) }], // sert iniş
    [OLAY.patlama, () => { patlat(3.2, 'lowpass', 3000, 70, 1.0); gurleme(60, 28, 1.8, 0.9); patlat(0.4, 'highpass', 4000, 800, 0.4) }],
  ]

  return {
    guncelle(t) {
      const now = c.currentTime
      master.gain.setTargetAtTime(useOyun.getState().sesAcik ? 0.9 : 0, now, 0.05)

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

      const ates = t > OLAY.yanginBasla ? (t > OLAY.patlama ? 0.1 : 0.03) : 0
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
