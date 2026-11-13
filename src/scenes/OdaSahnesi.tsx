import { useEffect, useMemo, useRef, useState } from 'react'
import { KAMERALAR, type Kamera, type Tiklama } from './kameralar'
import { TelsizOdasi } from './TelsizOdasi'
import { useOyun } from '../game/store'
import { JETON, bitirmeJetonu, degerlendir, parazit } from '../game/engine'
import { bip, cizirti, dogruSes, yanlisSes } from '../game/audio'
import { KONULAR } from '../data/topics'
import { VAKALAR } from '../data/cases'
import { DEFTER } from '../data/defter'
import { DefterKitabi } from '../components/DefterKitabi'
import { ARAMA_ASAMALARI, ARAMA_HIKAYE } from '../data/buyukArama'
import { BOLGE_AD, type Bolge } from '../map/turkey'
import type { Vaka, Verilen, Zorluk } from '../game/types'
import { Sinematik } from '../cinematic/Sinematik'
import type { Acilis } from '../components/AnaEkran'
import type { KpIstek, KpOlay } from '../game/kpKopru'

/** Telsiz altyazısı: kelime kelime yazılır; pil azaldıkça kelimeler "[cızırtı]" olur. */
function useTelsizYazi(vaka: Vaka | null, pilBaslangic: number) {
  const kelimeler = useMemo(() => {
    if (!vaka) return []
    const par = parazit(pilBaslangic)
    return vaka.telsiz
      .join(' ')
      .split(/\s+/)
      .map((k, i) => {
        let h = 0
        for (const c of vaka.id + i) h = (h * 31 + c.charCodeAt(0)) >>> 0
        return par > 0 && (h % 1000) / 1000 < par * 0.5 ? '[cızırtı]' : k
      })
  }, [vaka, pilBaslangic])
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!vaka) return
    const t = setInterval(() => {
      setN((x) => {
        if (x >= kelimeler.length) {
          clearInterval(t)
          return x
        }
        if (kelimeler[x] === '[cızırtı]') cizirti(0.2)
        else bip(700 + (x % 3) * 60, 0.03, 0.015)
        return x + 1
      })
    }, 220)
    return () => clearInterval(t)
  }, [vaka, kelimeler])
  return { metin: kelimeler.slice(0, n).join(' '), bitti: n >= kelimeler.length && kelimeler.length > 0 }
}

type Asama = 'sec' | 'dinle' | 'sonuc'

