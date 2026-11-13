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
const ARKA_MASA_Z = -2.9
const LAMBA_X = 1.7
const HARITA_X = 1.6
const TELSIZ_X = -1.95

export type Kamera = 'oda' | 'telsiz' | 'harita' | 'nuri' | 'ayse'

export const KAMERALAR: Record<Kamera, { poz: [number, number, number]; bak: [number, number, number]; ad: string }> = {
  oda: { poz: [0.45, 2.2, 6.2], bak: [0.45, 2.4, -3.6], ad: 'Oda' },
  telsiz: { poz: [-1.3, 2.1, 2.7], bak: [-2.4, 1.55, -0.5], ad: 'Telsiz' },
  harita: { poz: [1.6, 5.2, 2.7], bak: [1.6, DY, 0.5], ad: 'Harita' },
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

/** Şimşek: 0..1 arası değer (çift vuruşlu); pencere ve ortam ışığı okur. */
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

/** Koyu, çizgili (tahta lifleri) ahşap dokusu; masa ve zemin için. */
function tahtaDoku(taban: string, acik: string, tekrarX: number, tekrarY: number, tahtaSayisi = 8) {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const x = c.getContext('2d')!
  x.fillStyle = taban
  x.fillRect(0, 0, 1024, 1024)
  let a = 7
  const r = () => ((a = (a * 16807) % 2147483647) / 2147483647)
  const h = 1024 / tahtaSayisi
  for (let t = 0; t < tahtaSayisi; t++) {
    x.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.05})`
    x.fillRect(0, t * h, 1024, h)
    for (let i = 0; i < 40; i++) { // lifler: ince yatay çizgiler
      x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.1 + r() * 0.25})` : `${acik}${Math.floor(10 + r() * 30).toString(16).padStart(2, '0')}`
      x.fillRect(r() * 300, t * h + r() * h, 300 + r() * 724, 1 + r() * 2)
    }
    x.fillStyle = 'rgba(0,0,0,0.65)' // tahta derzi
    x.fillRect(0, t * h, 1024, 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(tekrarX, tekrarY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function yumusakDaire(boyut = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = boyut
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(boyut / 2, boyut / 2, 0, boyut / 2, boyut / 2, boyut / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, boyut, boyut)
  return new THREE.CanvasTexture(c)
}

/** Eşyaların altında yumuşak temas gölgesi lekesi. */
function GolgeLekesi({ poz, w, d, rot = 0, yogunluk = 0.6 }: { poz: [number, number, number]; w: number; d: number; rot?: number; yogunluk?: number }) {
  const tex = useMemo(() => yumusakDaire(128), [])
  return (
    <mesh position={poz} rotation={[-Math.PI / 2, 0, rot]} renderOrder={1}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} color="#000" transparent opacity={yogunluk} depthWrite={false} />
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
    const fark = bak.current.clone().sub(camera.position)
    fark.applyAxisAngle(new THREE.Vector3(0, 1, 0), b.yaw + Math.sin(t * 0.37) * 0.004)
    fark.y += Math.tan(b.pitch + Math.sin(t * 0.51) * 0.003) * fark.length()
    camera.lookAt(camera.position.clone().add(fark))
  })
  return null
}

