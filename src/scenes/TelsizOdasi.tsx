import { useEffect, useRef, useState } from 'react'
import { yol } from '../yol'
import type { Bolge } from '../map/turkey'
import type { Kamera, Tiklama } from './kameralar'
export type EkranTuru = 'telsiz' | 'nuri' | 'ayse'
import { KP_KONU, KP_ZORLUK, type KpIstek, type KpOlay } from '../game/kpKopru'
import { useOyun } from '../game/store'
import { VAKALAR } from '../data/cases'
import { ilerlemeOrani, izSayilari, kilometreSatiri } from '../game/hikaye'

/** public/oda/ içindeki three r128 sahnesinin (window.ODA) köprüsü. */
interface OdaKopru {
  onHarita: ((bolge: string, u: number, v: number) => void) | null
  onDefter: (() => void) | null
  onTelsiz?: (() => void) | null
  onArama?: (() => void) | null
  telsizMetni?: () => string[]
  kpIpucu?: (who: 'nuri' | 'ayse') => void
  setCam: (n: string) => void
  snapCam: (n: string) => void
  setText: (t: string, bitti: boolean) => void
  setPil: (p: number, sessiz?: boolean) => void
  setJeton: (n: number) => void
  setDefter: (n: number) => void
  setSecili: (a: string[]) => void
  /** Hikâye cilası: ilerleme 0..1, bölge izleri, yanlışta cızırtı, Deniz'in kilometre taşı satırı. */
  setIlerleme?: (f: number) => void
  setIz?: (o: Record<string, number>) => void
  parazit?: () => void
  hikaye?: (satir: string) => void
  /** Soru sistemi köprüsü (?kp=bridge): iframe motoru olayları buraya bildirir. */
  onKp?: ((o: KpOlay) => void) | null
  kpBaslat?: (konu: string, zorluk: number, durum: { pil: number; jeton: number }, tekrar: boolean) => string | null
  kpDur?: () => void
}

