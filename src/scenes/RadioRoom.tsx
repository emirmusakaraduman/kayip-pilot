import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { AssetModel } from '../components/AssetModel'
import { DuvarHaritasi, ReliefMap, type Tiklama } from './ReliefMap'
import type { Bolge } from '../map/turkey'
import { parazit } from '../game/engine'

// ── Ölçüler (birim metre, kamera +z'den bakar) ──────────────────────────────
export const DY = 1.06 // ana masa üst yüzeyi
export const AY = 1.275 // arka masaların üst yüzeyi
const DUVAR_Z = -4
const NURI_X = 0.2
const AYSE_X = 3.7
const ARKA_MASA_Z = -2.9 // arka masaların merkezi

export type Kamera = 'oda' | 'telsiz' | 'harita' | 'nuri' | 'ayse'

export const KAMERALAR: Record<Kamera, { poz: [number, number, number]; bak: [number, number, number]; ad: string }> = {
  oda: { poz: [0.5, 3.0, 6.3], bak: [0.4, 2.2, 0], ad: 'Oda' },
  telsiz: { poz: [0.2, 2.2, 2.3], bak: [0.2, 1.45, -0.95], ad: 'Telsiz' },
  harita: { poz: [0.3, 5.6, 2.9], bak: [0.3, DY, 0.45], ad: 'Harita' },
  nuri: { poz: [-0.6, 2.7, -0.7], bak: [NURI_X, 1.9, -3.5], ad: 'Nuri' },
  ayse: { poz: [2.9, 2.7, -0.7], bak: [AYSE_X, 1.9, -3.5], ad: 'Ayşe' },
}

