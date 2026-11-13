import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AssetModel } from './components/AssetModel'
import { atifSatiri } from './assets/registry'
import { OdaSahnesi } from './scenes/OdaSahnesi'
import { sesBaslat } from './game/audio'

function Baslik({ basla }: { basla: () => void }) {
  const atif = atifSatiri()
  return (
    <div className="baslik">
      <div className="kutu">
        <h1>KAYIP PİLOT</h1>
        <p>TC-KRT düştü. Telsizden gelen ipuçlarıyla Deniz'i bul.</p>
        <button onClick={basla}>Başla</button>
        <small>İçerik uyarısı: Kurgu bir uçak kazası ve yangın içerir.</small>
        <small className="atif">{atif || 'Varlık atıfları: (henüz varlık eklenmedi)'}</small>
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

export default function App() {
  const [basladi, setBasladi] = useState(false)
  if (!basladi) return <Baslik basla={() => { sesBaslat(); setBasladi(true) }} />
  return <OdaSahnesi />
}