// ── Telsiz KS-7: sol uçta, büyük, yeşil-gri metal ───────────────────────────
function Telsiz({ satir, pil, ...props }: { satir: string; pil: number } & React.ComponentProps<'group'>) {
  const ekran = useCanvasDoku(640, 320)
  const pilEkrani = useCanvasDoku(256, 64)
  const plaka = useCanvasDoku(384, 96)
  const son = useRef(0)
  const ref = useRef({ satir, pil })
  ref.current = { satir, pil }
  const ledler = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const kucukLed = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const isik = useRef<THREE.PointLight>(null)
  const isikTex = useMemo(() => yumusakDaire(64), [])
  const onIsikHedef = useMemo(() => new THREE.Object3D(), []) // telsize bakan ön ışığın hedefi
  const fenerRef = useRef<THREE.Sprite>(null)

  useEffect(() => {
    const x = plaka.ctx
    x.fillStyle = '#c9d2c8'
    x.fillRect(0, 0, 384, 96)
    x.strokeStyle = '#37403a'
    x.lineWidth = 6
    x.strokeRect(3, 3, 378, 90)
    x.fillStyle = '#20261f'
    x.font = 'bold 54px "Barlow Condensed", "Arial Narrow", sans-serif'
    x.textAlign = 'center'
    x.fillText('KS-7 TELSİZ', 192, 66)
    plaka.tex.needsUpdate = true
  }, [plaka])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { pil: p } = ref.current
    const par = parazit(p)
    // üst LED sırası: pil yüzdesi kadar yanar; parazitte titrer
    ledler.current.forEach((m, i) => {
      if (!m) return
      const yanik = i < Math.ceil(p / 10)
      m.emissiveIntensity = yanik ? (1.1 + Math.sin(t * 5 + i) * 0.08) * (par > 0 && Math.random() < par * 0.12 ? 0.25 : 1) : 0.04
    })
    kucukLed.current.forEach((m, i) => { if (m) m.emissiveIntensity = (p / 100) * (i === 1 ? 1.2 + Math.sin(t * 8) * 0.4 : 1.4) })
    if (isik.current) isik.current.intensity = (1.1 + 0.1 * Math.sin(t * 31)) * (0.4 + p / 160)
    if (fenerRef.current) (fenerRef.current.material as THREE.SpriteMaterial).opacity = 0.55 + 0.4 * Math.max(0, Math.sin(t * 2.2)) // anten ucundaki kırmızı uyarı ışığı
    if (t - son.current < 0.1) return
    son.current = t
    const { satir: s } = ref.current
    // yeşil ekran
    const x = ekran.ctx
    x.fillStyle = '#021208'
    x.fillRect(0, 0, 640, 320)
    const sapma = Math.sin(t * 19) * 0.7
    x.fillStyle = '#6dff9a'
    x.font = '600 29px "Cascadia Mono", Consolas, monospace'
    const kelimeler = s.split(' ')
    const satirlar: string[] = []
    let cur = ''
    for (const k of kelimeler) {
      if ((cur + ' ' + k).length > 31) { satirlar.push(cur); cur = k } else cur = cur ? cur + ' ' + k : k
    }
    if (cur) satirlar.push(cur)
    const gor = satirlar.slice(-6)
    gor.forEach((l, i) => x.fillText(l, 24 + sapma, 56 + i * 42))
    // sondaki imleç: parazit varsa kırmızı blok ve "cızır"
    const imlecY = 56 + (gor.length - 1) * 42
    const sonG = x.measureText(gor[gor.length - 1] ?? '').width
    if ((Math.floor(t * 2) & 1) === 0 || par > 0.05) {
      x.fillStyle = par > 0.05 || Math.random() < 0.04 ? '#ff4a4a' : '#6dff9a'
      x.fillRect(24 + sonG + 10, imlecY - 24, 34, 30)
    }
    if (par > 0.05) { x.fillStyle = '#ff4a4a'; x.fillText('cızır', 24 + sonG + 56, imlecY) }
    x.fillStyle = 'rgba(120,255,160,0.22)'
    for (let i = 0; i < par * 50; i++) x.fillRect(Math.random() * 640, Math.random() * 320, 20 + Math.random() * 90, 2)
    x.fillStyle = 'rgba(0,0,0,0.2)'
    for (let y = 0; y < 320; y += 4) x.fillRect(0, y, 640, 1)
    ekran.tex.needsUpdate = true
    // amber PİL ekranı
    const q = pilEkrani.ctx
    q.fillStyle = '#120a02'
    q.fillRect(0, 0, 256, 64)
    q.fillStyle = '#ffb347'
    q.font = '700 40px "Barlow Condensed", "Arial Narrow", sans-serif'
    q.textAlign = 'center'
    q.fillText(`PİL %${Math.round(p)}`, 128, 46)
    pilEkrani.tex.needsUpdate = true
  })

  const govde = '#7f9887'
  const parlak = '#97ab9d'
  return (
    <group {...props}>
      {/* gövde */}
      <RoundedBox args={[2.5, 1.05, 0.9]} radius={0.04} smoothness={3} position={[0, 0.525, 0]}>
        <meshStandardMaterial color={govde} metalness={0.55} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 1.07, 0]}>
        <boxGeometry args={[2.56, 0.05, 0.96]} />
        <meshStandardMaterial color={parlak} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* tutamaç */}
      <mesh position={[0, 1.1, 0.0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.28, 0.035, 10, 28, Math.PI]} />
        <meshStandardMaterial color="#2a302c" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* üst LED sırası */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-1.05 + i * 0.21, 0.9, 0.452]}>
          <boxGeometry args={[0.17, 0.1, 0.02]} />
          <meshStandardMaterial ref={(m) => void (ledler.current[i] = m)} color="#8a4a44" emissive="#ff9d90" emissiveIntensity={1.1} />
        </mesh>
      ))}
      {/* PİL ekranı */}
      <mesh position={[0.93, 0.9, 0.456]}>
        <planeGeometry args={[0.52, 0.14]} />
        <meshBasicMaterial map={pilEkrani.tex} toneMapped={false} />
      </mesh>
      {/* ana ekran: çerçeve + yazı */}
      <mesh position={[-0.12, 0.5, 0.452]}>
        <planeGeometry args={[1.82, 0.82]} />
        <meshStandardMaterial color="#10150f" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-0.12, 0.5, 0.455]}>
        <planeGeometry args={[1.68, 0.7]} />
        <meshBasicMaterial map={ekran.tex} toneMapped={false} />
      </mesh>
      {/* KS-7 TELSİZ plakası */}
      <mesh position={[-0.12, 0.1, 0.452]}>
        <planeGeometry args={[0.62, 0.155]} />
        <meshStandardMaterial map={plaka.tex} roughness={0.55} metalness={0.2} />
      </mesh>
      {/* iki büyük düğme */}
      {[-0.95, -0.55].map((kx, i) => (
        <group key={i} position={[kx, 0.14, 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.145, 0.1, 28]} />
            <meshStandardMaterial color="#1d211e" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.05, 0.05, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
            <meshStandardMaterial color="#d8ddd8" emissive="#fff" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
      {/* havalandırma ızgarası */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.88, 0.2 + i * 0.045, 0.451]}>
          <boxGeometry args={[0.38, 0.018, 0.012]} />
          <meshStandardMaterial color="#0e120f" />
        </mesh>
      ))}
      {/* yan küçük ışıklar */}
      {[[-1.18, 0.22, '#ffffff'], [-1.18, 0.1, '#ffa040']].map(([lx, ly, renk], i) => (
        <mesh key={i} position={[lx as number, ly as number, 0.452]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial ref={(m) => void (kucukLed.current[i] = m)} color="#222" emissive={renk as string} emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* anten + kırmızı uyarı ışığı (parlama yalnızca antenin ucunda; ekranın üstünde değil) */}
      <mesh position={[0.95, 2.1, -0.3]}>
        <cylinderGeometry args={[0.012, 0.018, 2.1, 8]} />
        <meshStandardMaterial color="#9aa2a8" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.95, 3.18, -0.3]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#401010" emissive="#ff3030" emissiveIntensity={2.2} />
      </mesh>
      <sprite ref={fenerRef} position={[0.95, 3.18, -0.3]} scale={[0.75, 0.75, 1]}>
        <spriteMaterial map={isikTex} color="#ff3a3a" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight ref={isik} position={[-0.12, 0.5, 1.0]} color="#5dff90" intensity={0.45} distance={2.4} decay={2} />
      <primitive object={onIsikHedef} position={[0, 0.5, 0.3]} />
      <spotLight position={[0.6, 2.6, 2.6]} target={onIsikHedef} angle={0.7} penumbra={0.9} intensity={14} distance={7} decay={2} color="#ffe9d2" />
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
                float a = serit * smoothstep(0.25, 0.75, yog) * smoothstep(1.0, 0.45, y) * smoothstep(0.0, 0.08, y) * 0.4;
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
    ref.current?.children.forEach((m) => m.quaternion.copy(camera.quaternion))
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
        <meshStandardMaterial color="#f6f4ee" roughness={0.16} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[R, R, 0.008, 40]} />
        <meshStandardMaterial color="#f6f4ee" roughness={0.2} />
      </mesh>
      <mesh position={[0, H * 0.7, 0]}>
        <cylinderGeometry args={[R + 0.0015, R + 0.0015, 0.014, 40, 1, true]} />
        <meshStandardMaterial color="#b3251f" roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H - 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 0.96, 36]} />
        <meshStandardMaterial color="#3a2012" roughness={0.3} />
      </mesh>
      <mesh position={[0.01, H - 0.027, 0.006]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.058, 24, 1, 0.4, 4.4]} />
        <meshStandardMaterial color="#b88f66" roughness={0.5} />
      </mesh>
      <mesh position={[R + 0.004, H * 0.52, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.058, 0.0125, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#f6f4ee" roughness={0.16} />
      </mesh>
      <Buhar position={[0, H - 0.02, 0]} />
    </group>
  )
}