// ── Yardımcılar ─────────────────────────────────────────────────────────────
const GURULTU = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }`

/** Şimşek: 0..1 arası değer (çift vuruşlu), pencere ve ortam ışığı okur. */
const simsek = { deger: 0, sonraki: 6, basladi: -1 }

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

/** Eşyaların altında yumuşak temas gölgesi lekesi. */
function GolgeLekesi({ poz, w, d, rot = 0, yogunluk = 0.55 }: { poz: [number, number, number]; w: number; d: number; rot?: number; yogunluk?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.5, 'rgba(0,0,0,0.5)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh position={poz} rotation={[-Math.PI / 2, 0, rot]} renderOrder={1}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} transparent opacity={yogunluk} depthWrite={false} />
    </mesh>
  )
}

// ── Kamera: yumuşak geçiş + sürükleyerek bakma + hafif sallanma ─────────────
function KameraKurgusu({ kamera }: { kamera: Kamera }) {
  const { camera, gl } = useThree()
  const bak = useRef(new THREE.Vector3(...KAMERALAR.oda.bak))
  const bakis = useRef({ yaw: 0, pitch: 0, hedefYaw: 0, hedefPitch: 0, surukleme: false, x: 0, y: 0, sonBirakma: 0 })
  useEffect(() => {
    const el = gl.domElement
    const b = bakis.current
    const asagi = (e: PointerEvent) => { b.surukleme = true; b.x = e.clientX; b.y = e.clientY }
    const hareket = (e: PointerEvent) => {
      if (!b.surukleme) return
      b.hedefYaw = Math.max(-0.16, Math.min(0.16, b.hedefYaw - (e.clientX - b.x) * 0.0006))
      b.hedefPitch = Math.max(-0.09, Math.min(0.09, b.hedefPitch - (e.clientY - b.y) * 0.0006))
      b.x = e.clientX
      b.y = e.clientY
    }
    const yukari = () => { b.surukleme = false; b.sonBirakma = performance.now() }
    el.addEventListener('pointerdown', asagi)
    window.addEventListener('pointermove', hareket)
    window.addEventListener('pointerup', yukari)
    return () => {
      el.removeEventListener('pointerdown', asagi)
      window.removeEventListener('pointermove', hareket)
      window.removeEventListener('pointerup', yukari)
    }
  }, [gl])
  useFrame(({ clock }, dt) => {
    const k = KAMERALAR[kamera]
    const b = bakis.current
    if (!b.surukleme && performance.now() - b.sonBirakma > 1500) { b.hedefYaw *= 0.97; b.hedefPitch *= 0.97 } // sürükleme sonrası yavaşça merkeze döner
    b.yaw = THREE.MathUtils.damp(b.yaw, b.hedefYaw, 6, dt)
    b.pitch = THREE.MathUtils.damp(b.pitch, b.hedefPitch, 6, dt)
    const lam = 3
    const t = clock.elapsedTime
    camera.position.x = THREE.MathUtils.damp(camera.position.x, k.poz[0], lam, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, k.poz[1], lam, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, k.poz[2], lam, dt)
    bak.current.x = THREE.MathUtils.damp(bak.current.x, k.bak[0], lam, dt)
    bak.current.y = THREE.MathUtils.damp(bak.current.y, k.bak[1], lam, dt)
    bak.current.z = THREE.MathUtils.damp(bak.current.z, k.bak[2], lam, dt)
    // sürükleme: bakış yönünü kamera çevresinde döndür; hafif sallanma: küçük sinüsler
    const fark = bak.current.clone().sub(camera.position)
    fark.applyAxisAngle(new THREE.Vector3(0, 1, 0), b.yaw + Math.sin(t * 0.37) * 0.004)
    fark.y += Math.tan(b.pitch + Math.sin(t * 0.51) * 0.003) * fark.length()
    camera.lookAt(camera.position.clone().add(fark))
  })
  return null
}

// ── Telsiz ──────────────────────────────────────────────────────────────────
function Telsiz({ satir, pil, ...props }: { satir: string; pil: number } & React.ComponentProps<'group'>) {
  const { canvas, tex, ctx } = useCanvasDoku(512, 256)
  const plaka = useCanvasDoku(128, 40)
  const son = useRef(0)
  const ref = useRef({ satir, pil })
  ref.current = { satir, pil }
  const ledler = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const isik = useRef<THREE.PointLight>(null)

  useEffect(() => {
    const x = plaka.ctx
    x.fillStyle = '#1a1d20'
    x.fillRect(0, 0, 128, 40)
    x.strokeStyle = '#8a9096'
    x.strokeRect(2, 2, 124, 36)
    x.fillStyle = '#d8dde2'
    x.font = 'bold 26px monospace'
    x.textAlign = 'center'
    x.fillText('KS-7', 64, 29)
    plaka.tex.needsUpdate = true
  }, [plaka])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { pil: p } = ref.current
    const par = parazit(p)
    ledler.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = (p / 100) * (i === 2 ? 1.2 + Math.sin(t * 9) * 0.3 : 1.4) * (par > 0 && Math.random() < par * 0.15 ? 0.2 : 1)
    })
    if (isik.current) isik.current.intensity = (0.6 + 0.08 * Math.sin(t * 31)) * (0.4 + p / 160)
    if (t - son.current < 0.12) return
    son.current = t
    const s = ref.current.satir
    ctx.fillStyle = '#031a08'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const sapma = Math.sin(t * 19) * 0.6 // hafif titreme
    ctx.fillStyle = '#4dff7a'
    ctx.font = '22px monospace'
    ctx.fillText(`PİL %${Math.round(p)}`, 16 + sapma, 28)
    // 20 yarım segmentli pil çubuğu
    const dolu = Math.round((p / 100) * 20)
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i < dolu ? '#4dff7a' : 'rgba(77,255,122,0.15)'
      ctx.fillRect(160 + i * 17, 11, 12, 16)
    }
    ctx.fillStyle = '#4dff7a'
    ctx.font = '24px monospace'
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
    satirlar.slice(-5).forEach((l, i) => ctx.fillText(l, 16 + sapma, 70 + i * 32))
    if ((Math.floor(t * 2) & 1) === 0) ctx.fillRect(16, 232, 14, 10)
    ctx.fillStyle = 'rgba(120,255,150,0.25)'
    for (let i = 0; i < par * 40; i++) ctx.fillRect(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 80, 2)
    ctx.fillStyle = 'rgba(0,0,0,0.18)' // ince tarama çizgileri
    for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 512, 1)
    tex.needsUpdate = true
  })

  const metal = '#7d858c'
  return (
    <group {...props} scale={0.97}>
      <RoundedBox args={[1.5, 0.58, 0.6]} radius={0.03} smoothness={3} position={[0, 0.29, 0]}>
        <meshStandardMaterial color={metal} metalness={0.7} roughness={0.45} />
      </RoundedBox>
      <mesh position={[-0.2, 0.3, 0.301]}>
        <planeGeometry args={[1.02, 0.52]} />
        <meshStandardMaterial color="#15181b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.2, 0.3, 0.304]}>
        <planeGeometry args={[0.96, 0.46]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0.5, 0.5, 0.301]}>
        <planeGeometry args={[0.32, 0.1]} />
        <meshStandardMaterial map={plaka.tex} roughness={0.5} metalness={0.4} />
      </mesh>
      {[[-0.7, 0.53], [0.7, 0.53], [-0.7, 0.05], [0.7, 0.05]].map(([sx, sy], i) => (
        <mesh key={i} position={[sx, sy, 0.302]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 8]} />
          <meshStandardMaterial color="#bfc5ca" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}
      {[0.4, 0.62].map((kx, i) => (
        <mesh key={i} position={[kx, 0.24, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.07, 0.06, 18]} />
          <meshStandardMaterial color="#202326" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.42 + i * 0.085, 0.1, 0.305]}>
          <sphereGeometry args={[0.014, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => void (ledler.current[i] = m)}
            color="#222"
            emissive={i === 3 ? '#ff4030' : i === 2 ? '#ffb030' : '#40ff70'}
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.64, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.07, 0.014, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#2b2f33" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.62, 0.95, -0.15]}>
        <cylinderGeometry args={[0.008, 0.012, 0.7, 8]} />
        <meshStandardMaterial color="#b9c0c6" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* ekran ışığı pile bağlı; ayrı bir parlama sprite'ı YOK (radyo üstünde leke yapıyordu) */}
      <pointLight ref={isik} position={[-0.2, 0.32, 0.6]} color="#5dff90" intensity={0.6} distance={2.6} decay={2} />
    </group>
  )
}

// ── Kupa + buhar ────────────────────────────────────────────────────────────
function Buhar(props: React.ComponentProps<'group'>) {
  const mats = useMemo(
    () =>
      [0, 2.7].map(
        (faz) =>
          new THREE.ShaderMaterial({
            uniforms: { uT: { value: 0 }, uFaz: { value: faz } },
            vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: /* glsl */ `
              uniform float uT, uFaz; varying vec2 vUv;
              ${GURULTU}
              void main(){
                float y = vUv.y;
                float dalga = (noise(vec2(y * 3.0 + uFaz, uT * 0.6)) - 0.5) * 0.5 * y + sin(y * 5.0 - uT * 1.4 + uFaz) * 0.06 * y;
                float d = abs(vUv.x - 0.5 - dalga);
                float genislik = mix(0.06, 0.28, y);
                float serit = smoothstep(genislik, 0.0, d);
                float yog = fbm(vec2(vUv.x * 4.0 + uFaz, y * 3.0 - uT * 0.9));
                float a = serit * smoothstep(0.25, 0.75, yog) * smoothstep(1.0, 0.45, y) * smoothstep(0.0, 0.08, y) * 0.32;
                gl_FragColor = vec4(vec3(0.92, 0.94, 0.97), a);
              }`,
            transparent: true,
            depthWrite: false,
          }),
      ),
    [],
  )
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock, camera }) => {
    for (const m of mats) m.uniforms.uT.value = clock.elapsedTime
    ref.current?.children.forEach((m) => m.quaternion.copy(camera.quaternion)) // kameraya dönük şeritler
  })
  return (
    <group {...props} ref={ref}>
      <mesh position={[0, 0.2, 0]} material={mats[0]}>
        <planeGeometry args={[0.14, 0.4]} />
      </mesh>
      <mesh position={[0.012, 0.19, 0.004]} material={mats[1]}>
        <planeGeometry args={[0.12, 0.38]} />
      </mesh>
    </group>
  )
}

function Kupa(props: React.ComponentProps<'group'>) {
  const R = 0.095, H = 0.21 // 19 cm çap, 21 cm yükseklik, dik duvarlı
  return (
    <group {...props}>
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[R, R, H, 40, 1, true]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.18} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[R, R, 0.008, 40]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.2} />
      </mesh>
      <mesh position={[0, H * 0.7, 0]}>
        <cylinderGeometry args={[R + 0.0015, R + 0.0015, 0.014, 40, 1, true]} />
        <meshStandardMaterial color="#b3251f" roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H - 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 0.96, 36]} />
        <meshStandardMaterial color="#6d4326" roughness={0.35} />
      </mesh>
      <mesh position={[0.01, H - 0.027, 0.006]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.058, 24, 1, 0.4, 4.4]} />
        <meshStandardMaterial color="#c9a37a" roughness={0.5} />
      </mesh>
      <mesh position={[R + 0.004, H * 0.52, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.058, 0.0125, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.18} />
      </mesh>
      <Buhar position={[0, H - 0.02, 0]} />
    </group>
  )
}

// ── Jeton kavanozu ──────────────────────────────────────────────────────────
function JetonKavanozu({ jeton, ...props }: { jeton: number } & React.ComponentProps<'group'>) {
  const adet = Math.min(Math.max(jeton, 0), 30)
  const etiket = useCanvasDoku(256, 64)
  useEffect(() => {
    const x = etiket.ctx
    x.clearRect(0, 0, 256, 64)
    x.fillStyle = 'rgba(10,10,10,0.75)'
    x.beginPath()
    x.roundRect(4, 4, 248, 56, 12)
    x.fill()
    x.fillStyle = '#ffd25a'
    x.font = 'bold 32px sans-serif'
    x.textAlign = 'center'
    x.fillText(`${jeton} jeton`, 128, 44)
    etiket.tex.needsUpdate = true
  }, [jeton, etiket])
  const etiketRef = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => etiketRef.current?.quaternion.copy(camera.quaternion))
  return (
    <group {...props}>
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.42, 36, 1, true]} />
        <meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.425, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.025, 36]} />
        <meshStandardMaterial color="#8a6b3d" roughness={0.5} />
      </mesh>
      {Array.from({ length: adet }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.11, 0.015 + Math.floor(i / 4) * 0.022, Math.cos(i * 2.4) * 0.11]} rotation={[(i % 3) * 0.12, i, (i % 5) * 0.1]}>
          <cylinderGeometry args={[0.055, 0.055, 0.018, 18]} />
          <meshStandardMaterial color="#f0b830" metalness={0.9} roughness={0.28} />
        </mesh>
      ))}
      <mesh ref={etiketRef} position={[0, 0.62, 0]}>
        <planeGeometry args={[0.5, 0.125]} />
        <meshBasicMaterial map={etiket.tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Duvar saati: 02:47, saniye kolu tik tak ─────────────────────────────────
function Saat(props: React.ComponentProps<'group'>) {
  const { tex, ctx } = useCanvasDoku(256, 256)
  const sn = useRef(-1)
  useFrame(() => {
    const s = new Date().getSeconds()
    if (s === sn.current) return
    sn.current = s
    ctx.fillStyle = '#e8e0cc'
    ctx.beginPath()
    ctx.arc(128, 128, 126, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.lineWidth = 3
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      ctx.beginPath()
      ctx.moveTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108)
      ctx.lineTo(128 + Math.sin(a) * 120, 128 - Math.cos(a) * 120)
      ctx.stroke()
    }
    const el = (aci: number, uz: number, kalin: number, renk = '#222') => {
      ctx.strokeStyle = renk
      ctx.lineWidth = kalin
      ctx.beginPath()
      ctx.moveTo(128, 128)
      ctx.lineTo(128 + Math.sin(aci) * uz, 128 - Math.cos(aci) * uz)
      ctx.stroke()
    }
    el((2 + 47 / 60) * (Math.PI / 6), 58, 9) // saat kolu: 02:47
    el(47 * (Math.PI / 30), 90, 6) // dakika kolu
    el(s * (Math.PI / 30), 100, 2, '#b22') // saniye kolu: tik tak
    tex.needsUpdate = true
  })
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.04, 32]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <circleGeometry args={[0.3, 40]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}

// ── Pencere: yağmur, hareketli bulutlar, şimşek, perdeler ───────────────────
function Pencere({ x, y }: { x: number; y: number }) {
  const W = 2.5, H = 2.3
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uFlas: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uT, uFlas; varying vec2 vUv;
          ${GURULTU}
          void main(){
            vec2 p = vUv * vec2(2.6, 2.0) + vec2(uT * 0.025, 0.0);
            float c = fbm(p + fbm(p * 1.7 + uT * 0.02));
            vec3 gece = mix(vec3(0.02, 0.035, 0.08), vec3(0.09, 0.12, 0.2), smoothstep(0.3, 0.8, c));
            vec3 flas = mix(vec3(0.5, 0.6, 0.85), vec3(0.95, 0.97, 1.0), smoothstep(0.4, 0.8, c));
            gl_FragColor = vec4(mix(gece, flas, uFlas), 1.0);
          }`,
      }),
    [],
  )
  const yagmur = useRef<THREE.LineSegments>(null)
  const n = 220
  const veri = useMemo(() => {
    const a = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) {
      const px = -W / 2 + 0.05 + Math.random() * (W - 0.1)
      const py = -H / 2 + Math.random() * H
      a.set([px, py, 0.03, px, py - 0.14, 0.03], i * 6)
    }
    return a
  }, [])
  const damla = useRef<THREE.Group>(null)
  const damlalar = useMemo(() => Array.from({ length: 14 }, () => ({ x: (Math.random() - 0.5) * (W - 0.2), y: Math.random() * H - H / 2, hiz: 0.05 + Math.random() * 0.12, bekle: Math.random() * 3 })), [])
  useFrame(({ clock }, dt) => {
    mat.uniforms.uT.value = clock.elapsedTime
    mat.uniforms.uFlas.value = simsek.deger
    const p = yagmur.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (p) {
      for (let i = 0; i < n; i++) {
        let py = p.getY(i * 2) - dt * 2.4
        if (py < -H / 2) py = H / 2
        p.setY(i * 2, py)
        p.setY(i * 2 + 1, py - 0.14)
      }
      p.needsUpdate = true
    }
    damla.current?.children.forEach((m, i) => { // camda süzülen damlalar
      const d = damlalar[i]
      if (d.bekle > 0) { d.bekle -= dt; return }
      d.y -= d.hiz * dt * (1 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.4)
      if (d.y < -H / 2) { d.y = H / 2; d.x = (Math.random() - 0.5) * (W - 0.2); d.bekle = Math.random() * 4 }
      m.position.set(d.x, d.y, 0.04)
    })
  })
  const perdeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.85, 2.7, 16, 1)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 22) * 0.04)
    g.computeVertexNormals()
    return g
  }, [])
  const perdeler = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    perdeler.current?.children.forEach((c, i) => { c.rotation.y = Math.sin(clock.elapsedTime * 0.5 + i * 2) * 0.03 })
  })
  return (
    <group position={[x, y, DUVAR_Z + 0.02]}>
      <mesh position={[0, 0, 0.005]} material={mat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <group ref={damla}>
        {damlalar.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#a9c8f0" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
      {[[0, H / 2 + 0.05, W + 0.2, 0.1], [0, -H / 2 - 0.05, W + 0.3, 0.12], [-W / 2 - 0.05, 0, 0.1, H], [W / 2 + 0.05, 0, 0.1, H], [0, 0, 0.05, H]].map(([bx, by, bw, bh], i) => (
        <mesh key={i} position={[bx, by, 0.04]}>
          <boxGeometry args={[bw, bh, 0.08]} />
          <meshStandardMaterial color="#17191c" roughness={0.6} />
        </mesh>
      ))}
      <group ref={perdeler}>
        <mesh geometry={perdeGeo} position={[-W / 2 - 0.1, 0.1, 0.16]}>
          <meshStandardMaterial color="#6a2b2f" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={perdeGeo} position={[W / 2 + 0.1, 0.1, 0.16]}>
          <meshStandardMaterial color="#6a2b2f" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, H / 2 + 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, W + 0.9, 10]} />
        <meshStandardMaterial color="#2a2118" metalness={0.5} />
      </mesh>
      <lineSegments ref={yagmur}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[veri, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#9cc4e8" transparent opacity={0.55} />
      </lineSegments>
      <pointLight position={[0, 0, 1.2]} color="#7fa0ff" intensity={0.25} distance={5} decay={2} />
    </group>
  )
}

