import { useState } from 'react'
import { OdaSahnesi } from './scenes/OdaSahnesi'
import { sesBaslat } from './game/audio'
import { Sinematik } from './cinematic/Sinematik'
import { ModelTest } from './dev/ModelTest'
import { AnaEkran, type Acilis } from './components/AnaEkran'
import { useOyun } from './game/store'

type Sahne = 'baslik' | 'giris' | 'izle' | 'oda'

export default function App() {
  const [sahne, setSahne] = useState<Sahne>('baslik')
  const [acilis, setAcilis] = useState<Acilis>({}) // ana ekrandan seçilen vaka / Büyük Arama
  const girisIzlendi = useOyun((s) => s.girisIzlendi)
  const girisBitti = useOyun((s) => s.girisBitti)

  if (import.meta.env.DEV && new URLSearchParams(location.search).has('modeller')) return <ModelTest />

  // Geliştirme: ?sinema=22 → sinematiği o saniyeden başlatır (yalnızca geliştirme sunucusunda)
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search) : null
  if (dev?.has('sinema') && sahne === 'baslik')
    return <Sinematik baslangic={Number(dev.get('sinema')) || 0} ortam={(dev.get('ortam') as 'akdeniz') || 'karadeniz'} onDone={() => setSahne('oda')} />

  if (sahne === 'baslik')
    return (
      <AnaEkran
        basla={(a) => {
          sesBaslat()
          setAcilis(a)
          setSahne(girisIzlendi ? 'oda' : 'giris')
        }}
        izle={() => {
          sesBaslat()
          setSahne('izle')
        }}
      />
    )
  if (sahne === 'giris' || sahne === 'izle')
    return (
      <Sinematik
        onDone={() => {
          girisBitti()
          setSahne(sahne === 'giris' ? 'oda' : 'baslik')
        }}
      />
    )
  return <OdaSahnesi acilis={acilis} anaEkran={() => setSahne('baslik')} />
}