// ── Jeton kavanozu: cam, siyah kapak, kâğıt etiket ──────────────────────────
function JetonKavanozu({ jeton, ...props }: { jeton: number } & React.ComponentProps<'group'>) {
  const adet = Math.min(Math.max(jeton, 0), 30)
  const etiket = useCanvasDoku(256, 96)
  useEffect(() => {
    const x = etiket.ctx
    x.fillStyle = '#ece6d4'
    x.fillRect(0, 0, 256, 96)
    x.strokeStyle = '#3a3226'
    x.lineWidth = 4
    x.strokeRect(2, 2, 252, 92)
    x.fillStyle = '#2a241a'
    x.font = 'bold 46px "Barlow Condensed", "Arial Narrow", sans-serif'
    x.textAlign = 'center'
    x.fillText(`${jeton} jeton`, 128, 64)
    etiket.tex.needsUpdate = true
  }, [jeton, etiket])
  return (
    <group {...props}>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.48, 40, 1, true]} />
        <meshPhysicalMaterial color="#d4ecff" transparent opacity={0.2} roughness={0.04} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.07, 40]} />
        <meshStandardMaterial color="#141516" roughness={0.5} metalness={0.3} />
      </mesh>
      {Array.from({ length: adet }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.12, 0.015 + Math.floor(i / 4) * 0.022, Math.cos(i * 2.4) * 0.12]} rotation={[(i % 3) * 0.12, i, (i % 5) * 0.1]}>
          <cylinderGeometry args={[0.055, 0.055, 0.018, 18]} />
          <meshStandardMaterial color="#e8b028" metalness={0.9} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0.243]}>
        <planeGeometry args={[0.3, 0.113]} />
        <meshStandardMaterial map={etiket.tex} roughness={0.9} />
      </mesh>
    </group>
  )
}

