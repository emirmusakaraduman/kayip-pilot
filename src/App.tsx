import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AssetModel } from './components/AssetModel'
import { atifSatiri } from './assets/registry'
import { OdaSahnesi } from './scenes/OdaSahnesi'
import { sesBaslat } from './game/audio'
import { YUKSEKLIK_ATIF } from './map/turkey'
import { Sinematik } from './cinematic/Sinematik'
import { useOyun } from './game/store'

function Baslik({ basla, izle }: { basla: () => void; izle: () => void }) {
  const atif = atifSatiri()
  return (
    <div className="baslik">
      <div className="kutu">
        <h1>KAYIP PİLOT</h1>
        <p>TC-KRT düştü. Telsizden gelen ipuçlarıyla Deniz'i bul.</p>
        <div className="satir2">
          <button onClick={basla}>Başla</button>
          <button className="kucuk" onClick={izle}>Girişi izle</button>
        </div>
        <small>İçerik uyarısı: Kurgu bir uçak kazası ve yangın içerir.</small>
        <small className="atif">{atif || 'Varlık atıfları: (henüz varlık eklenmedi)'}</small>
        <small className="atif">{YUKSEKLIK_ATIF}</small>
      </div>
      <Canvas camera={{ position: [6, 3, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 3]} intensity={1.4} />
        <AssetModel varlik="helikopter" position={[0, 1, 0]} />
        <AssetModel varlik="agacCam" position={[-4, 0, -1]} />
        <AssetModel varlik="agacYaprakli" position={[4, 0, -2]} />
        <AssetModel varlik="deniz" position={[2, 0, 3]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#27391f" />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  )
}

type Sahne = 'baslik' | 'giris' | 'izle' | 'oda'

export default function App() {
  const [sahne, setSahne] = useState<Sahne>('baslik')
  const girisIzlendi = useOyun((s) => s.girisIzlendi)
  const girisBitti = useOyun((s) => s.girisBitti)

  // Geliştirme: ?sinema=22 → sinematiği o saniyeden başlatır (yalnızca geliştirme sunucusunda)
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search) : null
  if (dev?.has('sinema') && sahne === 'baslik')
    return <Sinematik baslangic={Number(dev.get('sinema')) || 0} ortam={(dev.get('ortam') as 'akdeniz') || 'karadeniz'} onDone={() => setSahne('oda')} />

  if (sahne === 'baslik')
    return (
      <Baslik
        basla={() => {
          sesBaslat()
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
  return <OdaSahnesi />
}