export function OdaSahnesi({ acilis, anaEkran, giris = false }: { acilis?: Acilis; anaEkran?: () => void; giris?: boolean }) {
  const oyun = useOyun()
  // Sinematikten gelindiyse masadaki telsizin yakın planıyla başlar, karartma açılırken odaya doğru açılır.
  const [kamera, setKamera] = useState<Kamera>(giris ? 'telsiz' : 'oda')
  const girisRef = useRef(giris)
  const [vaka, setVaka] = useState<Vaka | null>(null)
  const [asama, setAsama] = useState<Asama>('sec')
  const [pilBas, setPilBas] = useState(100)
  const { metin, bitti } = useTelsizYazi(vaka, pilBas)
  const [secBolgeler, setSecBolgeler] = useState<Bolge[]>([])
  const [nokta, setNokta] = useState<[number, number] | null>(null)
  const [sayi, setSayi] = useState('')
  const [sira, setSira] = useState<string[]>([])
  const [ipuclari, setIpuclari] = useState<string[]>([])
  const [mesaj, setMesaj] = useState<{ dogru: boolean; metin: string } | null>(null)
  const [panel, setPanel] = useState<'defter' | 'yanlis' | 'arama' | null>(acilis?.arama ? 'arama' : null)
  const [kisaSinema, setKisaSinema] = useState<Vaka | null>(acilis?.vaka ?? null) // bölüm başı kısa sinematik
  const [arama, setArama] = useState<number | null>(null) // Büyük Arama'da şu anki aşama (Konu Modu'nda null)
  const [defterOku, setDefterOku] = useState(false)
  const [vakaPaneli, setVakaPaneli] = useState(false) // Konu Modu paneli varsayılan olarak kapalı
  // Soru sistemi (iframe motoru): Konu Modu'nda seçilen vaka, istek ve sayaç
  const [kpVaka, setKpVaka] = useState<Vaka | null>(null)
  const [kpIstek, setKpIstek] = useState<KpIstek | null>(null)
  const kpSayac = useRef(0)

  const vakaBaslat = (v: Vaka) => {
    setVaka(v)
    setPilBas(useOyun.getState().pil)
    setAsama('dinle')
    setSecBolgeler([])
    setNokta(null)
    setSayi('')
    setSira([])
    setIpuclari([])
    setMesaj(null)
    setDefterOku(false)
    setKamera('telsiz')
  }

  /** Konu Modu: vakayı iframe'deki soru sistemi açar. Pil, jeton ve defter React deposunda kalır. */
  const kpBasla = (v: Vaka) => {
    const d = useOyun.getState()
    setVaka(null)
    setAsama('sec')
    setVakaPaneli(false)
    setKpVaka(v)
    setKpIstek({ sayac: ++kpSayac.current, vakaId: v.id, konu: v.konu, zorluk: v.zorluk, pil: d.pil, jeton: d.jeton, tekrar: d.bitenVakalar.includes(v.id) })
  }
  const kpCik = () => {
    setKpVaka(null)
    setKpIstek(null)
    setKamera('oda')
  }
  const kpOlay = (o: KpOlay) => {
    const d = useOyun.getState()
    if (o.tur === 'durum') d.kpSenkron(o.pil, o.jeton)
    else if (o.tur === 'dogru') {
      d.kpSenkron(o.pil, o.jeton)
      if (kpVaka) d.kpDogru(kpVaka.id, kpVaka.konu)
      dogruSes()
    } else if (o.tur === 'yanlis') {
      d.kpSenkron(o.pil, o.jeton)
      if (kpVaka) d.kpYanlis(kpVaka.id)
      yanlisSes()
    } else if (o.tur === 'basla') {
      if (o.kamera in KAMERALAR) setKamera(o.kamera as Kamera)
    } else if (o.tur === 'bitti' || o.tur === 'yok') kpCik()
  }

  /** Büyük Arama: i. aşamayı başlatır; ilk aşamada kısa sinematik oynar. */
  const aramaBaslat = (i: number) => {
    setArama(i)
    setPanel(null)
    const v = ARAMA_ASAMALARI[i].vaka
    if (i === 0) setKisaSinema(v)
    else vakaBaslat(v)
  }
  const aramaCik = () => {
    setArama(null)
    setAsama('sec')
    setVaka(null)
    setKamera('oda')
  }

  // masadaki deftere tıklama ve "Defter" düğmesi: Deniz'in defterini açar
  const defterAc = () => {
    setVakaPaneli(false)
    setPanel('defter')
  }

  const haritaTikla = (t: Tiklama) => {
    if (asama !== 'dinle' || !vaka) return
    if (vaka.cevap.tur === 'harita-bolge') setSecBolgeler((s) => (s.includes(t.bolge) ? s.filter((b) => b !== t.bolge) : [...s, t.bolge]))
    if (vaka.cevap.tur === 'harita-nokta') setNokta([t.enlem, t.boylam])
  }

  const gonder = (verilen: Verilen) => {
    if (!vaka || oyun.pil <= 0) return
    const { dogru } = degerlendir(vaka.cevap, verilen)
    if (dogru) {
      const j = bitirmeJetonu(ipuclari.length > 0)
      if (arama !== null) {
        const son = arama === ARAMA_ASAMALARI.length - 1
        const toplam = j + (son ? ARAMA_HIKAYE.odul : 0)
        oyun.aramaAsamaBitir(toplam, son)
        setMesaj({ dogru: true, metin: `Doğru! +${toplam} jeton. Bulgu: ${ARAMA_ASAMALARI[arama].bulgu}` })
      } else {
        oyun.vakaBitir(vaka.id, vaka.konu, j)
        setMesaj({ dogru: true, metin: `Doğru! +${j} jeton. Deniz'in defterine bir sayfa eklendi.` })
      }
      dogruSes()
      setAsama('sonuc')
    } else {
      oyun.yanlisYap(vaka.id)
      yanlisSes()
      setMesaj({ dogru: false, metin: vaka.aciklama })
    }
  }

  const ipucuIste = (kim: 'Nuran' | 'Fatma') => {
    const t = kim === 'Nuran' ? vaka?.ipucuNuri : vaka?.ipucuAyse
    if (!t || !oyun.ipucuAl()) return
    setIpuclari((x) => [...x, `${kim}: ${t}`])
  }

  const c = vaka?.cevap
  const kartlar = c && (c.tur === 'secenek' || c.tur === 'karar' || c.tur === 'grafik') ? c.secenekler : null
  const rotaSecenekleri = c?.tur === 'rota' ? [...c.dogruSira].reverse() : []
  const sustu = oyun.pil <= 0
  const asamaBilgi = arama !== null ? ARAMA_ASAMALARI[arama] : null
  const sayfaAcik = asamaBilgi ? oyun.defter.includes(asamaBilgi.defterSayfa) : false
  const aramaVurgu: Bolge[] = arama !== null && oyun.aramaIlerleme >= 4 ? ['karadeniz'] : []

  if (kisaSinema)
    return (
      <Sinematik
        kisa
        ortam={kisaSinema.ortam}
        onDone={() => {
          const v = kisaSinema
          setKisaSinema(null)
          if (arama === null) kpBasla(v)
          else vakaBaslat(v)
        }}
      />
    )

  return (
    <div className="oda">
      <TelsizOdasi
        baslangicKamera={giris ? 'telsiz' : undefined}
        onHazir={() => { if (girisRef.current) { girisRef.current = false; setTimeout(() => setKamera('oda'), 1100) } }}
        kamera={kamera}
        satir={metin}
        bitti={bitti}
        pil={oyun.pil}
        jeton={oyun.jeton}
        vurgu={[...secBolgeler, ...aramaVurgu]}
        onHarita={haritaTikla}
        defter={oyun.defter.length}
        onDefter={defterAc}
        kp={{ istek: kpIstek, onOlay: kpOlay }}
      />

      <div className="hud defterler">
        {anaEkran && <button className="kucuk" onClick={anaEkran}>← Ana Ekran</button>}
        <button className="kucuk" onClick={defterAc}>Pilotun Defteri</button>
        <button className="kucuk" onClick={() => { setVakaPaneli(false); setPanel('yanlis') }}>Hata Defteri</button>
        {kpVaka && <button className="kucuk" onClick={kpCik}>Vakadan çık</button>}
        {asama === 'sec' && !kpVaka && (
          <button className={'kucuk' + (vakaPaneli ? ' secili' : '')} onClick={() => setVakaPaneli((x) => !x)}>Konu Defteri</button>
        )}
      </div>

      <div className="hud kameralar">
        <button className="kucuk" onClick={oyun.sesDegistir} aria-label="Ses">{oyun.sesAcik ? '🔊' : '🔇'}</button>
        {(Object.keys(KAMERALAR) as Kamera[]).map((k) => (
          <button key={k} className={'kucuk' + (k === kamera ? ' secili' : '')} onClick={() => setKamera(k)}>
            {KAMERALAR[k].ad}
          </button>
        ))}
      </div>

      {asama === 'sec' && vakaPaneli && panel === null && (
        <VakaSecici
          onSec={(v) => { setVakaPaneli(false); setArama(null); setKisaSinema(v) }}
          onArama={() => { setVakaPaneli(false); setPanel('arama') }}
          kapat={() => setVakaPaneli(false)}
        />
      )}
      {panel === 'arama' && <AramaGiris baslat={(i) => aramaBaslat(i)} kapat={() => setPanel(null)} />}

      {arama !== null && asama !== 'sec' && oyun.aramaIlerleme > 0 && (
        <div className="hud pano">
          <b>Arama panosu</b>
          {ARAMA_ASAMALARI.slice(0, oyun.aramaIlerleme).map((a, i) => (
            <div key={i}>✔ {a.bulgu}</div>
          ))}
        </div>
      )}

      {vaka && asama !== 'sec' && (
        <div className="hud alt">
          {asamaBilgi && <div className="anlati">{asamaBilgi.merkez}</div>}
          <div className="altyazi">
            <b>DENİZ:</b> {metin || '…'}
          </div>
          {ipuclari.map((x) => (
            <div key={x} className="ipucu">{x}</div>
          ))}
          {asama === 'dinle' && bitti && (
            <div className="soru">
              <p>{vaka.soru}</p>
              {kartlar && (
                <div className="kartlar">
                  {kartlar.map((k, i) => (
                    <button key={k} onClick={() => gonder({ tur: c!.tur as 'secenek', indeks: i })}>{k}</button>
                  ))}
                </div>
              )}
              {c?.tur === 'sayi' && (
                <div className="satir">
                  <input value={sayi} onChange={(e) => setSayi(e.target.value)} inputMode="decimal" placeholder="Sayı" />
                  {c.birim}
                  <button onClick={() => sayi.trim() && !isNaN(Number(sayi.replace(',', '.'))) && gonder({ tur: 'sayi', deger: Number(sayi.replace(',', '.')) })}>Gönder</button>
                </div>
              )}
              {c?.tur === 'harita-bolge' && (
                <div className="satir">
                  Haritadan bölge seç: {secBolgeler.map((b) => BOLGE_AD[b]).join(', ') || '—'}
                  <button onClick={() => gonder({ tur: 'harita-bolge', bolgeler: secBolgeler })}>Gönder</button>
                </div>
              )}
              {c?.tur === 'harita-nokta' && (
                <div className="satir">
                  Haritaya tıkla: {nokta ? `${nokta[0].toFixed(1)}°K ${nokta[1].toFixed(1)}°D` : '—'}
                  <button disabled={!nokta} onClick={() => nokta && gonder({ tur: 'harita-nokta', nokta })}>Gönder</button>
                </div>
              )}
              {c?.tur === 'rota' && (
                <div className="satir">
                  {rotaSecenekleri.map((r) => (
                    <button key={r} disabled={sira.includes(r)} onClick={() => setSira((s) => [...s, r])}>{r}</button>
                  ))}
                  <span>{sira.join(' → ')}</span>
                  <button onClick={() => gonder({ tur: 'rota', sira })}>Gönder</button>
                  <button onClick={() => setSira([])}>Sıfırla</button>
                </div>
              )}
              {asamaBilgi && (
                <div className="satir">
                  {sayfaAcik ? (
                    <button className="kucuk" onClick={() => setDefterOku((x) => !x)}>
                      {defterOku ? 'Defter sayfasını gizle' : 'Defter sayfasını oku (ücretsiz)'}
                    </button>
                  ) : (
                    <small>Bu konunun defter sayfası sende yok. Konu Modu'nda kazanırsan buradan ücretsiz okuyabilirsin.</small>
                  )}
                </div>
              )}
              {defterOku && asamaBilgi && (
                <div className="defter-sayfa">
                  {DEFTER.find((d) => d.konu === asamaBilgi.defterSayfa)?.metin.split('\n').map((satir, i) => <p key={i}>{satir}</p>)}
                </div>
              )}
              <div className="satir">
                {vaka.ipucuNuri && <button className="kucuk" onClick={() => ipucuIste('Nuran')}>Nuran'a sor ({JETON.ipucu} jeton)</button>}
                {vaka.ipucuAyse && <button className="kucuk" onClick={() => ipucuIste('Fatma')}>Fatma'ya sor ({JETON.ipucu} jeton)</button>}
              </div>
            </div>
          )}
          {mesaj && <div className={'mesaj ' + (mesaj.dogru ? 'dogru' : 'yanlis')}>{mesaj.metin}</div>}
          {sustu && (
            <div className="mesaj yanlis">
              Telsiz sustu.{' '}
              <button className="kucuk" disabled={oyun.jeton < JETON.pilDoldur} onClick={() => oyun.pilDoldur()}>Pili doldur ({JETON.pilDoldur} jeton)</button>
            </div>
          )}
          {asama === 'sonuc' && arama !== null && arama === ARAMA_ASAMALARI.length - 1 && (
            <div className="mesaj dogru">
              {ARAMA_HIKAYE.final.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {asama === 'sonuc' && arama !== null && arama < ARAMA_ASAMALARI.length - 1 && (
            <button onClick={() => aramaBaslat(arama + 1)}>Sonraki sayfa ▶</button>
          )}
          {asama === 'sonuc' && (
            <button
              className={arama !== null && arama < ARAMA_ASAMALARI.length - 1 ? 'kucuk' : ''}
              onClick={arama !== null ? aramaCik : () => { setAsama('sec'); setVaka(null); setKamera('oda') }}
            >
              {arama !== null ? 'Aramadan çık' : 'Vakalara dön'}
            </button>
          )}
        </div>
      )}

      {(panel === 'defter' || panel === 'yanlis') && <DefterKitabi key={panel} yanlisAc={panel === 'yanlis'} kapat={() => setPanel(null)} />}
    </div>
  )
}

function VakaSecici({ onSec, onArama, kapat }: { onSec: (v: Vaka) => void; onArama: () => void; kapat: () => void }) {
  const biten = useOyun((s) => s.bitenVakalar)
  const ilerleme = useOyun((s) => s.aramaIlerleme)
  const zorluklar: Zorluk[] = ['kolay', 'orta', 'zor']
  return (
    <div className="hud panel sol">
      <button className="kucuk kapat" onClick={kapat}>Kapat</button>
      <h3>Konu Defteri</h3>
      <div className="konular">
        {KONULAR.map((k) => (
          <div key={k.id} className="konu">
            <span>{k.ad}</span>
            <span>
              {zorluklar.map((z) => {
                const v = VAKALAR.find((x) => x.konu === k.id && x.zorluk === z)
                return (
                  <button key={z} className={'kucuk' + (v && biten.includes(v.id) ? ' secili' : '')} disabled={!v} onClick={() => v && onSec(v)}>
                    {z}
                  </button>
                )
              })}
            </span>
          </div>
        ))}
      </div>
      <button className="kucuk" onClick={onArama}>Büyük Arama ({ilerleme}/{ARAMA_ASAMALARI.length})</button>    </div>
  )
}

function AramaGiris({ baslat, kapat }: { baslat: (i: number) => void; kapat: () => void }) {
  const { aramaIlerleme, aramaBitti, aramaYenidenBasla } = useOyun()
  const bitti = aramaBitti || aramaIlerleme >= ARAMA_ASAMALARI.length
  return (
    <div className="hud panel orta">
      <button className="kucuk kapat" onClick={kapat}>Kapat</button>
      <h3>{ARAMA_HIKAYE.baslik}</h3>
      {ARAMA_HIKAYE.giris.map((p, i) => <p key={i}>{p}</p>)}
      <p>İlerleme: {Math.min(aramaIlerleme, ARAMA_ASAMALARI.length)}/{ARAMA_ASAMALARI.length} sayfa. Defter sayfalarını Konu Modu'nda kazandıysan Büyük Arama'da ücretsiz ipucu olarak okuyabilirsin.</p>
      <div className="satir">
        {!bitti && <button onClick={() => baslat(aramaIlerleme)}>{aramaIlerleme === 0 ? 'Aramaya başla' : 'Aramaya devam et'}</button>}
        {(aramaIlerleme > 0 || bitti) && (
          <button className="kucuk" onClick={() => { aramaYenidenBasla(); baslat(0) }}>Baştan başla</button>
        )}
      </div>
      {bitti && <p>Deniz bulundu! Dilersen aramayı baştan oynayabilirsin.</p>}
    </div>
  )
}
