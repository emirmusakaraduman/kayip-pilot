import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AssetModel } from '../components/AssetModel'
import { DuvarHaritasi, ReliefMap, type Tiklama } from './ReliefMap'
import type { Bolge } from '../map/turkey'
import { parazit } from '../game/engine'

export type Kamera = 'genel' | 'telsiz' | 'harita' | 'defter' | 'pencere'

export const KAMERALAR: Record<Kamera, { poz: [number, number, number]; bak: [number, number, number]; ad: string }> = {
  genel: { poz: [0, 1.9, 4.8], bak: [0, 1.2, 0], ad: 'Genel' },
  telsiz: { poz: [-1.9, 1.4, 1.5], bak: [-1.9, 1.1, -0.4], ad: 'Telsiz' },
  harita: { poz: [0.95, 2.9, 1.5], bak: [0.95, 0.8, 0.05], ad: 'Harita' },
  defter: { poz: [-0.8, 1.6, 1.2], bak: [-0.8, 0.8, 0.2], ad: 'Defter' },
  pencere: { poz: [2.4, 1.8, 2.4], bak: [3.2, 1.8, -3], ad: 'Pencere' },
}

function KameraKurgusu({ kamera }: { kamera: Kamera }) {
  const { camera } = useThree()
  const bak = useRef(new THREE.Vector3(...KAMERALAR.genel.bak))
  useFrame((_, dt) => {
    const k = KAMERALAR[kamera]
    const lam = 3
    camera.position.x = THREE.MathUtils.damp(camera.position.x, k.poz[0], lam, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, k.poz[1], lam, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, k.poz[2], lam, dt)
    bak.current.x = THREE.MathUtils.damp(bak.current.x, k.bak[0], lam, dt)
    bak.current.y = THREE.MathUtils.damp(bak.current.y, k.bak[1], lam, dt)
    bak.current.z = THREE.MathUtils.damp(bak.current.z, k.bak[2], lam, dt)
    camera.lookAt(bak.current)
  })
  return null
}

/** Tuvale çizilen doku; sürekli güncellenen canvas dokusu için küçük yardımcı. */
function useCanvasDoku(w: number, h: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas, tex, ctx: canvas.getContext('2d')! }
  }, [w, h])
}

function Telsiz({ satir, pil, ...props }: { satir: string; pil: number } & React.ComponentProps<'group'>) {
  const { canvas, tex, ctx } = useCanvasDoku(512, 256)
  const son = useRef(0)
  const ref = useRef({ satir, pil })
  ref.current = { satir, pil }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - son.current < 0.12) return
    son.current = t
    const { satir: s, pil: p } = ref.current
    const par = parazit(p)
    ctx.fillStyle = '#031a08'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#4dff7a'
    ctx.font = '22px monospace'
    ctx.fillText(`PİL %${Math.round(p)}`, 16, 28)
    ctx.fillRect(150, 12, Math.max(2, (p / 100) * 200), 14)
    ctx.font = '24px monospace'
    // Son ~4 satırı göster
    const kelimeler = s.split(' ')
    const satirlar: string[] = []
    let cur = ''
    for (const k of kelimeler) {
      if ((cur + ' ' + k).length > 30) {
        satirlar.push(cur)
        cur = k
      } else cur = cur ? cur + ' ' + k : k
    }
    if (cur) satirlar.push(cur)
    satirlar.slice(-5).forEach((l, i) => ctx.fillText(l, 16, 70 + i * 32))
    if ((Math.floor(t * 2) & 1) === 0) ctx.fillRect(16, 232, 14, 10) // imleç
    // parazit çizgileri
    ctx.fillStyle = 'rgba(120,255,150,0.25)'
    for (let i = 0; i < par * 40; i++) ctx.fillRect(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 80, 2)
    tex.needsUpdate = true
  })

  return (
    <group {...props}>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[1.5, 0.56, 0.55]} />
        <meshStandardMaterial color="#3b4a32" roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 0.3, 0.2765]}>
        <planeGeometry args={[1.0, 0.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {[0.38, 0.18].map((y, i) => (
        <mesh key={i} position={[0.58, y, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0.6, 0.85, -0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshStandardMaterial color="#999" />
      </mesh>
    </group>
  )
}

function Saat(props: React.ComponentProps<'group'>) {
  const { canvas, tex, ctx } = useCanvasDoku(256, 256)
  const sn = useRef(-1)
  useFrame(() => {
    const d = new Date()
    if (d.getSeconds() === sn.current) return
    sn.current = d.getSeconds()
    ctx.fillStyle = '#e8e0cc'
    ctx.beginPath()
    ctx.arc(128, 128, 126, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 6
    ctx.stroke()
    const el = (aci: number, uz: number, kalin: number) => {
      ctx.lineWidth = kalin
      ctx.beginPath()
      ctx.moveTo(128, 128)
      ctx.lineTo(128 + Math.sin(aci) * uz, 128 - Math.cos(aci) * uz)
      ctx.stroke()
    }
    el(((d.getHours() % 12) + d.getMinutes() / 60) * (Math.PI / 6), 60, 9)
    el((d.getMinutes() + d.getSeconds() / 60) * (Math.PI / 30), 90, 6)
    ctx.strokeStyle = '#b22'
    el(d.getSeconds() * (Math.PI / 30), 100, 2)
    tex.needsUpdate = true
    void canvas
  })
  return (
    <group {...props}>
      <mesh>
        <circleGeometry args={[0.28, 40]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </group>
  )
}

function Yagmur() {
  const n = 160
  const ref = useRef<THREE.LineSegments>(null)
  const veri = useMemo(() => {
    const a = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) {
      const x = 2.2 + Math.random() * 2
      const y = Math.random() * 1.9 + 0.85
      a.set([x, y, -2.88, x, y - 0.12, -2.88], i * 6)
    }
    return a
  }, [])
  useFrame((_, dt) => {
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!p) return
    for (let i = 0; i < n; i++) {
      let y = p.getY(i * 2) - dt * 2.2
      if (y < 0.85) y = 2.75
      p.setY(i * 2, y)
      p.setY(i * 2 + 1, y - 0.12)
    }
    p.needsUpdate = true
  })
  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[veri, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#9cc4e8" transparent opacity={0.6} />
    </lineSegments>
  )
}

function Buhar(props: React.ComponentProps<'group'>) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.3 + i / 4) % 1
      m.position.set(Math.sin(t * 6 + i) * 0.03, t * 0.35, 0)
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.35
      m.scale.setScalar(0.6 + t)
    })
  })
  return (
    <group {...props}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function JetonKavanozu({ jeton, ...props }: { jeton: number } & React.ComponentProps<'group'>) {
  const adet = Math.min(jeton, 24)
  return (
    <group {...props}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 20, 1, true]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: adet }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.07, 0.02 + Math.floor(i / 3) * 0.022, Math.cos(i * 2.4) * 0.07]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 14]} />
          <meshStandardMaterial color="#e0b030" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

