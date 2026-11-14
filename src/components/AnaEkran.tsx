import { useEffect, useMemo, useRef, useState } from 'react'
import { yol } from '../yol'
import { useOyun } from '../game/store'
import { KONULAR } from '../data/topics'
import { VAKALAR } from '../data/cases'
import { atifSatiri } from '../assets/registry'
import { YUKSEKLIK_ATIF } from '../map/turkey'
import type { Vaka, Zorluk } from '../game/types'
import { CamYagmuru, KupaBuhari } from './AnaEkranFx'
import './anaekran.css'

/** Ana ekrandan odaya geçerken ne açılacağı. */
export type Acilis = { vaka?: Vaka; arama?: boolean }

// Zemin görseli (2000×1116 px) 1000×558 birimlik bir sahnedir; tüm katmanlar bu birimlerle yerleştirilir ve pencereye sığacak kadar ölçeklenir.
const SAHNE = { w: 1000, h: 558 }
const ZORLUKLAR: { z: Zorluk; ad: string }[] = [
  { z: 'kolay', ad: 'KOLAY' },
  { z: 'orta', ad: 'ORTA' },
  { z: 'zor', ad: 'ZOR' },
]
const pad = (n: number) => String(n).padStart(2, '0')

function useOlcek() {
  const [o, setO] = useState(1)
  useEffect(() => {
    const f = () => setO(Math.min(window.innerWidth / SAHNE.w, window.innerHeight / SAHNE.h))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return o
}

const Tik = () => (
  <svg className="ae-tik" viewBox="0 0 20 18" aria-label="tamamlandı"><path d="M2 9.5 7.5 15 18 2.5" fill="none" stroke="#2f8f3c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const Kilit = ({ b = 12 }: { b?: number }) => (
  <svg className="ae-kilit" width={b} height={b * 1.2} viewBox="0 0 12 14" aria-label="kilitli">
    <path d="M3 6V4.2a3 3 0 0 1 6 0V6" fill="none" stroke="#1b1612" strokeWidth="1.6" /><rect x="1.2" y="6" width="9.6" height="7" rx="1.2" fill="#1b1612" />
  </svg>
)
const Cizim = ({ z }: { z: Zorluk }) => (
  <svg className="ae-cizim" viewBox="0 0 40 34" aria-hidden>
    {z === 'kolay' && (<g fill="none" stroke="#2a2013" strokeWidth="1.1"><circle cx="20" cy="17" r="12" /><circle cx="20" cy="17" r="1.6" fill="#2a2013" /><path d="M20 6v3M20 25v3M9 17h3M28 17h3" /><path d="M20 17l-4-8 8 4z" fill="#b3261e" stroke="#b3261e" /></g>)}
    {z === 'orta' && (<g fill="none" stroke="#2a2013" strokeWidth="1.1"><rect x="12" y="8" width="13" height="23" rx="2" /><path d="M16 8V2M13 14h9M13 18h9M13 22h9" /><circle cx="18.5" cy="27" r="1.6" /></g>)}
    {z === 'zor' && (<g fill="none" stroke="#2a2013" strokeWidth="1.1" strokeLinejoin="round"><path d="M3 30 15 8l7 12 4-6 11 16z" /><path d="M12 14l3 3 3-3" /></g>)}
  </svg>
)

export function AnaEkran({ basla, izle }: { basla: (a: Acilis) => void; izle: () => void }) {
  const olcek = useOlcek()
  const { jeton, defter, bitenVakalar, sesAcik, muzikAcik, sesDegistir, muzikDegistir, ilerlemeyiSifirla } = useOyun()

  // konu durumu: tamam (vakaların hepsi bitti) · aktif (ilk bitmemiş, önerilen) · acik (diğerleri). Kilit yok: öğrenci istediği konuya girer.
  const durumlar = useMemo(() => {
    const tamam = KONULAR.map((k) => ZORLUKLAR.every(({ z }) => { const v = VAKALAR.find((x) => x.konu === k.id && x.zorluk === z); return !v || bitenVakalar.includes(v.id) }))
    let aktif = tamam.findIndex((t) => !t)
    if (aktif < 0) aktif = KONULAR.length - 1
    return KONULAR.map((_k, i) => (tamam[i] ? 'tamam' : i === aktif ? 'aktif' : 'acik') as 'tamam' | 'aktif' | 'acik')
  }, [bitenVakalar])
  const aktifIdx = Math.max(0, durumlar.indexOf('aktif'))
  const [secili, setSecili] = useState<number | null>(null)
  const dosyaKilitli = defter.length < KONULAR.length // Büyük Arama dosyası tüm defter sayfaları toplanınca açılır
  const idx = secili ?? aktifIdx
  const konu = KONULAR[idx]

  // liste: aktif konu görünür kalacak şekilde kaydır
  const liste = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const l = liste.current
    if (l) l.scrollTop = Math.max(0, aktifIdx - 2) * 31
  }, [aktifIdx])

  const kartlar = ZORLUKLAR.map(({ z, ad }, i) => {
    const vaka = VAKALAR.find((v) => v.konu === konu.id && v.zorluk === z)
    const biten = !!vaka && bitenVakalar.includes(vaka.id)
    const kilitli = !vaka // yalnızca vakası hiç yazılmamış kart kapalı kalır; zorluk sırası kilidi yok
    return { z, ad, vaka, biten, kilitli, no: i + 1 }
  })
  // "Göreve başla": seçili konunun sıradaki oynanabilir vakası
  const siradaki = kartlar.find((k) => !k.kilitli && !k.biten) ?? kartlar.find((k) => !k.kilitli)

  const KART = [
    { x: 529, y: 307, w: 69, h: 122, r: -1.2 },
    { x: 599, y: 303, w: 73, h: 133, r: 0.8 },
    { x: 673, y: 309, w: 75, h: 122, r: 1 },
  ]

  return (
    <div className="ae">
      <div className="ae-sahne" style={{ width: SAHNE.w, height: SAHNE.h, transform: `translate(-50%, -50%) scale(${olcek})` }}>
        <img className="ae-zemin" src={yol('/arayuz/ana-ekran.webp')} width={SAHNE.w} height={SAHNE.h} alt="" draggable={false} />

        {/* canlı ışık/yağmur katmanları */}
        <CamYagmuru className="ae-yagmur" />
        <div className="ae-parilti" aria-hidden />
        <div className="ae-lamba" aria-hidden />
        <KupaBuhari className="ae-buhar" />

        {/* sağ üst sayaçlar */}
        <div className="ae-cip" style={{ left: 808, top: 12, width: 68 }}>Jeton: <b>{jeton}</b></div>
        <div className="ae-cip" style={{ left: 887, top: 12, width: 100 }}>Defter: <b>{defter.length}/{KONULAR.length}</b></div>

        {/* görselden silinen bulanık yazıların keskin vektör karşılıkları */}
        <div className="ae-levha" style={{ left: 17, top: 16, width: 185, height: 66 }} role="banner">
          <b>KAYIP PİLOT</b>
          <span>THE LOST PILOT</span>
        </div>
        <h1 className="ae-defter-baslik" style={{ left: 310, top: 186, width: 184, height: 40 }}>TYT COĞRAFYA<br />OPERASYON PLANI</h1>

        <button className="ae-izle" style={{ left: 18, top: 90 }} onClick={izle}>▶ Girişi izle</button>
        <button className="ae-izle" style={{ left: 18, top: 128 }} onClick={sesDegistir} aria-label="Ses">{sesAcik ? '🔊 Ses açık' : '🔇 Ses kapalı'}</button>
        <button className="ae-izle" style={{ left: 18, top: 166, opacity: muzikAcik ? 1 : 0.55 }} onClick={muzikDegistir} aria-label="Müzik">{muzikAcik ? '🎵 Müzik açık' : '🎵 Müzik kapalı'}</button>
        {import.meta.env.BASE_URL !== '/' && <a className="ae-izle" style={{ left: 18, top: 242, textDecoration: 'none' }} href="/">← Oyun Merkezi</a>}
        <button className="ae-izle" style={{ left: 18, top: 204 }} onClick={() => { if (window.confirm('Tüm ilerleme silinecek: çözülen vakalar, defter sayfaları, jeton, karne ve Büyük Arama. Emin misin?')) ilerlemeyiSifirla() }} aria-label="İlerlemeyi sıfırla">↺ İlerlemeyi sıfırla</button>

        {/* sol sayfa: konu listesi */}
        <ol className="ae-liste" ref={liste} style={{ left: 304, top: 238, width: 184, height: 192 }}>
          {KONULAR.map((k, i) => {
            const d = durumlar[i]
            return (
              <li key={k.id}>
                <button className={'ae-konu ' + d + (i === idx ? ' sec' : '')} onClick={() => setSecili(i)} aria-current={i === idx}>
                  <span className="ae-ad">{pad(k.sayfa)}. {k.ad}</span>
                  {d === 'tamam' && <Tik />}
                  {d === 'aktif' && <em className="ae-damga">AKTİF</em>}
                </button>
              </li>
            )
          })}
        </ol>

        {/* sağ sayfa: konu başlığı ve açıklama */}
        <div className="ae-sag" style={{ left: 538, top: 190, width: 190, height: 114 }}>
          <h2>{pad(konu.sayfa)}. {konu.ad.toLocaleUpperCase('tr-TR')}</h2>
          <p>Deniz'in telsizle bildirdiği ipuçlarını analiz ederek uçağın düştüğü bölgeyi daralt.</p>
        </div>

        {/* vaka kartları */}
        {kartlar.map((k, i) => {
          const p = KART[i]
          return (
            <button
              key={k.z}
              className={'ae-kart ' + (k.kilitli ? 'kilitli' : k.biten ? 'bitti' : 'yeni')}
              style={{ left: p.x, top: p.y, width: p.w, height: p.h, transform: `rotate(${p.r}deg)` }}
              disabled={k.kilitli}
              onClick={() => k.vaka && basla({ vaka: k.vaka })}
              title={k.vaka?.baslik}
            >
              <span className={'ae-toka t' + k.no} aria-hidden />
              <b>VAKA {k.no}: <i>{k.ad}</i></b>
              <span className="ae-vbaslik">{k.vaka?.baslik ?? '—'}</span>
              {k.kilitli ? <><Kilit b={13} /><span className="ae-not">{k.no === 1 ? 'Kilitli' : `Vaka ${k.no - 1}'i tamamla`}</span></> : <Cizim z={k.z} />}
              {!k.kilitli && k.biten && <span className="ae-basari">BAŞARILI<Tik /></span>}
              {!k.kilitli && !k.biten && <span className="ae-yeni">YENİ<br />OYNA</span>}
            </button>
          )
        })}

        {/* Büyük Arama çantası ve radar düğmesi: görseldeki nesnelerin üstünde şeffaf düğmeler */}
        <button
          className={'ae-dosya' + (dosyaKilitli ? ' kilitli' : '')}
          style={{ left: 740, top: 284, width: 255, height: 132 }}
          disabled={dosyaKilitli}
          onClick={() => basla({ arama: true })}
          aria-label={`Büyük Arama Modu, gizlilik kilidi: toplanan veri ${defter.length}/${KONULAR.length}`}
          title={dosyaKilitli ? `Kilitli: ${KONULAR.length} defter sayfasını tamamla` : 'Büyük Arama Modu'}
        >
          <span className="ae-dosya-not">GİZLİLİK KİLİDİ:<br />Toplanan Veri <b>{defter.length}/{KONULAR.length}</b></span>
        </button>
        <button className="ae-radar" style={{ left: 855, top: 416, width: 128, height: 128 }} onClick={() => basla(siradaki?.vaka ? { vaka: siradaki.vaka } : {})} aria-label="Bağlantıyı kur, göreve başla">
          <span className="ae-tarama" />
        </button>

        {/* kavanozdaki parlayan jeton sayısı: görseldeki rakam silindi, canlı rakam aynı yerde parlar */}
        <div className={'ae-sayi' + (jeton > 99 ? ' u3' : jeton > 9 ? ' u2' : '')} style={{ left: 40, top: 476, width: 68 }} aria-hidden>{jeton}</div>

        <div className="ae-alt">
          <small>İçerik uyarısı: kurgu bir uçak kazası ve yangın içerir.</small>
          <small className="ae-atif">{atifSatiri()} {YUKSEKLIK_ATIF}</small>
        </div>
      </div>
    </div>
  )
}