const KARAKTER: Record<'nuri' | 'ayse', { ad: string; meslek: string; ek: string; tanim: string; konular: string }> = {
  nuri: { ad: 'Nuran', meslek: 'Meteorolog', ek: 'a', tanim: 'Hava ve iklimi, hesapları ve doğa olaylarını bilir. Harita sorularında Fatma\'ya yönlendirir.', konular: 'Dünya\'nın hareketleri · İklim elemanları · İç kuvvetler · Su kaynakları · Nüfus · Göç · Doğal afetler' },
  ayse: { ad: 'Fatma', meslek: 'Haritacı', ek: 'ya', tanim: 'Haritayı, koordinatı ve rotayı bilir. Harita dışındaki sorularda Nuran\'a yönlendirir.', konular: 'Coğrafi konum · Harita bilgisi · Haritaya işaretleme ve rota soruları' },
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
  kamera, satir, bitti, pil, jeton, defter, vurgu, onHarita, onDefter, baslangicKamera, onHazir, kp, onTelsiz, onArama, ekran, ekranKapat,
}: {
  /** Masadaki "Büyük Arama Modu" klasörüne tıklanınca (3B nesne) çağrılır. */
  onArama?: () => void
  /** Soru sistemi: istek doluyken iframe o vakayı açar, null olunca kapatır; olaylar onOlay'a gelir. */
  /** Masadaki telsize tıklanınca (3B nesne) çağrılır. */
  onTelsiz?: () => void
  /** Açık ekran paneli: telsiz ekranı ya da Nuran / Fatma kartı; kapatma isteği. */
  ekran?: EkranTuru | null
  ekranKapat?: () => void
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
  const cb = useRef({ onHarita, onDefter, onHazir, baslangicKamera, kp, onTelsiz, onArama })
  cb.current = { onHarita, onDefter, onHazir, baslangicKamera, kp, onTelsiz, onArama }

  // sahne betikleri yüklenince window.ODA belirir
  useEffect(() => {
    const basla = Date.now()
    const id = setInterval(() => {
      const w = frame.current?.contentWindow as (Window & { ODA?: OdaKopru; AVATAR_DATA?: unknown; ODA_AVATAR_N?: number }) | null
      const k = w?.ODA
      if (!k) return
      // Karakterler (Nuran, Fatma) asenkron kurulur; yerleşmeden "hazır" deme (en geç 10 sn beklenir)
      if (w.AVATAR_DATA && (w.ODA_AVATAR_N ?? 0) < 2 && Date.now() - basla < 10000) return
      clearInterval(id)
      k.onHarita = (b, u, v) => {
        const bolge = SAHNE_BOLGE[b]
        if (!bolge) return
        const [enlem, boylam] = enlemBoylam(u, v)
        cb.current.onHarita({ bolge, enlem, boylam })
      }
      k.onDefter = () => cb.current.onDefter()
      k.onKp = (o) => {
        const once = useOyun.getState().bitenVakalar.length
        cb.current.kp?.onOlay(o)
        if (o.tur === 'yanlis') k.parazit?.()
        if (o.tur === 'dogru') {
          const satir = kilometreSatiri(once, useOyun.getState().bitenVakalar.length)
          if (satir) k.hikaye?.(satir)
        }
      }
      k.onTelsiz = () => cb.current.onTelsiz?.()
      k.onArama = () => cb.current.onArama?.()
      if (cb.current.baslangicKamera) k.snapCam(cb.current.baslangicKamera)
      setKopru(k)
      setTimeout(() => cb.current.onHazir?.(), 250) // ilk karelerde shader derlemesi bitsin
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
  // sahne cilası: çözülen vaka sayısı pencerede şafağı, telsizde sinyali ve haritada bölge izlerini sürer
  const biten = useOyun((s) => s.bitenVakalar)
  useEffect(() => {
    if (!kopru) return
    const cozulen = VAKALAR.filter((v) => biten.includes(v.id))
    kopru.setIlerleme?.(ilerlemeOrani(cozulen.length, VAKALAR.length))
    kopru.setIz?.(izSayilari(cozulen.map((v) => v.ortam)))
  }, [kopru, biten])

  // telsiz ekranı açılırken Deniz'in mesajları iframe'den okunur
  const [mesajlar, setMesajlar] = useState<string[]>([])
  useEffect(() => {
    if (ekran) setMesajlar(kopru?.telsizMetni?.() ?? [])
  }, [ekran, kopru, istekSayac])
  useEffect(() => {
    if (!ekran) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') ekranKapat?.() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [ekran, ekranKapat])

  return (
    <>
      <iframe ref={frame} src={yol('/oda/index.html?kp=bridge')} title="Telsiz odası" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      {ekran === 'telsiz' && (
        <div className="telsiz-ekran" role="dialog" aria-label="Telsiz ekranı">
          <div className="te-ust"><span>TELSİZ · PİL %{pil}</span><button className="te-x" onClick={ekranKapat} aria-label="Telsiz ekranını kapat">×</button></div>
          <div className="te-govde" aria-live="polite">
            {mesajlar.length ? mesajlar.map((m, i) => <p key={i}>{m}</p>) : <p className="te-bos">Sinyal bekleniyor… Bir vaka seçince Deniz burada konuşur.</p>}
          </div>
        </div>
      )}
      {(ekran === 'nuri' || ekran === 'ayse') && (
        <div className="telsiz-ekran karakter-ekran" role="dialog" aria-label={KARAKTER[ekran].ad + ' kartı'}>
          <div className="te-ust"><span>{KARAKTER[ekran].ad.toUpperCase()} · {KARAKTER[ekran].meslek.toUpperCase()}</span><button className="te-x" onClick={ekranKapat} aria-label="Kartı kapat">×</button></div>
          <div className="te-govde">
            <p>{KARAKTER[ekran].tanim}</p>
            <p className="te-konular">{KARAKTER[ekran].konular}</p>
            {kp?.istek ? (
              <button className="te-ipucu" onClick={() => { ekranKapat?.(); kopru?.kpIpucu?.(ekran) }}>{KARAKTER[ekran].ad}'{KARAKTER[ekran].ek} sor (1 jeton)</button>
            ) : (
              <p className="te-bos">Bir vaka açınca ipucunu buradan da isteyebilirsin.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