// ── Defter (kapalı, tıklanabilir) ───────────────────────────────────────────
function DefterObjesi({ onDefter, ...props }: { onDefter: () => void } & React.ComponentProps<'group'>) {
  return (
    <group
      {...props}
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
  )
}

/** Yeşil kapaklı spiralsiz not defteri + kalem (masa üstü dekoru). */
function NotDefteri(props: React.ComponentProps<'group'>) {
  return (
    <group {...props}>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.62, 0.024, 0.44]} />
        <meshStandardMaterial color="#7d8a6c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <boxGeometry args={[0.58, 0.008, 0.4]} />
        <meshStandardMaterial color="#e8e2cf" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.038, 0.03]} rotation={[0, 0.2, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.28, 8]} />
        <meshStandardMaterial color="#202020" roughness={0.4} />
      </mesh>
    </group>
  )
}

// ── Duvar saati ─────────────────────────────────────────────────────────────
function Saat(props: React.ComponentProps<'group'>) {
  const { tex, ctx } = useCanvasDoku(256, 256)
  const sn = useRef(-1)
  useFrame(() => {
    const s = new Date().getSeconds()
    if (s === sn.current) return
    sn.current = s
    ctx.fillStyle = '#e6dcc4'
    ctx.beginPath()
    ctx.arc(128, 128, 126, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1c1a16'
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.lineWidth = 4
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      ctx.beginPath()
      ctx.moveTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104)
      ctx.lineTo(128 + Math.sin(a) * 120, 128 - Math.cos(a) * 120)
      ctx.stroke()
    }
    const el = (aci: number, uz: number, kalin: number, renk = '#1c1a16') => {
      ctx.strokeStyle = renk
      ctx.lineWidth = kalin
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(128, 128)
      ctx.lineTo(128 + Math.sin(aci) * uz, 128 - Math.cos(aci) * uz)
      ctx.stroke()
    }
    el((2 + 47 / 60) * (Math.PI / 6), 58, 10) // 02:47
    el(47 * (Math.PI / 30), 92, 6)
    el(s * (Math.PI / 30), 104, 2, '#a02020') // tik tak
    tex.needsUpdate = true
  })
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.05, 36]} />
        <meshStandardMaterial color="#1c1a16" />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <circleGeometry args={[0.31, 44]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.14} />
      </mesh>
    </group>
  )
}

