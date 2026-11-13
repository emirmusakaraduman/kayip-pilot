import { useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { OdaSahnesi } from './scenes/OdaSahnesi'
import { odaGecisSesi, sesBaslat } from './game/audio'
import { Sinematik } from './cinematic/Sinematik'
import { ModelTest } from './dev/ModelTest'
import { AnaEkran, type Acilis } from './components/AnaEkran'
import { useOyun } from './game/store'
import { konusmaHazirla } from './game/konusma'
import { muzikSahne } from './game/muzik'

// Sinematikteki modeller ilk kullanımdan önce indirilip çözülsün (ilk geçişteki takılmayı azaltır)
for (const k of ['helikopter', 'nuri', 'ayse']) useGLTF.preload(`/models/${k}.glb`)

/** Ana ekranda gizli, görünmez bir oda iframe'i: odanın betikleri, verisi ve shader'ları önceden ısınır. */
function OdaIsitma() {
  return (
    <iframe
      src="/oda/index.html?kp=bridge&warm=1"
      title=""
      aria-hidden
      tabIndex={-1}
      style={{ position: 'absolute', left: 0, top: 0, width: 960, height: 540, opacity: 0, pointerEvents: 'none', border: 0 }}
    />
  )
}

type Sahne ='baslik' | 'giris' | 'izle' | 'oda'

export default function App() {
  const [sahne, setSahne] = useState<Sahne>('baslik')
  const [odaHazir, setOdaHazir] = useState(false) // oda ve karakterler yerleşti: geçiş karartması ancak şimdi açılır
  const [gecis, setGecis] = useState(false) // sinematikten odaya yumuşak geçiş
  const [acilis, setAcilis] = useState<Acilis>({}) // ana ekrandan seçilen vaka / Büyük Arama
  const girisIzlendi = useOyun((s) => s.girisIzlendi)
  const girisBitti = useOyun((s) => s.girisBitti)

  // Sahneye göre müzik: ana ekranda sakin pad, odada yağmur ve telsiz ortamı, sinematikte sessiz (kendi sesi var)
  useEffect(() => {
    muzikSahne(sahne === 'baslik' ? 'menu' : sahne === 'oda' ? 'oda' : 'yok')
  }, [sahne])

  if (import.meta.env.DEV && new URLSearchParams(location.search).has('modeller')) return <ModelTest />

  // Geliştirme: ?sinema=22 → sinematiği o saniyeden başlatır (yalnızca geliştirme sunucusunda)
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search) : null
  if (dev?.has('sinema') && sahne === 'baslik')
    return <Sinematik baslangic={Number(dev.get('sinema')) || 0} ortam={(dev.get('ortam') as 'akdeniz') || 'karadeniz'} onDone={() => { setGecis(true); odaGecisSesi(); setSahne('oda') }} />

  if (sahne === 'baslik')
    return (
      <>
        <AnaEkran
          basla={(a) => {
            sesBaslat()
            void konusmaHazirla()
            setAcilis(a)
            setSahne(girisIzlendi ? 'oda' : 'giris')
          }}
          izle={() => {
            sesBaslat()
            void konusmaHazirla()
            setSahne('izle')
          }}
        />
        <OdaIsitma />
      </>
    )
  if (sahne === 'giris' || sahne === 'izle')
    return (
      <Sinematik
        onDone={() => {
          girisBitti()
          if (sahne === 'giris') {
            setGecis(true)
            odaGecisSesi()
          }
          setSahne(sahne === 'giris' ? 'oda' : 'baslik')
        }}
      />
    )
  return (
    <>
      <OdaSahnesi giris={gecis} acilis={acilis} anaEkran={() => { setOdaHazir(false); setSahne('baslik') }} onSahneHazir={() => setOdaHazir(true)} />
      {gecis && <div className={'oda-gecis' + (odaHazir ? ' ac' : '')} onAnimationEnd={() => { setGecis(false); setOdaHazir(false) }} />}
    </>
  )
}