// ── Dağınık kâğıtlar (hafif kıvrık) ─────────────────────────────────────────
function Kagit({ poz, rot, w = 0.3, h = 0.21, renk = '#ece7da' }: { poz: [number, number, number]; rot: number; w?: number; h?: number; renk?: string }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 8, 6)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const nx = p.getX(i) / (w / 2)
      p.setZ(i, 0.012 * nx * nx + 0.006 * Math.sin(p.getY(i) * 18))
    }
    g.computeVertexNormals()
    return g
  }, [w, h])
  return (
    <mesh geometry={geo} position={poz} rotation={[-Math.PI / 2, 0, rot]}>
      <meshStandardMaterial color={renk} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Sarkıt lamba: koni abajur, titreşim, iç içe koni ışık huzmesi ───────────
function SarkitLamba({ x, z, hemi }: { x: number; z: number; hemi: React.RefObject<THREE.HemisphereLight | null> }) {
  const spot = useRef<THREE.SpotLight>(null)
  const ampul = useRef<THREE.MeshStandardMaterial>(null)
  const huzme = useRef<THREE.Group>(null)
  const hedef = useMemo(() => new THREE.Object3D(), [])
  const f = useRef({ t: 0, deger: 1, sonraki: 4 })
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    f.current.t += dt // arada kısa titreşim
    if (f.current.t > f.current.sonraki) { f.current.deger = 0.55 + Math.random() * 0.2; f.current.t = 0; f.current.sonraki = 3 + Math.random() * 7 }
    f.current.deger += (1 - f.current.deger) * Math.min(1, dt * 14)
    const titrek = f.current.deger * (1 + Math.sin(t * 2.3) * 0.015)
    if (spot.current) spot.current.intensity = 120 * titrek
    if (ampul.current) ampul.current.emissiveIntensity = 3.2 * titrek
    huzme.current?.children.forEach((m) => { ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.032 * titrek })
    if (hemi.current) hemi.current.intensity = 1.7 + simsek.deger * 3.0
  })
  const Y = 4.05
  return (
    <group position={[x, 0, z]}>
      <primitive object={hedef} position={[0, DY, 0]} />
      <mesh position={[0, (Y + 6.2) / 2 + 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 6.2 - Y + 0.4, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, Y + 0.28, 0]}>
        <coneGeometry args={[0.62, 0.5, 40, 1, true]} />
        <meshStandardMaterial color="#c9a23a" roughness={0.5} metalness={0.5} side={THREE.DoubleSide} emissive="#5a3b08" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, Y - 0.05, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial ref={ampul} color="#fff2cf" emissive="#ffc46a" emissiveIntensity={3.2} />
      </mesh>
      <spotLight ref={spot} position={[0, Y - 0.1, 0]} target={hedef} angle={0.95} penumbra={0.85} intensity={120} distance={14} decay={2} color="#ffd6a0" />
      <group ref={huzme} position={[0, Y - 1.5, 0]}>
        {[1, 0.78, 0.56].map((s, i) => (
          <mesh key={i} scale={[s, 1, s]} renderOrder={2}>
            <coneGeometry args={[1.7, 3.0, 32, 1, true]} />
            <meshBasicMaterial color="#ffd9a0" transparent opacity={0.032} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ── Havada toz ──────────────────────────────────────────────────────────────
function Toz() {
  const n = 140
  const yuvarlak = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(c)
  }, [])
  const ref = useRef<THREE.Points>(null)
  const veri = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) a.set([(Math.random() - 0.5) * 3.4 + 0.2, 1.2 + Math.random() * 2.8, (Math.random() - 0.5) * 3.0], i * 3)
    return a
  }, [])
  useFrame(({ clock }, dt) => {
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!p) return
    const t = clock.elapsedTime
    for (let i = 0; i < n; i++) {
      p.setX(i, p.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.02)
      let y = p.getY(i) - dt * (0.012 + (i % 5) * 0.004)
      if (y < 1.1) y = 4
      p.setY(i, y)
    }
    p.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[veri, 3]} />
      </bufferGeometry>
      <pointsMaterial map={yuvarlak} color="#ffe2b5" size={0.03} transparent opacity={0.55} alphaTest={0.02} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

