import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { OrtamAyar } from './ortam'
import { ENKAZ, CARPMA_YERI } from './timeline'

/** Güneş yönü: ufka yakın (≈9°), uçuş yönünün önünde; kahramanlar kontrajurda kalır. */
export const GUNES_YON = new THREE.Vector3(0.85, 0.16, -0.5).normalize()

const GURULTU = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}`

/** Atmosfer + bulut gölgelendiricisi (gökkubbe). */
export function Gokyuzu({ ayar }: { ayar: OrtamAyar }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: { value: new THREE.Color(ayar.gokUst) },
          uHorizon: { value: new THREE.Color(ayar.gokUfuk) },
          uSun: { value: new THREE.Color(ayar.gunes) },
          uSunDir: { value: GUNES_YON },
          uTime: { value: 0 },
          uCloud: { value: ayar.bulut },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uHorizon, uSun, uSunDir; uniform float uTime, uCloud;
          varying vec3 vDir;
          ${GURULTU}
          void main(){
            vec3 d = normalize(vDir);
            float h = clamp(d.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(h, 0.5));
            float s = max(dot(d, uSunDir), 0.0);
            col += uSun * (pow(s, 6.0) * 0.45 + pow(s, 220.0) * 2.2);
            if (d.y > 0.0) {
              vec2 uv = d.xz / (d.y + 0.18) * 1.1 + vec2(uTime * 0.012, 0.0);
              float c = smoothstep(0.5 - 0.22 * uCloud, 0.85, fbm(uv * 1.4));
              vec3 cc = mix(uHorizon * 0.55, uSun * 1.15, pow(s, 3.0));
              cc = mix(cc, uTop * 0.75, smoothstep(0.25, 0.9, h));
              col = mix(col, cc, c * smoothstep(0.0, 0.18, d.y) * 0.9);
            }
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [ayar],
  )
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ camera, clock }) => {
    ref.current?.position.copy(camera.position)
    mat.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1400, 32, 16]} />
    </mesh>
  )
}

function rastgele(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tarla parçalı zemin dokusu. */
function tarlaDokusu(renkler: string[]) {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const x = c.getContext('2d')!
  const r = rastgele(7)
  x.fillStyle = renkler[0]
  x.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 160; i++) {
    x.save()
    x.translate(r() * 1024, r() * 1024)
    x.rotate((r() - 0.5) * 0.6)
    x.fillStyle = renkler[Math.floor(r() * renkler.length)]
    x.fillRect(0, 0, 50 + r() * 220, 40 + r() * 160)
    x.restore()
  }
  x.strokeStyle = 'rgba(30,40,25,0.35)'
  x.lineWidth = 2
  for (let i = 0; i < 40; i++) {
    x.beginPath()
    x.moveTo(r() * 1024, r() * 1024)
    x.lineTo(r() * 1024, r() * 1024)
    x.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(14, 14)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function Zemin({ ayar }: { ayar: OrtamAyar }) {
  const tex = useMemo(() => tarlaDokusu(ayar.tarla), [ayar])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3000, 3000]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  )
}

/** Ufukta sisli dağ katmanları: kameranın çevresinde üç halka. */
export function Daglar({ ayar }: { ayar: OrtamAyar }) {
  const halkalar = useMemo(
    () =>
      [
        { r: 600, h: 70, k: 0, karisim: 0.45 },
        { r: 850, h: 120, k: 1, karisim: 0.32 },
        { r: 1100, h: 170, k: 2, karisim: 0.2 },
      ].map(({ r, h, k, karisim }) => {
        const g = new THREE.CylinderGeometry(r, r, h, 192, 1, true)
        const p = g.attributes.position
        for (let i = 0; i < p.count; i++) {
          if (p.getY(i) <= 0) continue
          const a = Math.atan2(p.getZ(i), p.getX(i))
          p.setY(i, h / 2 + h * 0.45 * (Math.sin(3 * a + k) + 0.6 * Math.sin(7 * a + 2 * k) + 0.3 * Math.sin(17 * a + k * 3)))
        }
        g.computeVertexNormals()
        const renk = new THREE.Color(ayar.sis).lerp(new THREE.Color('#3b4666'), karisim)
        return { g, renk, y: h / 2 - 20 }
      }),
    [ayar],
  )
  return (
    <>
      {halkalar.map((h, i) => (
        <mesh key={i} geometry={h.g} position={[0, h.y, 0]}>
          <meshBasicMaterial color={h.renk} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

/** Zemine düşen hareketli bulut gölgeleri. */
export function BulutGolgesi({ ayar }: { ayar: OrtamAyar }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uKoyu: { value: 0.18 + ayar.bulut * 0.25 } },
        vertexShader: /* glsl */ `
          varying vec2 vW;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uKoyu; varying vec2 vW;
          ${GURULTU}
          void main(){
            float c = fbm(vW * 0.0045 + vec2(uTime * 0.02, uTime * 0.008));
            float a = smoothstep(0.48, 0.72, c) * uKoyu;
            gl_FragColor = vec4(0.02, 0.03, 0.06, a);
          }`,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [ayar],
  )
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ camera, clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    ref.current?.position.set(camera.position.x, 0.08, camera.position.z)
  })
  return (
    <mesh ref={ref} material={mat} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[1400, 1400]} />
    </mesh>
  )
}

interface Agac {
  x: number
  z: number
  olcek: number
  faz: number
  ton: number
}

const YAKIN = 70

/** Tepeden dibe doğru koyulaşan köşe rengi: ağaçlara hacim ve iç gölge hissi verir (örnek rengiyle çarpılır). */
function golgele(g: THREE.BufferGeometry, y0: number, y1: number, alt: number, ust: number) {
  const p = g.attributes.position
  const c = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const k = alt + (ust - alt) * Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0)))
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3))
  return g
}

/**
 * Taç geometrileri (yükseklik ≈ 3,2 birim, merkez y=0; gövde ayrı). Çam: üst üste üç koni; geniş yapraklı: birleşik küreler.
 * Uzak sürüm çok daha az üçgenlidir (LOD).
 */
function agacGeometrileri(tur: 'ibre' | 'genis') {
  const govde = new THREE.CylinderGeometry(0.12, 0.2, 1.2, 6)
  if (tur === 'ibre') {
    const kat = (r: number, h: number, taban: number, kenar: number) => {
      const g = new THREE.ConeGeometry(r, h, kenar, 1, false)
      g.translate(0, taban + h / 2 - 1.6, 0)
      return g
    }
    const yap = (kenar: number, katlar: [number, number, number][]) =>
      golgele(mergeGeometries(katlar.map(([r, h, t]) => kat(r, h, t, kenar)))!, -1.6, 1.6, 0.55, 1.05)
    return {
      yakinTac: yap(9, [[1.3, 1.5, 0], [1.0, 1.4, 0.9], [0.66, 1.3, 1.9]]),
      uzakTac: yap(5, [[1.25, 1.9, 0], [0.8, 1.7, 1.5]]),
      govde,
    }
  }
  const kure = (r: number, x: number, y: number, z: number, detay: number) => {
    const g = new THREE.IcosahedronGeometry(r, detay)
    g.scale(1, 0.88, 1)
    g.translate(x, y, z)
    return g
  }
  return {
    yakinTac: golgele(
      mergeGeometries([kure(1.15, 0, -0.35, 0, 1), kure(0.85, 0.55, 0.35, 0.25, 1), kure(0.9, -0.5, 0.5, -0.3, 1), kure(0.7, 0.05, 1.0, 0.15, 1)])!,
      -1.5, 1.7, 0.5, 1.05,
    ),
    uzakTac: golgele(mergeGeometries([kure(1.2, 0, -0.2, 0, 0), kure(0.9, 0.1, 0.8, 0, 0)])!, -1.5, 1.7, 0.55, 1.05),
    govde,
  }
}

/**
 * Orman: örnekli çizim + yakınlığa göre ayrıntı seviyesi.
 * Yakın ağaçlar gövdeli, ayrıntılı taçlı ve rüzgârda sallanır; uzaktakiler tek parça, düşük üçgenli taçtır.
 * Ortama göre katmanlı çam (karadeniz, sert-karasal) ya da yuvarlak tepeli yapraklı ağaç (akdeniz, karasal) çizilir.
 */
export function Agaclar({ ayar }: { ayar: OrtamAyar }) {
  const kamera = useThree((s) => s.camera)
  const yakinTac = useRef<THREE.InstancedMesh>(null)
  const yakinGovde = useRef<THREE.InstancedMesh>(null)
  const uzakTac = useRef<THREE.InstancedMesh>(null)
  const son = useRef(-1)

  const agaclar = useMemo<Agac[]>(() => {
    const r = rastgele(42)
    const liste: Agac[] = []
    // Enkaz alanı ve sabit kamera noktaları ağaçsız kalır (kamera ağacın içine düşmesin).
    const bosluklar: [number, number, number][] = [
      [ENKAZ[0] - 2, ENKAZ[2], 11], [-14, 40, 16], [72, 24, 9], [68, 19, 9], [36, -16, 11], [46, -6, 9],
    ]
    const temiz = (x: number, z: number) => bosluklar.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)
    while (liste.length < ayar.agacAdet) {
      const x = -140 + r() * 320
      const z = -170 + r() * 340
      if (temiz(x, z)) continue
      liste.push({ x, z, olcek: ayar.agacOlcek[0] + r() * (ayar.agacOlcek[1] - ayar.agacOlcek[0]), faz: r() * 6.28, ton: r() })
    }
    // Rotorun çarpacağı yere yoğun, yüksek bir koru: çarpma sahnesinin güvencesi.
    for (let i = 0; i < 45; i++) {
      const a = r() * 6.28
      const d = r() * 7
      liste.push({ x: CARPMA_YERI[0] + Math.cos(a) * d, z: CARPMA_YERI[2] + Math.sin(a) * d, olcek: 2.5 + r() * 0.5, faz: r() * 6.28, ton: r() })
    }
    return liste
  }, [ayar])

  const geo = useMemo(() => agacGeometrileri(ayar.agacTuru), [ayar.agacTuru])
  const tacMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, vertexColors: true, flatShading: true }), [])
  const govdeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 1 }), [])
  const temel = useMemo(() => new THREE.Color(ayar.agacRenk), [ayar])
  const d = useMemo(() => new THREE.Object3D(), [])
  const renk = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    son.current = -1 // ayar değişince yeniden doldur
  }, [agaclar])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - son.current < 0.08) return
    son.current = t
    const yt = yakinTac.current, yg = yakinGovde.current, ut = uzakTac.current
    if (!yt || !yg || !ut) return
    let ny = 0, nu = 0
    const cx = kamera.position.x, cz = kamera.position.z
    for (const a of agaclar) {
      const yakin = (a.x - cx) ** 2 + (a.z - cz) ** 2 < YAKIN * YAKIN
      renk.copy(temel).offsetHSL(0, 0, (a.ton - 0.5) * 0.08)
      if (yakin) {
        const sallan = Math.sin(t * 1.6 + a.faz) * 0.045
        d.position.set(a.x, 0, a.z)
        d.rotation.set(0, 0, sallan)
        d.scale.setScalar(a.olcek)
        d.position.y = 0.6 * a.olcek
        d.updateMatrix()
        yg.setMatrixAt(ny, d.matrix)
        d.position.y = (0.6 + 1.6) * a.olcek
        d.rotation.set(sallan * 0.6, 0, sallan)
        d.updateMatrix()
        yt.setMatrixAt(ny, d.matrix)
        yt.setColorAt(ny, renk)
        ny++
      } else {
        d.position.set(a.x, (0.6 + 1.6) * a.olcek, a.z)
        d.rotation.set(0, 0, 0)
        d.scale.setScalar(a.olcek)
        d.updateMatrix()
        ut.setMatrixAt(nu, d.matrix)
        ut.setColorAt(nu, renk)
        nu++
      }
    }
    for (const [m, n] of [[yt, ny], [yg, ny], [ut, nu]] as const) {
      m.count = n
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  const n = agaclar.length
  return (
    <>
      <instancedMesh key={ayar.agacTuru + 'y'} ref={yakinTac} args={[geo.yakinTac, tacMat, n]} frustumCulled={false} castShadow receiveShadow />
      <instancedMesh ref={yakinGovde} args={[geo.govde, govdeMat, n]} frustumCulled={false} castShadow />
      <instancedMesh key={ayar.agacTuru + 'u'} ref={uzakTac} args={[geo.uzakTac, tacMat, n]} frustumCulled={false} castShadow />
    </>
  )
}
