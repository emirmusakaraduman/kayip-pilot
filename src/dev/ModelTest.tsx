// Geliştirme sayfası (?modeller): üç GLB'yi yan yana gösterir; ölçü ve duruşu kontrol etmek için.
import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url, x }: { url: string; x: number }) {
  const { scene } = useGLTF(url)
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    const kutu = new THREE.Box3().setFromObject(scene)
    const boyut = kutu.getSize(new THREE.Vector3())
    const orta = kutu.getCenter(new THREE.Vector3())
    const skinli: string[] = []
    scene.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinli.push(o.name) })
    ;(window as unknown as Record<string, unknown>).__modeller = {
      ...((window as unknown as Record<string, Record<string, unknown>>).__modeller ?? {}),
      [url]: { boyut: boyut.toArray().map((v) => +v.toFixed(2)), orta: orta.toArray().map((v) => +v.toFixed(2)), min: kutu.min.toArray().map((v) => +v.toFixed(2)), skinli: skinli.length },
    }
  }, [scene, url])
  return (
    <group position={[x, 0, 0]} ref={ref}>
      <primitive object={scene} />
      <axesHelper args={[2]} />
    </group>
  )
}

export function ModelTest() {
  const yakin = new URLSearchParams(location.search).get('modeller') === 'nuri' // Nuri'ye +x tarafından bak
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: yakin ? [-4.4, 0.7, 0] : [0, 3, 14], fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 6]} intensity={2} />
        <Environment resolution={32}>
          <mesh scale={50}><sphereGeometry /><meshBasicMaterial color="#8899aa" side={THREE.BackSide} /></mesh>
        </Environment>
        <gridHelper args={[40, 40]} />
        <Model url="/models/nuri.glb" x={-6} />
        <Model url="/models/ayse.glb" x={-3} />
        <Model url="/models/helikopter.glb" x={4} />
        <OrbitControls target={yakin ? [-6, 0.4, 0] : [0, 1, 0]} />
      </Canvas>
    </div>
  )
}