// ── Arka masa: dizüstü bilgisayar, yüksek sandalye, karakter, rim ışığı ─────
function ArkaMasa({ x, varlik, ekranRenk }: { x: number; varlik: 'nuri' | 'ayse'; ekranRenk: string }) {
  const ahsap = '#5b4129'
  const ekran = useRef<THREE.MeshStandardMaterial>(null)
  const rimHedef = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => { if (ekran.current) ekran.current.emissiveIntensity = 0.9 + Math.sin(clock.elapsedTime * 3 + x) * 0.06 })
  return (
    <group position={[x, 0, ARKA_MASA_Z]}>
      <RoundedBox args={[2.3, 0.08, 1.0]} radius={0.02} smoothness={3} position={[0, AY - 0.04, 0]}>
        <meshStandardMaterial color="#7a5836" roughness={0.45} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, (AY - 0.08) / 2, 0.47]}>
        <boxGeometry args={[2.2, AY - 0.08, 0.05]} />
        <meshStandardMaterial color={ahsap} roughness={0.8} />
      </mesh>
      {[-1.1, 1.1].map((sx) => (
        <mesh key={sx} position={[sx, (AY - 0.08) / 2, 0]}>
          <boxGeometry args={[0.05, AY - 0.08, 1.0]} />
          <meshStandardMaterial color={ahsap} roughness={0.8} />
        </mesh>
      ))}
      {/* dizüstü bilgisayar (1,25 kat büyütülmüş) */}
      <group position={[0, AY, 0.12]} scale={1.25}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.34, 0.02, 0.24]} />
          <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.021, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 0.1]} />
          <meshStandardMaterial color="#25282b" roughness={0.7} />
        </mesh>
        <group position={[0, 0.02, -0.12]} rotation={[-0.3, 0, 0]}>
          <mesh position={[0, 0.115, 0]}>
            <boxGeometry args={[0.34, 0.23, 0.012]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.115, 0.0068]}>
            <planeGeometry args={[0.31, 0.2]} />
            <meshStandardMaterial ref={ekran} color="#111" emissive={ekranRenk} emissiveIntensity={0.9} />
          </mesh>
        </group>
      </group>
      {/* yüksek sandalye */}
      <mesh position={[0, 0.6, -0.72]}>
        <boxGeometry args={[0.55, 0.06, 0.5]} />
        <meshStandardMaterial color="#1f2328" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.0, -0.98]}>
        <boxGeometry args={[0.55, 0.7, 0.06]} />
        <meshStandardMaterial color="#1f2328" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, -0.72]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <AssetModel varlik={varlik} oturan position={[0, 0, -0.7]} />
      {/* rim ışığı: arkadan-yukarıdan karaktere bakan spot (duvarı aydınlatmaz); yoksa karakterler karanlıkta kaybolur */}
      <primitive object={rimHedef} position={[0, 1.55, -0.7]} />
      {/* ana ışık: önden-yukarıdan yumuşak, yüz ve gövdeyi okutur */}
      <spotLight position={[0.2, 3.3, 1.6]} target={rimHedef} angle={0.28} penumbra={0.9} intensity={26} distance={9} decay={2} color={ekranRenk === '#ffd27a' ? '#ffe2c4' : '#e8efff'} />
      <spotLight position={[-0.75, 3.1, -0.78]} target={rimHedef} angle={0.5} penumbra={0.9} intensity={14} distance={4} decay={2} color="#8fb6ff" />
      <spotLight position={[0.75, 3.1, -0.78]} target={rimHedef} angle={0.5} penumbra={0.9} intensity={9} distance={4} decay={2} color="#ffb880" />
      <GolgeLekesi poz={[0, AY + 0.003, 0.12]} w={0.6} d={0.45} />
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
  const { gl, setDpr } = useThree()
  const hemi = useRef<THREE.HemisphereLight>(null)
  const dolgu = useRef<THREE.AmbientLight>(null)
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.15
  }, [gl])

  // şimşek: aralıklı, çift vuruşlu; oda kısa süre mavi-beyaza döner
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t > simsek.sonraki && simsek.basladi < 0) { simsek.basladi = t; simsek.sonraki = t + 9 + Math.random() * 14 }
    if (simsek.basladi >= 0) {
      const u = t - simsek.basladi
      simsek.deger = u < 0.07 ? u / 0.07 : u < 0.18 ? 1 - (u - 0.07) * 4 : u < 0.27 ? 0.5 + (u - 0.18) * 4 : u < 0.6 ? Math.max(0, 0.9 - (u - 0.27) * 2.8) : 0
      if (u > 0.6) { simsek.basladi = -1; simsek.deger = 0 }
    }
    if (dolgu.current) dolgu.current.intensity = 0.3 + simsek.deger * 1.2
  })

  const masaRenk = '#8a6a44'
  return (
    <>
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#05070c', 12, 26]} />
      <PerformanceMonitor onChange={({ factor }) => setDpr(Math.min(1.75, Math.max(0.8, 0.8 + factor * 0.95)))} />
      <KameraKurgusu kamera={kamera} />

      {/* ışık: lamba ana, ortam çok düşük; ortam yansıması ≤ 0,45 */}
      <ambientLight ref={dolgu} intensity={0.3} color="#7f93b8" />
      <hemisphereLight ref={hemi} args={['#7088b4', '#2a1d14', 1.7]} />
      <SarkitLamba x={0.2} z={0} hemi={hemi} />
      <Environment resolution={64} background={false} environmentIntensity={0.4}>
        <Lightformer form="rect" color="#ffcf8a" intensity={3} position={[0.2, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 3, 1]} />
        <Lightformer form="rect" color="#5f7fb8" intensity={0.6} position={[-6, 3, 1]} scale={[6, 4, 1]} />
        <Lightformer form="rect" color="#59ff8f" intensity={0.5} position={[0.2, 1.4, 2]} scale={[1.2, 0.6, 1]} />
      </Environment>

      {/* oda: zemin, arka duvar + süpürgelik, yan duvarlar, tavan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#2b1f16" roughness={0.75} />
      </mesh>
      <mesh position={[0, 3.1, DUVAR_Z]}>
        <planeGeometry args={[26, 6.2]} />
        <meshStandardMaterial color="#43525e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.11, DUVAR_Z + 0.025]}>
        <boxGeometry args={[26, 0.22, 0.05]} />
        <meshStandardMaterial color="#3d2f26" roughness={0.6} />
      </mesh>
      <mesh position={[-13, 3.1, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6.2]} />
        <meshStandardMaterial color="#1f2830" />
      </mesh>
      <mesh position={[13, 3.1, 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6.2]} />
        <meshStandardMaterial color="#1f2830" />
      </mesh>
      <mesh position={[0, 6.2, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#15191e" />
      </mesh>

      {/* ana masa 11 × 3,3 m, üst yüzey y = 1,06 */}
      <RoundedBox args={[11, 0.12, 3.3]} radius={0.04} smoothness={4} position={[0, DY - 0.06, 0]}>
        <meshStandardMaterial color={masaRenk} roughness={0.38} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0, (DY - 0.12) / 2, 1.58]}>
        <boxGeometry args={[10.8, DY - 0.12, 0.08]} />
        <meshStandardMaterial color="#4a3622" roughness={0.8} />
      </mesh>
      {[-5.3, 5.3].flatMap((lx) => [-1.5, 1.5].map((lz) => (
        <mesh key={`${lx}${lz}`} position={[lx, (DY - 0.12) / 2, lz]}>
          <boxGeometry args={[0.25, DY - 0.12, 0.25]} />
          <meshStandardMaterial color="#4a3622" roughness={0.8} />
        </mesh>
      )))}

      {/* masa üstü */}
      <Telsiz position={[0.2, DY, -0.95]} rotation={[0, 0.12, 0]} satir={satir} pil={pil} />
      <GolgeLekesi poz={[0.2, DY + 0.003, -0.95]} w={1.9} d={0.95} rot={0.12} />
      <ReliefMap position={[0.3, DY + 0.003, 0.62]} genislik={4.56} vurgu={vurgu} onTikla={onHarita} />
      <JetonKavanozu position={[-4.1, DY, 0.3]} jeton={jeton} />
      <GolgeLekesi poz={[-4.1, DY + 0.003, 0.3]} w={0.6} d={0.6} />
      <Kupa position={[-2.8, DY, -0.5]} />
      <GolgeLekesi poz={[-2.8, DY + 0.003, -0.5]} w={0.35} d={0.35} />
      {/* defter: kapalı, deri kaplı, tıklanabilir */}
      <group
        position={[3.9, DY, 0.85]}
        rotation={[0, -0.25, 0]}
        scale={0.92}
        onClick={(e) => { e.stopPropagation(); onDefter() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <RoundedBox args={[0.6, 0.08, 0.44]} radius={0.01} smoothness={3} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#5a2a1f" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0.02, 0.04, 0]}>
          <boxGeometry args={[0.57, 0.06, 0.41]} />
          <meshStandardMaterial color="#e8dfc7" roughness={0.9} />
        </mesh>
        <mesh position={[-0.285, 0.04, 0]}>
          <boxGeometry args={[0.03, 0.085, 0.45]} />
          <meshStandardMaterial color="#3d1a13" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.0815, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 0.09]} />
          <meshStandardMaterial color="#c9a23a" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>
      <GolgeLekesi poz={[3.9, DY + 0.003, 0.85]} w={0.85} d={0.65} rot={-0.25} />
      <Kagit poz={[-1.6, DY + 0.004, -1.05]} rot={0.4} />
      <Kagit poz={[-1.35, DY + 0.008, -0.95]} rot={-0.25} renk="#e4dfd0" />
      <Kagit poz={[2.9, DY + 0.004, -1.2]} rot={-0.6} w={0.34} h={0.24} />
      <Kagit poz={[-3.6, DY + 0.004, -1.1]} rot={0.9} renk="#e9e2cf" />

      {/* arka masalar + karakterler */}
      <ArkaMasa x={NURI_X} varlik="nuri" ekranRenk="#6fb6ff" />
      <ArkaMasa x={AYSE_X} varlik="ayse" ekranRenk="#ffd27a" />

      {/* duvar: harita (Ayşe'nin arkasında), saat, pencere (solda, perdeli) */}
      <DuvarHaritasi position={[AYSE_X, 3.1, DUVAR_Z + 0.04]} genislik={2.2} vurgu={vurgu} />
      <Saat position={[-1.9, 4.1, DUVAR_Z + 0.04]} />
      <Pencere x={-4.8} y={3.2} />

      <Toz />
    </>
  )
}
