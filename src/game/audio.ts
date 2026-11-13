import { useOyun } from './store'

// Web Audio: tarayıcı sesi ancak kullanıcı tıklamasından sonra açar, bu yüzden sesBaslat() "Başla" düğmesinde çağrılır.
let ctx: AudioContext | null = null

export function sesBaslat() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
}

const acik = () => ctx && ctx.state === 'running' && useOyun.getState().sesAcik

export function bip(frekans = 880, sure = 0.05, ses = 0.03) {
  if (!acik() || !ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = frekans
  g.gain.setValueAtTime(ses, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + sure)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + sure)
}

/** Telsiz paraziti: bant geçiren süzgeçten geçen beyaz gürültü. */
export function cizirti(sure = 0.25, siddet = 0.06) {
  if (!acik() || !ctx) return
  const n = Math.floor(ctx.sampleRate * sure)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1800
  const g = ctx.createGain()
  g.gain.setValueAtTime(siddet, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + sure)
  src.connect(f).connect(g).connect(ctx.destination)
  src.start()
}

export const dogruSes = () => {
  bip(660, 0.1, 0.05)
  setTimeout(() => bip(990, 0.18, 0.05), 110)
}
export const yanlisSes = () => {
  bip(200, 0.3, 0.06)
  cizirti(0.3, 0.08)
}
