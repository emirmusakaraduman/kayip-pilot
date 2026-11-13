import { useEffect, useRef, useState } from 'react'
import type { Bolge } from '../map/turkey'
import type { Kamera, Tiklama } from './kameralar'
import { KP_KONU, KP_ZORLUK, type KpIstek, type KpOlay } from '../game/kpKopru'

/** public/oda/ içindeki three r128 sahnesinin (window.ODA) köprüsü. */
interface OdaKopru {
  onHarita: ((bolge: string, u: number, v: number) => void) | null
  onDefter: (() => void) | null
  setCam: (n: string) => void
  snapCam: (n: string) => void
  setText: (t: string, bitti: boolean) => void
  setPil: (p: number, sessiz?: boolean) => void
  setJeton: (n: number) => void
  setDefter: (n: number) => void
  setSecili: (a: string[]) => void
  /** Soru sistemi köprüsü (?kp=bridge): iframe motoru olayları buraya bildirir. */
  onKp?: ((o: KpOlay) => void) | null
  kpBaslat?: (konu: string, zorluk: number, durum: { pil: number; jeton: number }, tekrar: boolean) => string | null
  kpDur?: () => void
}

const SAHNE_BOLGE: Record<string, Bolge> = { akdeniz: 'akdeniz', karadeniz: 'karadeniz', karasal: 'karasal', sert: 'sert-karasal' }
const OYUN_BOLGE: Record<Bolge, string> = { akdeniz: 'akdeniz', karadeniz: 'karadeniz', karasal: 'karasal', 'sert-karasal': 'sert' }

/** Levha üzerindeki (u, v; v=1 kuzey) konumdan yaklaşık enlem/boylam (kara kutusu ≈ 26–44,8°D, 36–42,1°K). */
function enlemBoylam(u: number, v: number): [number, number] {
  const boylam = 26 + ((u - 0.0539) / (0.9419 - 0.0539)) * 18.8
  const enlem = 36 + ((v - 0.1148) / (0.8934 - 0.1148)) * 6.1
  return [enlem, boylam]
}

export function TelsizOdasi({
  kamera, satir, bitti, pil, jeton, defter, vurgu, onHarita, onDefter, baslangicKamera, onHazir, kp,
}: {
  /** Soru sistemi: istek doluyken iframe o vakayı açar, null olunca kapatır; olaylar onOlay'a gelir. */
  kp?: { istek: KpIstek | null; onOlay: (o: KpOlay) => void }
  /** Sahne hazır olunca kamerayı yumuşatmasız bu önayara koyar (sinematikten geçiş). */
  baslangicKamera?: Kamera
  onHazir?: () => void
  defter: number
  kamera: Kamera
  satir: string
  bitti: boolean
  pil: number
  jeton: number
  vurgu: Bolge[]
  onHarita: (t: Tiklama) => void
  onDefter: () => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [kopru, setKopru] = useState<OdaKopru | null>(null)
  const cb = useRef({ onHarita, onDefter, onHazir, baslangicKamera, kp })
  cb.current = { onHarita, onDefter, onHazir, baslangicKamera, kp }

  // sahne betikleri yüklenince window.ODA belirir
  useEffect(() => {
    const id = setInterval(() => {
      const k = (frame.current?.contentWindow as (Window & { ODA?: OdaKopru }) | null)?.ODA
      if (!k) return
      clearInterval(id)
      k.onHarita = (b, u, v) => {
        const bolge = SAHNE_BOLGE[b]
        if (!bolge) return
        const [enlem, boylam] = enlemBoylam(u, v)
        cb.current.onHarita({ bolge, enlem, boylam })
      }
      k.onDefter = () => cb.current.onDefter()
      k.onKp = (o) => cb.current.kp?.onOlay(o)
      if (cb.current.baslangicKamera) k.snapCam(cb.current.baslangicKamera)
      setKopru(k)
      cb.current.onHazir?.()
    }, 100)
    return () => clearInterval(id)
  }, [])

  // soru sistemi: istek değişince vakayı aç / kapat
  const istekSayac = kp?.istek?.sayac ?? 0
  useEffect(() => {
    if (!kopru) return
    const i = cb.current.kp?.istek
    if (i) kopru.kpBaslat?.(KP_KONU[i.konu], KP_ZORLUK[i.zorluk], { pil: i.pil, jeton: i.jeton }, i.tekrar)
    else kopru.kpDur?.()
  }, [kopru, istekSayac])
  useEffect(() => { kopru?.setCam(kamera) }, [kopru, kamera])
  useEffect(() => { kopru?.setText(satir, bitti) }, [kopru, satir, bitti])
  useEffect(() => { kopru?.setPil(pil) }, [kopru, pil])
  useEffect(() => { kopru?.setJeton(jeton) }, [kopru, jeton])
  useEffect(() => { kopru?.setDefter(defter) }, [kopru, defter])
  useEffect(() => { kopru?.setSecili(vurgu.map((b) => OYUN_BOLGE[b])) }, [kopru, vurgu])

  return <iframe ref={frame} src="/oda/index.html?kp=bridge" title="Telsiz odası" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
}