function Lamba(props: React.ComponentProps<'group'>) {
  return (
    <group {...props}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.75, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.22, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#d9a441" side={THREE.DoubleSide} emissive="#6b4b10" />
      </mesh>
      <pointLight position={[0, 0.7, 0]} intensity={4} distance={7} color="#ffc780" />
    </group>
  )
}

export function RadioRoom({
  kamera,
  satir,
  pil,
  jeton,
  vurgu,
  onHarita,
  onDefter,
}: {
  kamera: Kamera
  satir: string
  pil: number
  jeton: number
  vurgu: Bolge[]
  onHarita: (t: Tiklama) => void
  onDefter: () => void
}) {
  useEffect(() => {
    document.body.style.cursor = 'default'
  }, [])
  const ahsap = '#4a3320'
  return (
    <>
      <color attach="background" args={['#070b14']} />
      <fog attach="fog" args={['#070b14', 8, 18]} />
      <ambientLight intensity={0.7} color="#7f93b8" />
      <spotLight position={[1, 3.2, 1.2]} target-position={[0.95, 0.8, 0.05]} angle={0.6} penumbra={0.8} intensity={45} color="#ffe2b0" />
      <KameraKurgusu kamera={kamera} />

      {/* oda */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#2b2018" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#2c3a45" />
      </mesh>
      <mesh position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#27333d" />
      </mesh>
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#27333d" />
      </mesh>

      {/* masa */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[5.8, 0.08, 1.5]} />
        <meshStandardMaterial color={ahsap} roughness={0.6} />
      </mesh>
      {[-2.7, 2.7].flatMap((x) => [-0.65, 0.65].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]}>
          <boxGeometry args={[0.1, 0.72, 0.1]} />
          <meshStandardMaterial color={ahsap} />
        </mesh>
      )))}

      {/* masa üstü */}
      <Telsiz position={[-1.9, 0.76, -0.4]} satir={satir} pil={pil} />
      <group position={[-0.8, 0.77, 0.25]} onClick={onDefter}>
        <mesh>
          <boxGeometry args={[0.55, 0.05, 0.4]} />
          <meshStandardMaterial color="#7a2f2a" />
        </mesh>
        <mesh position={[0.02, 0.03, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.36]} />
          <meshStandardMaterial color="#efe6cf" />
        </mesh>
      </group>
      <ReliefMap position={[0.95, 0.77, 0.05]} genislik={2.1} vurgu={vurgu} onTikla={onHarita} />
      <JetonKavanozu position={[2.35, 0.76, 0.4]} jeton={jeton} />
      <group position={[-0.85, 0.76, -0.45]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.12, 14]} />
          <meshStandardMaterial color="#c9c4b8" />
        </mesh>
        <Buhar position={[0, 0.14, 0]} />
      </group>
      <Lamba position={[2.3, 0.76, -0.5]} />

      {/* duvar */}
      <DuvarHaritasi position={[-1.2, 2.3, -2.96]} genislik={3} vurgu={vurgu} />
      <Saat position={[1.2, 3.1, -2.97]} />
      <mesh position={[3.2, 1.8, -2.97]}>
        <planeGeometry args={[2.2, 1.9]} />
        <meshBasicMaterial color="#0c1830" />
      </mesh>
      {[[3.2, 2.78, 2.3, 0.08], [3.2, 0.82, 2.3, 0.08], [2.08, 1.8, 0.08, 2], [4.32, 1.8, 0.08, 2], [3.2, 1.8, 0.05, 1.9]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -2.94]}>
          <boxGeometry args={[w, h, 0.06]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      <Yagmur />

      {/* karakterler (yer tutucu veya GLB) */}
      <AssetModel varlik="nuri" position={[-3.5, 0, 0.2]} rotation={[0, 0.5, 0]} />
      <AssetModel varlik="ayse" position={[3.6, 0, 0.3]} rotation={[0, -0.5, 0]} />
    </>
  )
}
