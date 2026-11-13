import { useOyun } from './store'

// Web Audio: tarayıcı sesi ancak kullanıcı tıklamasından sonra açar, bu yüzden sesBaslat() "Başla" düğmesinde çağrılır.
let ctx: AudioContext | null = null
let ana: GainNode | null = null // tüm efektlerin ve müziğin ortak çıkışı (sessize alma + sınırlayıcı)
let muzikYolu: GainNode | null = null
let konusmaDurdurF: (() => void) | null = null
/** Ses kapanınca konuşmayı kesmek için konusma.ts kaydeder. */
export function konusmaDurdurKaydet(f: () => void) {
  konusmaDurdurF = f
}
let hazirlaDinleyici: (() => void) | null = null

/** Sahne müziği/ortamı bağlam hazır olunca çağrılır (muzik.ts kaydeder). */
export function sesHazirOlunca(f: () => void) {
  hazirlaDinleyici = f
}

export function sesBaslat() {
  if (!ctx) {
    ctx = new AudioContext()
    const sinirlayici = ctx.createDynamicsCompressor()
    sinirlayici.threshold.value = -14
    sinirlayici.ratio.value = 6
    ana = ctx.createGain()
    muzikYolu = ctx.createGain()
    muzikYolu.connect(ana)
    ana.connect(sinirlayici).connect(ctx.destination)
    const uygula = () => {
      const s = useOyun.getState()
      const t = ctx!.currentTime
      ana!.gain.setTargetAtTime(s.sesAcik ? 1 : 0, t, 0.05)
      muzikYolu!.gain.setTargetAtTime(s.muzikAcik ? 1 : 0, t, 0.3)
      // Ses kapalıyken bağlamı tamamen askıya al: konuşma dahil hiçbir şey duyulmaz
      if (!s.sesAcik) {
        konusmaDurdurF?.()
        window.setTimeout(() => { if (!useOyun.getState().sesAcik) void ctx?.suspend() }, 150)
      } else if (ctx!.state === 'suspended') void ctx!.resume()
    }
    uygula()
    let oncekiPil = useOyun.getState().pil
    useOyun.subscribe((s) => {
      uygula()
      if (s.pil <= 20 && oncekiPil > 20) pilUyari()
      oncekiPil = s.pil
    })
  }
  if (!useOyun.getState().sesAcik) return // kapalıyken bağlam askıda kalsın
  if (ctx.state === 'suspended') void ctx.resume().then(() => hazirlaDinleyici?.())
  else hazirlaDinleyici?.()
}

// Tarayıcılar sesi ilk kullanıcı etkileşimine kadar kilitler: ilk tık/tuşta bağlamı kendimiz açarız.
if (typeof window !== 'undefined') {
  const ilk = () => {
    sesBaslat()
    window.removeEventListener('pointerdown', ilk, true)
    window.removeEventListener('keydown', ilk, true)
  }
  window.addEventListener('pointerdown', ilk, true)
  window.addEventListener('keydown', ilk, true)
  // Arayüz tıklaması: tüm düğmeler için tek yerden
  window.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement | null
      const d = el?.closest?.('button, [role="button"], a')
      if (d && !(d as HTMLButtonElement).disabled) tik()
    },
    true,
  )
}

/** Ortak çıkış (efektler). */
export const cikis = () => ana
/** Müzik ve ortam sesi yolu. */
export const muzikCikis = () => muzikYolu

/** Web Audio bağlamı (sinematik sesleri için). Kullanıcı tıklamadan önce null olabilir. */
export const baglam = () => ctx

const acik = () => ctx && ctx.state === 'running' && useOyun.getState().sesAcik

export function bip(frekans = 880, sure = 0.05, ses = 0.03) {
  if (!acik() || !ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = frekans
  g.gain.setValueAtTime(ses, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + sure)
  o.connect(g).connect(ana!)
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
  src.connect(f).connect(g).connect(ana!)
  src.start()
}

export const dogruSes = () => {
  bip(660, 0.1, 0.05)
  setTimeout(() => bip(990, 0.18, 0.05), 110)
  setTimeout(() => odul(), 320)
}

/** Düğme tıklaması: kısa, kuru bir "tık". */
export function tik() {
  if (!acik() || !ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(1500, t)
  o.frequency.exponentialRampToValueAtTime(600, t + 0.04)
  g.gain.setValueAtTime(0.045, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.connect(g).connect(ana!)
  o.start(t)
  o.stop(t + 0.06)
}

/** Jeton / ödül: iki parlak, kısa çınlama. */
export function odul() {
  if (!acik() || !ctx) return
  const t = ctx.currentTime
  for (const [i, f] of [1318, 1760, 2349].entries()) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t + i * 0.07)
    g.gain.exponentialRampToValueAtTime(0.04, t + i * 0.07 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.35)
    o.connect(g).connect(ana!)
    o.start(t + i * 0.07)
    o.stop(t + i * 0.07 + 0.4)
  }
}

/** Kâğıt sayfa çevirme: kısa, yüksek geçiren gürültü süpürmesi. */
export function sayfaSesi() {
  if (!acik() || !ctx) return
  const sure = 0.45
  const n = Math.floor(ctx.sampleRate * sure)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.setValueAtTime(1200, ctx.currentTime)
  f.frequency.exponentialRampToValueAtTime(4200, ctx.currentTime + sure)
  f.Q.value = 0.7
  const g = ctx.createGain()
  g.gain.value = 0.09
  src.connect(f).connect(g).connect(ana!)
  src.start()
}

/** Pil kritik: kısa çift uyarı. */
export function pilUyari() {
  bip(520, 0.12, 0.05)
  setTimeout(() => bip(520, 0.12, 0.05), 200)
}
export const yanlisSes = () => {
  bip(200, 0.3, 0.06)
  cizirti(0.3, 0.08)
}

/** Sinematikten telsiz odasına geçiş: kısık yağmur ve iç mekân uğultusu yavaşça gelir, sonra söner. */
export function odaGecisSesi(sure = 9) {
  if (!acik() || !ctx) return
  const c = ctx
  const n = c.sampleRate * 2
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 3200
  f.Q.value = 0.4
  const g = c.createGain()
  const t0 = c.currentTime
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.05, t0 + 3)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + sure)
  src.connect(f).connect(g).connect(ana!)
  src.start()
  src.stop(t0 + sure)
  setTimeout(() => cizirti(0.4, 0.03), 1800)
}

// Ses bağlamı modül başına bir kez oluşur; sıcak yenileme eski bağlamı canlı bırakıp çift ses üretir, bu yüzden tam yenileme.
import.meta.hot?.accept(() => location.reload())