// ── Pencere: telsizin arkasında; yağmur, koyu bulutlar, şimşek ──────────────
function Pencere({ x, y }: { x: number; y: number }) {
  const W = 2.7, H = 1.8
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uFlas: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uT, uFlas; varying vec2 vUv;
          ${GURULTU}
          void main(){
            vec2 p = vUv * vec2(3.2, 2.2) + vec2(uT * 0.03, 0.0);
            float c = fbm(p + fbm(p * 1.7 + uT * 0.02));
            vec3 gece = mix(vec3(0.045, 0.05, 0.06), vec3(0.2, 0.22, 0.25), smoothstep(0.3, 0.85, c));
            vec3 flas = mix(vec3(0.5, 0.6, 0.85), vec3(0.95, 0.97, 1.0), smoothstep(0.4, 0.8, c));
            gl_FragColor = vec4(mix(gece, flas, uFlas), 1.0);
          }`,
      }),
    [],
  )
  const yagmur = useRef<THREE.LineSegments>(null)
  const n = 260
  const veri = useMemo(() => {
    const a = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) {
      const px = -W / 2 + 0.05 + Math.random() * (W - 0.1)
      const py = -H / 2 + Math.random() * H
      a.set([px, py, 0.03, px - 0.01, py - 0.16, 0.03], i * 6)
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
        let py = p.getY(i * 2) - dt * 2.6
        if (py < -H / 2) py = H / 2
        p.setY(i * 2, py)
        p.setY(i * 2 + 1, py - 0.16)
      }
      p.needsUpdate = true
    }
    damla.current?.children.forEach((m, i) => {
      const d = damlalar[i]
      if (d.bekle > 0) { d.bekle -= dt; return }
      d.y -= d.hiz * dt * (1 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.4)
      if (d.y < -H / 2) { d.y = H / 2; d.x = (Math.random() - 0.5) * (W - 0.2); d.bekle = Math.random() * 4 }
      m.position.set(d.x, d.y, 0.04)
    })
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
            <meshBasicMaterial color="#b9d3f4" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
      {/* çerçeve: 2×2 cam bölmesi */}
      {[[0, H / 2 + 0.05, W + 0.2, 0.1], [0, -H / 2 - 0.05, W + 0.3, 0.12], [-W / 2 - 0.05, 0, 0.1, H], [W / 2 + 0.05, 0, 0.1, H], [0, 0, 0.06, H], [0, 0, W, 0.06]].map(([bx, by, bw, bh], i) => (
        <mesh key={i} position={[bx, by, 0.04]}>
          <boxGeometry args={[bw, bh, 0.08]} />
          <meshStandardMaterial color="#15171a" roughness={0.6} />
        </mesh>
      ))}
      <lineSegments ref={yagmur}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[veri, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#c4daf5" transparent opacity={0.6} />
      </lineSegments>
      <pointLight position={[0, 0, 1.2]} color="#7fa0ff" intensity={0.3} distance={5} decay={2} />
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

// ── Sarkıt lamba: siyah koni abajur, parlak ampul + hale, ışık huzmesi ──────
function SarkitLamba({ x, z, hemi }: { x: number; z: number; hemi: React.RefObject<THREE.HemisphereLight | null> }) {
  const spot = useRef<THREE.SpotLight>(null)
  const ampul = useRef<THREE.MeshStandardMaterial>(null)
  const huzme = useRef<THREE.Group>(null)
  const haleRef = useRef<THREE.Sprite>(null)
  const hale = useMemo(() => yumusakDaire(256), [])
  const hedef = useMemo(() => new THREE.Object3D(), [])
  const f = useRef({ t: 0, deger: 1, sonraki: 4 })
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    f.current.t += dt
    if (f.current.t > f.current.sonraki) { f.current.deger = 0.55 + Math.random() * 0.2; f.current.t = 0; f.current.sonraki = 3 + Math.random() * 7 }
    f.current.deger += (1 - f.current.deger) * Math.min(1, dt * 14)
    const titrek = f.current.deger * (1 + Math.sin(t * 2.3) * 0.015)
    if (spot.current) spot.current.intensity = 52 * titrek
    if (ampul.current) ampul.current.emissiveIntensity = 3.4 * titrek
    if (haleRef.current) (haleRef.current.material as THREE.SpriteMaterial).opacity = 0.62 * titrek
    huzme.current?.children.forEach((m) => { ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.04 * titrek })
    if (hemi.current) hemi.current.intensity = 1.0 + simsek.deger * 3.0
  })
  const Y = 3.45
  return (
    <group position={[x, 0, z]}>
      <primitive object={hedef} position={[0, DY, 0.5]} />
      <mesh position={[0, (Y + 6.2) / 2 + 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 6.2 - Y + 0.4, 6]} />
        <meshStandardMaterial color="#0c0c0c" />
      </mesh>
      <mesh position={[0, Y + 0.3, 0]}>
        <coneGeometry args={[0.58, 0.5, 44, 1, true]} />
        <meshStandardMaterial color="#17181a" roughness={0.55} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, Y - 0.04, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial ref={ampul} color="#fff6e2" emissive="#ffd9a0" emissiveIntensity={3.4} />
      </mesh>
      <sprite ref={haleRef} position={[0, Y - 0.04, 0]} scale={[2.6, 2.6, 1]}>
        <spriteMaterial map={hale} color="#ffe4b8" transparent opacity={0.62} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <spotLight ref={spot} position={[0, Y - 0.1, 0]} target={hedef} angle={0.9} penumbra={0.9} intensity={52} distance={14} decay={2} color="#ffd9a8" />
      <group ref={huzme} position={[0, Y - 1.4, 0]}>
        {[1, 0.78, 0.56].map((s, i) => (
          <mesh key={i} scale={[s, 1, s]} renderOrder={2}>
            <coneGeometry args={[1.9, 2.8, 32, 1, true]} />
            <meshBasicMaterial color="#ffdcae" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ── Havada toz: lamba konisinde süzülen yumuşak noktalar ────────────────────
function Toz() {
  const n = 170
  const ref = useRef<THREE.Points>(null)
  const yuvarlak = useMemo(() => yumusakDaire(32), [])
  const veri = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) a.set([(Math.random() - 0.5) * 5.2 + LAMBA_X, 1.2 + Math.random() * 2.8, (Math.random() - 0.5) * 4.4], i * 3)
    return a
  }, [])
  useFrame(({ clock }, dt) => {
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!p) return
    const t = clock.elapsedTime
    for (let i = 0; i < n; i++) {
      p.setX(i, p.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.03)
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
      <pointsMaterial map={yuvarlak} color="#fff0d6" size={0.045} transparent opacity={0.7} alphaTest={0.02} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

// ── Arka masa: dizüstü bilgisayar, yüksek sandalye, karakter, ışıklar ───────
function ArkaMasa({ x, varlik, ekranRenk, tahta }: { x: number; varlik: 'nuri' | 'ayse'; ekranRenk: string; tahta: THREE.Texture }) {
  const ekran = useRef<THREE.MeshStandardMaterial>(null)
  const rimHedef = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => { if (ekran.current) ekran.current.emissiveIntensity = 0.7 + Math.sin(clock.elapsedTime * 3 + x) * 0.05 })
  return (
    <group position={[x, 0, ARKA_MASA_Z]}>
      <RoundedBox args={[2.3, 0.08, 1.0]} radius={0.02} smoothness={3} position={[0, AY - 0.04, 0]}>
        <meshStandardMaterial map={tahta} color="#d9c0a0" roughness={0.5} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, (AY - 0.08) / 2, 0.47]}>
        <boxGeometry args={[2.2, AY - 0.08, 0.05]} />
        <meshStandardMaterial color="#2a2018" roughness={0.85} />
      </mesh>
      {[-1.1, 1.1].map((sx) => (
        <mesh key={sx} position={[sx, (AY - 0.08) / 2, 0]}>
          <boxGeometry args={[0.05, AY - 0.08, 1.0]} />
          <meshStandardMaterial color="#2a2018" roughness={0.85} />
        </mesh>
      ))}
      {/* siyah dizüstü bilgisayar (1,25 kat büyütülmüş) */}
      <group position={[0, AY, 0.12]} scale={1.25}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.34, 0.02, 0.24]} />
          <meshStandardMaterial color="#121314" metalness={0.7} roughness={0.35} />
        </mesh>
        <group position={[0, 0.02, -0.12]} rotation={[-0.3, 0, 0]}>
          <mesh position={[0, 0.115, 0]}>
            <boxGeometry args={[0.34, 0.23, 0.012]} />
            <meshStandardMaterial color="#121314" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.115, -0.0068]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial ref={ekran} color="#111" emissive={ekranRenk} emissiveIntensity={0.7} />
          </mesh>
        </group>
      </group>
      {/* yüksek sandalye (gri) */}
      <mesh position={[0, 0.6, -0.72]}>
        <boxGeometry args={[0.55, 0.06, 0.5]} />
        <meshStandardMaterial color="#3a3f45" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.0, -0.98]}>
        <boxGeometry args={[0.55, 0.7, 0.06]} />
        <meshStandardMaterial color="#3a3f45" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, -0.72]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <AssetModel varlik={varlik} oturan position={[0, 0, -0.7]} />
      {/* rim ışığı + önden yumuşak ana ışık */}
      <primitive object={rimHedef} position={[0, 1.55, -0.7]} />
      <spotLight position={[-0.75, 3.1, -0.78]} target={rimHedef} angle={0.5} penumbra={0.9} intensity={14} distance={4} decay={2} color="#8fb6ff" />
      <spotLight position={[0.75, 3.1, -0.78]} target={rimHedef} angle={0.5} penumbra={0.9} intensity={9} distance={4} decay={2} color="#ffb880" />
      <spotLight position={[0.2, 3.3, 1.6]} target={rimHedef} angle={0.28} penumbra={0.9} intensity={26} distance={9} decay={2} color={varlik === 'ayse' ? '#ffe2c4' : '#e8efff'} />
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
  const masaDoku = useMemo(() => tahtaDoku('#4a3626', '#b89066', 3, 1, 7), [])
  const zeminDoku = useMemo(() => tahtaDoku('#2e231b', '#7d6248', 6, 5, 10), [])
  const arkaDoku = useMemo(() => tahtaDoku('#2a1f17', '#a58260', 1.2, 1, 5), [])

  // şimşek: aralıklı, çift vuruşlu
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t > simsek.sonraki && simsek.basladi < 0) { simsek.basladi = t; simsek.sonraki = t + 9 + Math.random() * 14 }
    if (simsek.basladi >= 0) {
      const u = t - simsek.basladi
      simsek.deger = u < 0.07 ? u / 0.07 : u < 0.18 ? 1 - (u - 0.07) * 4 : u < 0.27 ? 0.5 + (u - 0.18) * 4 : u < 0.6 ? Math.max(0, 0.9 - (u - 0.27) * 2.8) : 0
      if (u > 0.6) { simsek.basladi = -1; simsek.deger = 0 }
    }
    if (dolgu.current) dolgu.current.intensity = 0.22 + simsek.deger * 1.2
  })

  return (
    <>
      <color attach="background" args={['#030407']} />
      <fog attach="fog" args={['#030407', 12, 28]} />
      <PerformanceMonitor onChange={({ factor }) => setDpr(Math.min(1.75, Math.max(0.8, 0.8 + factor * 0.95)))} />
      <KameraKurgusu kamera={kamera} />

      {/* ışık: lamba ana, ortam çok düşük; ortam yansıması ≤ 0,45 */}
      <ambientLight ref={dolgu} intensity={0.22} color="#7f93b8" />
      <hemisphereLight ref={hemi} args={['#6b82ac', '#2a1d14', 1.0]} />
      <SarkitLamba x={LAMBA_X} z={0} hemi={hemi} />
      <Environment resolution={64} background={false} environmentIntensity={0.4}>
        <Lightformer form="rect" color="#ffcf8a" intensity={3} position={[LAMBA_X, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 3, 1]} />
        <Lightformer form="rect" color="#5f7fb8" intensity={0.6} position={[-6, 3, 1]} scale={[6, 4, 1]} />
        <Lightformer form="rect" color="#59ff8f" intensity={0.5} position={[TELSIZ_X, 1.4, 2]} scale={[1.2, 0.6, 1]} />
      </Environment>

      {/* oda: tahta zemin, koyu arka duvar + süpürgelik, yan duvarlar, tavan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial map={zeminDoku} color="#c8b098" roughness={0.65} />
      </mesh>
      <mesh position={[0, 3.1, DUVAR_Z]}>
        <planeGeometry args={[26, 6.2]} />
        <meshStandardMaterial color="#2a3640" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.11, DUVAR_Z + 0.025]}>
        <boxGeometry args={[26, 0.22, 0.05]} />
        <meshStandardMaterial color="#2c221b" roughness={0.6} />
      </mesh>
      <mesh position={[-13, 3.1, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6.2]} />
        <meshStandardMaterial color="#1a2229" />
      </mesh>
      <mesh position={[13, 3.1, 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 6.2]} />
        <meshStandardMaterial color="#1a2229" />
      </mesh>
      <mesh position={[0, 6.2, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#111418" />
      </mesh>

      {/* ana masa 11 × 3,3 m, üst yüzey y = 1,06 */}
      <RoundedBox args={[11, 0.12, 3.3]} radius={0.04} smoothness={4} position={[0, DY - 0.06, 0]}>
        <meshStandardMaterial map={masaDoku} color="#ffffff" roughness={0.42} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0, (DY - 0.12) / 2, 1.58]}>
        <boxGeometry args={[10.8, DY - 0.12, 0.08]} />
        <meshStandardMaterial color="#1f1711" roughness={0.85} />
      </mesh>
      {[-5.3, 5.3].flatMap((lx) => [-1.5, 1.5].map((lz) => (
        <mesh key={`${lx}${lz}`} position={[lx, (DY - 0.12) / 2, lz]}>
          <boxGeometry args={[0.25, DY - 0.12, 0.25]} />
          <meshStandardMaterial color="#1f1711" roughness={0.85} />
        </mesh>
      )))}

      {/* masa üstü: telsiz sol uçta, harita lambanın altında */}
      <Telsiz position={[TELSIZ_X, DY, -0.55]} rotation={[0, 0.3, 0]} scale={0.88} satir={satir} pil={pil} />
      <GolgeLekesi poz={[TELSIZ_X, DY + 0.003, -0.55]} w={2.7} d={1.15} rot={0.3} />
      <ReliefMap position={[HARITA_X, DY + 0.003, 0.55]} genislik={4.56} vurgu={vurgu} onTikla={onHarita} />
      <JetonKavanozu position={[-0.85, DY, 0.45]} jeton={jeton} />
      <GolgeLekesi poz={[-0.85, DY + 0.003, 0.45]} w={0.7} d={0.7} />
      <NotDefteri position={[-1.7, DY, 1.05]} rotation={[0, 0.12, 0]} />
      <Kupa position={[4.85, DY, 1.0]} />
      <GolgeLekesi poz={[4.85, DY + 0.003, 1.0]} w={0.38} d={0.38} />
      <DefterObjesi onDefter={onDefter} position={[-3.9, DY, 1.0]} rotation={[0, 0.3, 0]} scale={0.92} />
      <GolgeLekesi poz={[-3.9, DY + 0.003, 1.0]} w={0.85} d={0.65} rot={0.3} />
      <Kagit poz={[-0.95, DY + 0.004, 1.2]} rot={0.4} />
      <Kagit poz={[-0.75, DY + 0.008, 1.3]} rot={-0.25} renk="#e4dfd0" />
      <Kagit poz={[1.3, DY + 0.004, -0.95]} rot={-0.6} w={0.34} h={0.24} />

      {/* arka masalar + karakterler */}
      <ArkaMasa x={NURI_X} varlik="nuri" ekranRenk="#9fd0ff" tahta={arkaDoku} />
      <ArkaMasa x={AYSE_X} varlik="ayse" ekranRenk="#ffd7a0" tahta={arkaDoku} />

      {/* duvar: harita (Ayşe'nin arkasında), saat (lambanın altında), pencere (telsizin arkasında) */}
      <DuvarHaritasi position={[AYSE_X, 3.1, DUVAR_Z + 0.04]} genislik={2.2} vurgu={vurgu} />
      <Saat position={[0.85, 3.25, DUVAR_Z + 0.04]} />
      <Pencere x={-2.9} y={2.55} />

      <Toz />
    </>
  )
}
