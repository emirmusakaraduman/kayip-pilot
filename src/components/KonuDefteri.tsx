import { useEffect, useMemo } from 'react'
import { useOyun } from '../game/store'
import { useDefterUI } from '../game/defterUI'
import { KONULAR } from '../data/topics'
import { VAKALAR } from '../data/cases'
import { ARAMA_ASAMALARI } from '../data/buyukArama'
import type { Vaka, Zorluk } from '../game/types'
import './konuDefteri.css'

const ZORLUKLAR: { id: Zorluk; ad: string }[] = [
  { id: 'kolay', ad: 'Kolay' },
  { id: 'orta', ad: 'Orta' },
  { id: 'zor', ad: 'Zor' },
]

function Kilit() {
  return (
    <svg className="kd-kilit" viewBox="0 0 24 24" width="16" height="16" aria-label="Kilitli" role="img" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

/**
 * Masadaki Konu Defteri: iki sayfalı açık defter. Sol sayfa 15 konu, sağ sayfa seçili konunun
 * üç vaka kağıdı (kolay, orta, zor). Bir kâğıda tıklamak görevi başlatır (onSec).
 */
export function KonuDefteri({ onSec, onArama }: { onSec: (v: Vaka) => void; onArama: () => void }) {
  const { seciliKonu, seciliVaka, konuSec, vakaSec, kapat } = useDefterUI()
  const biten = useOyun((s) => s.bitenVakalar)
  const ilerleme = useOyun((s) => s.aramaIlerleme)

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') kapat() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [kapat])

  const vakalarOf = (konu: string) => ZORLUKLAR.map((z) => VAKALAR.find((v) => v.konu === konu && v.zorluk === z.id))
  // Ana ekrandaki defterle aynı ilerleme kuralı: tamam · aktif (ilk bitmemiş) · açık (daha önceki) · kilitli (aktiften sonra)
  const durumlar = useMemo(() => {
    const tamam = KONULAR.map((k) => vakalarOf(k.id).every((v) => !v || biten.includes(v.id)))
    let aktif = tamam.findIndex((t) => !t)
    if (aktif < 0) aktif = KONULAR.length - 1
    return KONULAR.map((_k, i) => (tamam[i] ? 'tamam' : i === aktif ? 'aktif' : i < aktif ? 'acik' : 'kilitli'))
  }, [biten])
  const konu = KONULAR.find((k) => k.id === seciliKonu) ?? KONULAR[0]
  const vakalar = vakalarOf(konu.id)

  return (
    <div className="kd-kapsam" onClick={kapat}>
      <div className="kd" role="dialog" aria-label="Konu Defteri" onClick={(e) => e.stopPropagation()}>
        <button className="kd-x" onClick={kapat} aria-label="Defteri kapat">×</button>

        <section className="kd-sayfa kd-sol" aria-label="Konular">
          <h3>Konular</h3>
          <ul>
            {KONULAR.map((k, i) => {
              const d = durumlar[i]
              const kilitli = d === 'kilitli'
              const bitti = d === 'tamam'
              return (
                <li key={k.id}>
                  <button
                    className={'kd-konu' + (k.id === konu.id ? ' kd-sec' : '') + (bitti ? ' kd-bitti' : '') + (kilitli ? ' kd-kilit-satir' : '')}
                    disabled={kilitli}
                    aria-current={k.id === konu.id}
                    onClick={() => konuSec(k.id)}
                  >
                    <span className="kd-no">{i + 1}.</span>
                    <span className="kd-ad">{k.ad}</span>
                    {kilitli && <Kilit />}
                  </button>
                </li>
              )
            })}
          </ul>
          <button className="kd-arama" onClick={onArama}>Büyük Arama ({ilerleme}/{ARAMA_ASAMALARI.length})</button>
        </section>

        <div className="kd-cilt" aria-hidden="true" />

        <section className="kd-sayfa kd-sag" aria-label={konu.ad + ' vakaları'}>
          <h3>{konu.ad}</h3>
          <p className="kd-not">Bir kâğıt seç, görev başlasın.</p>
          <div className="kd-kagitlar">
            {ZORLUKLAR.map((z, i) => {
              const v = vakalar[i]
              const cozuldu = !!v && biten.includes(v.id)
              const onceki = i === 0 ? true : !vakalar[i - 1] || biten.includes(vakalar[i - 1]!.id)
              const kilitli = !v || durumlar[KONULAR.indexOf(konu)] === 'kilitli' || !onceki
              return (
                <button
                  key={z.id}
                  className={`kd-kagit kd-${z.id}` + (v && seciliVaka?.id === v.id ? ' kd-secili-kagit' : '')}
                  disabled={kilitli}
                  onClick={() => { if (v) { vakaSec(v); onSec(v) } }}
                >
                  <span className={`kd-muhur kd-m-${z.id}`}>{z.ad}</span>
                  <span className="kd-baslik">{kilitli ? (v ? (i === 0 ? 'Kilitli' : `Vaka ${i}'i tamamla`) : 'Henüz yok') : v!.baslik}</span>
                  {kilitli && v && <Kilit />}
                  {cozuldu && <span className="kd-cozuldu">ÇÖZÜLDÜ</span>}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
