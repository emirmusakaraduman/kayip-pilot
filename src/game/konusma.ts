import { baglam, cikis, cizirti, konusmaDurdurKaydet } from './audio'
import { yol } from '../yol'
import { useOyun } from './store'

// Sinematik telsiz konuşmaları: public/ses/konusma/k{n}.mp3 (scripts/konusma-uret.py ile üretilen nöral Türkçe sesler).
// Sesler çalarken telsiz süzgecinden (dar bant, hafif bozulma, parazit) geçirilir. Dosya yoksa tarayıcı sesine düşer.

/** false: sinematikte hiçbir konuşma seslendirilmez (altyazı kalır). Dosyalar ve kod yerinde; true yapınca geri gelir. */
const SESLENDIR = false
const ADET = 7
/** Satır başına telsiz bozulma miktarı (0–1): çarpma ve zayıf sinyal anlarında daha parazitli. */
const BOZULMA = [0.2, 0.5, 0.6, 0.4, 0.8, 0.7, 0.2]

const tamponlar: (AudioBuffer | null)[] = Array(ADET).fill(null)
let yukleniyor = false
let calan: { src: AudioBufferSourceNode; son: () => void } | null = null

/** Ses dosyalarını indirip çözer. Ses bağlamı açıldıktan sonra (kullanıcı tıklamasıyla) çağrılır. */
export async function konusmaHazirla() {
  const c = baglam()
  if (!SESLENDIR || !c || yukleniyor) return
  yukleniyor = true
  await Promise.all(
    tamponlar.map(async (_, i) => {
      if (tamponlar[i]) return
      try {
        const r = await fetch(yol(`/ses/konusma/k${i}.mp3`))
        if (r.ok) tamponlar[i] = await c.decodeAudioData(await r.arrayBuffer())
      } catch { /* dosya yoksa tarayıcı sesine düşülür */ }
    }),
  )
  yukleniyor = false
}

function bozucu(c: AudioContext, miktar: number) {
  const ws = c.createWaveShaper()
  const n = 256
  const e = new Float32Array(n)
  const k = 2 + miktar * 30
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    e[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  ws.curve = e
  return ws
}

function telsizdenCal(i: number, hiz: number, slot: number) {
  const c = baglam()
  const out = cikis()
  const buf = tamponlar[i]
  if (!c || !out || !buf) return false
  const boz = BOZULMA[i] ?? 0.3
  const rate = Math.min(1.25, Math.max(1, buf.duration / (slot * 0.97))) * hiz
  const sure = buf.duration / rate

  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = rate
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 380
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3300 - boz * 800
  const pk = c.createBiquadFilter()
  pk.type = 'peaking'
  pk.frequency.value = 1700
  pk.gain.value = 5
  pk.Q.value = 0.9
  const g = c.createGain()
  g.gain.value = 1.15
  src.connect(hp).connect(lp).connect(pk).connect(bozucu(c, boz)).connect(g).connect(out)

  // Konuşmanın altında sürekli parazit
  const n = Math.floor(c.sampleRate * (sure + 0.3))
  const nb = c.createBuffer(1, n, c.sampleRate)
  const d = nb.getChannelData(0)
  for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1
  const ns = c.createBufferSource()
  ns.buffer = nb
  const nf = c.createBiquadFilter()
  nf.type = 'bandpass'
  nf.frequency.value = 2000
  const ng = c.createGain()
  ng.gain.value = 0.012 + boz * 0.05
  ns.connect(nf).connect(ng).connect(out)

  cizirti(0.08, 0.05) // tuşa basış
  const t = c.currentTime + 0.06
  src.start(t)
  ns.start(t)
  src.onended = () => {
    if (calan?.src === src) {
      calan = null
      cizirti(0.12, 0.04) // tuş bırakma
    }
  }
  calan = {
    src,
    son: () => {
      try { src.stop(); ns.stop() } catch { /* zaten bitti */ }
    },
  }
  return true
}

function tarayiciSesi(kim: 'MERKEZ' | 'DENİZ', metin: string, hiz: number) {
  if (!('speechSynthesis' in window)) return
  const temiz = metin.replace(/\[cızırtı\]/g, ',').replace(/—|\.{3}/g, ',').replace(/\s+/g, ' ').trim()
  const u = new SpeechSynthesisUtterance(temiz)
  u.lang = 'tr-TR'
  u.rate = Math.min(2, (kim === 'DENİZ' ? 1.2 : 1.05) * hiz)
  u.pitch = kim === 'DENİZ' ? 1.15 : 0.8
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

/** i. altyazı satırını okur. slot: satırın ekranda kaldığı süre (sn); hiz: oynatma hızı (kısa sürümde >1). */
export function konus(i: number, kim: 'MERKEZ' | 'DENİZ', metin: string, slot: number, hiz = 1) {
  if (!useOyun.getState().sesAcik) return
  konusmaDurdur()
  if (!SESLENDIR) return // konuşmalar seslendirilmez; yalnızca altyazı gösterilir
  if (!tamponlar[i]) void konusmaHazirla() // bağlam sonradan açıldıysa dosyalar şimdi yüklensin
  if (!telsizdenCal(i, hiz, slot)) tarayiciSesi(kim, metin, hiz)
}

export function konusmaDurdur() {
  calan?.son()
  calan = null
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel()
}

konusmaDurdurKaydet(konusmaDurdur)

// Ses bağlamı modül başına bir kez oluşur; sıcak yenileme eski bağlamı canlı bırakıp çift ses üretir, bu yüzden tam yenileme.
import.meta.hot?.accept(() => location.reload())
