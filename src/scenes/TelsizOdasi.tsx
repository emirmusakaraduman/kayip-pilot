import { useEffect, useRef, useState } from 'react'
import type { Bolge } from '../map/turkey'
import type { Kamera, Tiklama } from './kameralar'

/** public/oda/ içindeki three r128 sahnesinin (window.ODA) köprüsü. */
interface OdaKopru {
  onHarita: ((bolge: string, u: number, v: number) => void) | null
  onDefter: (() => void) | null
  setCam: (n: string) => void
  setText: (t: string, bitti: boolean) => void
  setPil: (p: number, sessiz?: boolean) => void
  setJeton: (n: number) => void
  setSecili: (a: string[]) => void
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
  kamera, satir, bitti, pil, jeton, vurgu, onHarita, onDefter,
}: {
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
  const cb = useRef({ onHarita, onDefter })
  cb.current = { onHarita, onDefter }

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
      setKopru(k)
    }, 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { kopru?.setCam(kamera) }, [kopru, kamera])
  useEffect(() => { kopru?.setText(satir, bitti) }, [kopru, satir, bitti])
  useEffect(() => { kopru?.setPil(pil) }, [kopru, pil])
  useEffect(() => { kopru?.setJeton(jeton) }, [kopru, jeton])
  useEffect(() => { kopru?.setSecili(vurgu.map((b) => OYUN_BOLGE[b])) }, [kopru, vurgu])

  return <iframe ref={frame} src="/oda/index.html" title="Telsiz odası" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
}
