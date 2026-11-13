import { useEffect, useMemo, useState } from 'react'
import { useOyun } from '../game/store'
import { KONULAR } from '../data/topics'
import { DEFTER } from '../data/defter'
import { VAKALAR } from '../data/cases'
import { ARAMA_VAKALARI } from '../data/buyukArama'

// Açık kitap defter: sol sayfa çift, sağ sayfa tek numaralıdır (4|5, 6|7 …).
// Sayfa n = konu n; yalnızca o konuyu bitirince yazılır, değilse "henüz boş" yazar.
// Sayfa çevirme CSS 3B animasyonuyla; Esc kapatır, ← → sayfa çevirir.
const SAYFA = 15
const SPREAD = Math.ceil(SAYFA / 2) + 1 // 0: (–|1), 1: (2|3) … 7: (14|15)
const sol = (s: number) => s * 2
const sag = (s: number) => s * 2 + 1

function Yaprak({ n, acik }: { n: number; acik: boolean }) {
  if (n < 1 || n > SAYFA) return <div className="yaprak bos" />
  const konu = KONULAR.find((k) => k.sayfa === n)!
  const metin = DEFTER.find((d) => d.konu === konu.id)?.metin
  return (
    <div className="yaprak">
      <h4>
        {n}. {konu.ad}
      </h4>
      {acik && metin ? (
        metin.split('\n').map((satir, i) => <p key={i}>{satir}</p>)
      ) : (
        <p className="bosluk">Bu sayfa henüz boş. Bu konuyu bitirince açılır.</p>
      )}
      <span className="sayfa-no">{n}</span>
    </div>
  )
}

export function DefterKitabi({ kapat }: { kapat: () => void }) {
  const { defter, yanlisDefteri } = useOyun()
  const acikSayfalar = useMemo(() => new Set(KONULAR.filter((k) => defter.includes(k.id)).map((k) => k.sayfa)), [defter])
  // en son kazanılan sayfanın açılımıyla başla
  const [spread, setSpread] = useState(() => {
    const son = defter.length ? Math.max(...KONULAR.filter((k) => defter.includes(k.id)).map((k) => k.sayfa)) : 1
    return Math.floor(son / 2)
  })
  const [anim, setAnim] = useState<{ yon: 1 | -1; hedef: number } | null>(null)
  const [yanlis, setYanlis] = useState(false)

  const cevir = (yon: 1 | -1) => {
    if (anim) return
    const hedef = spread + yon
    if (hedef < 0 || hedef >= SPREAD) return
    setAnim({ yon, hedef })
    window.setTimeout(() => {
      setSpread(hedef)
      setAnim(null)
    }, 680)
  }

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') kapat()
      else if (e.key === 'ArrowRight') cevir(1)
      else if (e.key === 'ArrowLeft') cevir(-1)
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  })

  const solN = anim ? (anim.yon > 0 ? sol(spread) : sol(anim.hedef)) : sol(spread)
  const sagN = anim ? (anim.yon > 0 ? sag(anim.hedef) : sag(spread)) : sag(spread)
  const etiket = `Sayfa ${Math.max(1, sol(anim ? anim.hedef : spread))}–${Math.min(SAYFA, sag(anim ? anim.hedef : spread))} / ${SAYFA}`
  const sayfaAcik = (n: number) => acikSayfalar.has(n)

  return (
    <div className="kitap-arka" onClick={kapat}>
      <div className="kitap-kutu" onClick={(e) => e.stopPropagation()}>
        <div className="kitap-ust">
          <span>Deniz'in defteri</span>
          <span>
            <button className="kucuk" onClick={() => setYanlis((x) => !x)}>{yanlis ? 'Defteri göster' : `Yanlış defteri (${yanlisDefteri.length})`}</button>{' '}
            <button className="kucuk" onClick={kapat}>Kapat (Esc)</button>
          </span>
        </div>
        {yanlis ? (
          <div className="yanlis-liste">
            <h4>Yanlış defteri</h4>
            {yanlisDefteri.length === 0 && <p>Henüz yanlış yok.</p>}
            {yanlisDefteri.map((id) => {
              const v = [...VAKALAR, ...ARAMA_VAKALARI].find((x) => x.id === id)
              return v ? <p key={id}><b>{v.baslik}:</b> {v.aciklama}</p> : null
            })}
          </div>
        ) : (
          <div className="kitap-sahne">
            <div className="kitap">
              <div className="kitap-kapak" />
              <div className="kitap-sayfalar">
                <div className="yarim sol"><Yaprak n={solN} acik={sayfaAcik(solN)} /></div>
                <div className="yarim sag"><Yaprak n={sagN} acik={sayfaAcik(sagN)} /></div>
                {anim && (
                  <div className={'yaprak-donen ' + (anim.yon > 0 ? 'ileri' : 'geri')}>
                    <div className="yuz"><Yaprak n={anim.yon > 0 ? sag(spread) : sol(spread)} acik={sayfaAcik(anim.yon > 0 ? sag(spread) : sol(spread))} /></div>
                    <div className="arka"><Yaprak n={anim.yon > 0 ? sol(anim.hedef) : sag(anim.hedef)} acik={sayfaAcik(anim.yon > 0 ? sol(anim.hedef) : sag(anim.hedef))} /></div>
                  </div>
                )}
                <div className="cilt-golge" />
              </div>
            </div>
          </div>
        )}
        <div className="kitap-alt">
          <button className="kucuk" disabled={spread === 0 || !!anim || yanlis} onClick={() => cevir(-1)}>◀ Önceki</button>
          <span>{etiket}</span>
          <button className="kucuk" disabled={spread >= SPREAD - 1 || !!anim || yanlis} onClick={() => cevir(1)}>Sonraki ▶</button>
        </div>
      </div>
    </div>
  )
}
