import { useEffect, useMemo } from 'react'
import { useOyun } from '../game/store'
import { KONULAR } from '../data/topics'
import { VAKALAR } from '../data/cases'
import { konuKarnesi, tekrarGelenler } from '../game/karne'
import type { Vaka } from '../game/types'
import './karne.css'

const ZORLUK_AD = { kolay: 'Kolay', orta: 'Orta', zor: 'Zor' }

/** Karne: konu başına çözülen vaka ve doğruluk oranı, altta aralıklı tekrar sırası. */
export function Karne({ kapat, onTekrar }: { kapat: () => void; onTekrar: (v: Vaka) => void }) {
  const ist = useOyun((s) => s.istatistik)
  const biten = useOyun((s) => s.bitenVakalar)
  // zaman her açılışta bir kez alınır (render sırasında Date.now çağrısından kaçınmak için)
  const simdi = useMemo(() => Date.now(), [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') kapat() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [kapat])

  const satirlar = konuKarnesi(ist, biten, VAKALAR, simdi)
  const tekrar = tekrarGelenler(ist, simdi)
    .map((id) => VAKALAR.find((v) => v.id === id))
    .filter((v): v is Vaka => !!v)
  const toplamCozulen = satirlar.reduce((a, s) => a + s.cozulen, 0)

  return (
    <div className="karne-kapsam" onClick={kapat}>
      <div className="karne" role="dialog" aria-label="Karne" onClick={(e) => e.stopPropagation()}>
        <button className="karne-x" onClick={kapat} aria-label="Karneyi kapat">×</button>
        <h3>Karne <small>{toplamCozulen}/{VAKALAR.length} vaka</small></h3>

        <ul className="karne-konular">
          {satirlar.map((s) => {
            const konu = KONULAR.find((k) => k.id === s.konu)!
            const yuzde = s.oran === null ? null : Math.round(s.oran * 100)
            return (
              <li key={s.konu}>
                <span className="karne-ad">{konu.ad}</span>
                <span className="karne-cubuk" aria-hidden>
                  <i style={{ width: `${(s.cozulen / s.toplam) * 100}%` }} />
                </span>
                <span className="karne-sayi">{s.cozulen}/{s.toplam}</span>
                <span className={'karne-oran' + (yuzde !== null && yuzde < 60 ? ' dusuk' : '')}>{yuzde === null ? '—' : `%${yuzde}`}</span>
              </li>
            )
          })}
        </ul>

        <h4>Tekrar zamanı <small>{tekrar.length ? `${tekrar.length} vaka` : ''}</small></h4>
        {tekrar.length === 0 ? (
          <p className="karne-bos">Şimdilik tekrar gereken vaka yok. Yanlış yaptığın ve süresi dolan vakalar burada çıkar.</p>
        ) : (
          <ul className="karne-tekrar">
            {tekrar.slice(0, 6).map((v) => (
              <li key={v.id}>
                <span>{KONULAR.find((k) => k.id === v.konu)?.ad} · {ZORLUK_AD[v.zorluk]}</span>
                <button className="kucuk" onClick={() => onTekrar(v)}>Tekrar et</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
