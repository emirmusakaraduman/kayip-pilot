import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { BOLGELER, BOLGE_AD, BOLGE_ETIKET, EN_BOY, LAT0, LAT1, LON0, LON1, dokuCiz, haritaUret, icerde, type Bolge } from '../map/turkey'

const KAB = 0.034 // km başına yükseklik (abartılı); harita genişliğiyle ölçeklenir
const HOVER_Z = 1.2 // üstüne gelinen bölgenin yükseklik ölçeği
const SECILI_Z = 1.7 // tıklanan bölgenin yükseklik ölçeği
const AMBER = '#ffb02e'

export type Tiklama = { bolge: Bolge; enlem: number; boylam: number }

/** Harita dokusu: sığ/derin deniz, iklim renkleri, kabartma gölgesi, nehirler, göller. */
function useDoku(vurgu: Bolge[]) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { canvas, tex }
  }, [])
  const anahtar = vurgu.join(',')
  useEffect(() => {
    dokuCiz(haritaUret(), canvas, anahtar ? (anahtar.split(',') as Bolge[]) : [])
    tex.needsUpdate = true
  }, [anahtar, canvas, tex])
  return tex
}

/** Kabartma ağı: her bölge için ayrı geometri (aynı köşe verisini paylaşır), amber sınır çizgisi. */
function kabartmaYapisi(W: number, H: number) {
  const v = haritaUret()
  const sx = 240
  const sy = Math.round(sx / EN_BOY)
  const nx = sx + 1
  const ny = sy + 1
  const yuk = (W / 2) * KAB
  const pos = new Float32Array(nx * ny * 3)
  const uv = new Float32Array(nx * ny * 2)
  const reg = new Int8Array(nx * ny)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const id = j * nx + i
      const px = Math.min(v.w - 1, Math.round((i / sx) * (v.w - 1)))
      const py = Math.min(v.h - 1, Math.round((j / sy) * (v.h - 1)))
      const k = py * v.w + px
      reg[id] = v.kara[k] ? v.bolge[k] : -1
      pos.set([(i / sx - 0.5) * W, (0.5 - j / sy) * H, v.kara[k] ? v.yuk[k] * yuk : 0], id * 3)
      uv.set([i / sx, 1 - j / sy], id * 2)
    }
  const tumIndis: number[] = []
  const bolgeIndis: number[][] = BOLGELER.map(() => [])
  for (let j = 0; j < sy; j++)
    for (let i = 0; i < sx; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1
      for (const t of [[a, c, d], [a, d, b]]) {
        tumIndis.push(...t)
        const kara = t.filter((q) => reg[q] >= 0)
        if (kara.length < 2) continue // çoğunluğu deniz: düz deniz levhası örter
        bolgeIndis[reg[kara[0]]].push(...t)
      }
    }
  const taban = new THREE.BufferGeometry()
  taban.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  taban.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  taban.setIndex(tumIndis)
  taban.computeVertexNormals()
  const geolar = bolgeIndis.map((idx) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', taban.attributes.position)
    g.setAttribute('normal', taban.attributes.normal)
    g.setAttribute('uv', taban.attributes.uv)
    g.setIndex(idx)
    return g
  })
  // sınır çizgileri: bir bölgenin üçgenlerinde yalnızca bir kez geçen kenarlar
  const cizgiler = bolgeIndis.map((idx) => {
    const sayac = new Map<number, number>()
    const anahtar = (p: number, q: number) => (p < q ? p * 1e6 + q : q * 1e6 + p)
    for (let t = 0; t < idx.length; t += 3)
      for (const [p, q] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) sayac.set(anahtar(p, q), (sayac.get(anahtar(p, q)) ?? 0) + 1)
    const nokta: number[] = []
    for (const [key, n] of sayac) {
      if (n !== 1) continue
      const p = Math.floor(key / 1e6), q = key % 1e6
      nokta.push(pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2] + 0.006, pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2] + 0.006)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nokta), 3))
    return g
  })
  return { v, yuk, geolar, cizgiler }
}

/** Etiket kutusu: koyu yarı saydam zemin, beyaz yazı; üstüne gelinince altın, seçilince amber çerçeveli. */
function etiketCiz(canvas: HTMLCanvasElement, ad: string, hover: boolean, secili: boolean) {
  canvas.width = 320
  canvas.height = 80
  const x = canvas.getContext('2d')!
  x.clearRect(0, 0, 320, 80)
  x.fillStyle = hover ? 'rgba(138,118,44,0.86)' : 'rgba(14,14,14,0.66)'
  x.fillRect(0, 0, 320, 80)
  if (secili) {
    x.strokeStyle = AMBER
    x.lineWidth = 6
    x.strokeRect(3, 3, 314, 74)
  }
  x.fillStyle = '#ffffff'
  x.font = '700 44px "Barlow Condensed", "Arial Narrow", sans-serif'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillText(ad, 160, 42)
}

function Etiket({ ad, poz, hover, secili, boyut }: { ad: string; poz: React.RefObject<THREE.Vector3>; hover: boolean; secili: boolean; boyut: number }) {
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, tex: t }
  }, [])
  useEffect(() => {
    etiketCiz(canvas, ad, hover, secili)
    tex.needsUpdate = true
  }, [canvas, tex, ad, hover, secili])
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (!ref.current || !poz.current) return
    ref.current.position.copy(poz.current)
    ref.current.quaternion.copy(camera.quaternion) // kameraya dönük
  })
  return (
    <mesh ref={ref} renderOrder={6}>
      <planeGeometry args={[0.62 * boyut, 0.155 * boyut]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** Masaüstü kabartma harita: bölge bölge yükselir, parlayan deniz, etiketler. */
export function ReliefMap({
  genislik = 2,
  vurgu = [],
  onTikla,
  ...props
}: { genislik?: number; vurgu?: Bolge[]; onTikla?: (t: Tiklama) => void } & React.ComponentProps<'group'>) {
  const tex = useDoku([])
  const W = genislik
  const H = genislik / EN_BOY
  const yapi = useMemo(() => kabartmaYapisi(W, H), [W, H])
  const haritaGrp = useRef<THREE.Group>(null)
  const meshler = useRef<(THREE.Mesh | null)[]>([])
  const cizgiMat = useRef<(THREE.LineBasicMaterial | null)[]>([])
  const bolgeMat = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const olcek = useRef<number[]>(BOLGELER.map(() => 1))
  const [hover, setHover] = useState(-1)
  const hoverRef = useRef(-1)
  hoverRef.current = hover
  const seciliIdx = useMemo(() => new Set(vurgu.map((b) => BOLGELER.indexOf(b))), [vurgu])
  const seciliRef = useRef(seciliIdx)
  seciliRef.current = seciliIdx
  const etiketPoz = useRef(BOLGELER.map(() => new THREE.Vector3()))

  const yukAt = (u: number, vv: number) => {
    const k = Math.min(yapi.v.h - 1, Math.max(0, Math.round((1 - vv) * (yapi.v.h - 1)))) * yapi.v.w + Math.min(yapi.v.w - 1, Math.max(0, Math.round(u * (yapi.v.w - 1))))
    return { h: yapi.v.kara[k] ? yapi.v.yuk[k] : 0, r: yapi.v.kara[k] ? yapi.v.bolge[k] : -1 }
  }

  useFrame((_, dt) => {
    BOLGELER.forEach((_b, i) => {
      const hedef = seciliRef.current.has(i) ? SECILI_Z : hoverRef.current === i ? HOVER_Z : 1
      olcek.current[i] = THREE.MathUtils.damp(olcek.current[i], hedef, 9, dt)
      const m = meshler.current[i]
      if (m) m.scale.z = olcek.current[i]
      const lm = cizgiMat.current[i]
      if (lm) lm.opacity = THREE.MathUtils.clamp((olcek.current[i] - 1.05) / 0.4, 0, 1)
      const bm = bolgeMat.current[i]
      if (bm) bm.emissiveIntensity = 0.16 + THREE.MathUtils.clamp((olcek.current[i] - 1) * 0.35, 0, 0.3) // yükselen bölge biraz daha parlar
      // etiket: bölgenin içindeki noktanın üstünde, bölge yükseldikçe yükselir
      const [lon, lat] = BOLGE_ETIKET[BOLGELER[i]]
      const u = (lon - LON0) / (LON1 - LON0)
      const vv = (lat - LAT0) / (LAT1 - LAT0)
      const { h } = yukAt(u, vv)
      etiketPoz.current[i].set((u - 0.5) * W, h * yapi.yuk * olcek.current[i] + 0.2 * (W / 4.56), -(vv - 0.5) * H)
    })
  })

  /** Işın yürütme: kamera ışınını harita uzayında kabartma yüksekliğine karşı adım adım izler. */
  const bul = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const g = haritaGrp.current
    if (!g) return null
    g.updateWorldMatrix(true, false)
    const ters = new THREE.Matrix4().copy(g.matrixWorld).invert()
    const o = e.ray.origin.clone().applyMatrix4(ters)
    const d = e.ray.direction.clone().transformDirection(ters)
    if (d.z >= -1e-4) return null
    const zUst = 4.4 * yapi.yuk * SECILI_Z + 0.02
    let t = Math.max(0, (zUst - o.z) / d.z)
    const adim = 0.012 * (W / 4.56)
    for (let k = 0; k < 1400; k++, t += adim) {
      const px = o.x + d.x * t, py = o.y + d.y * t, pz = o.z + d.z * t
      if (pz < -0.01) return null
      const u = px / W + 0.5, vv = py / H + 0.5
      if (u < 0 || u > 1 || vv < 0 || vv > 1) continue
      const { h, r } = yukAt(u, vv)
      const sc = r >= 0 ? olcek.current[r] : 1
      if (pz <= h * yapi.yuk * sc + 0.003) return { u, vv, r }
    }
    return null
  }

  const hareket = (e: ThreeEvent<PointerEvent>) => {
    const s = bul(e)
    const r = s && s.r >= 0 ? s.r : -1
    if (r !== hoverRef.current) setHover(r)
    document.body.style.cursor = r >= 0 ? 'pointer' : 'default'
  }
  const tikla = (e: ThreeEvent<MouseEvent>) => {
    if (!onTikla || e.delta > 6) return // sürükleyerek bakmak seçim sayılmaz
    const s = bul(e)
    if (!s || s.r < 0) return // deniz seçilemez
    const boylam = LON0 + s.u * (LON1 - LON0), enlem = LAT0 + s.vv * (LAT1 - LAT0)
    if (!icerde(boylam, enlem)) return
    e.stopPropagation()
    onTikla({ bolge: BOLGELER[s.r], enlem, boylam })
  }

  return (
    <group {...props}>
      {/* koyu levha */}
      <mesh position={[0, -0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[W + 0.08, H + 0.08, 0.08]} />
        <meshStandardMaterial color="#071225" roughness={0.6} emissive="#0a2a55" emissiveIntensity={0.35} />
      </mesh>
      <group ref={haritaGrp} rotation={[-Math.PI / 2, 0, 0]}>
        {/* deniz: düz, parlayan */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={1.5} roughness={0.35} metalness={0.1} />
        </mesh>
        {/* bölgeler */}
        {yapi.geolar.map((g, i) => (
          <mesh key={i} ref={(m) => void (meshler.current[i] = m)} geometry={g}>
            <meshStandardMaterial ref={(m) => void (bolgeMat.current[i] = m)} map={tex} roughness={0.85} emissive="#ffffff" emissiveIntensity={0.16} emissiveMap={tex} />
            <lineSegments geometry={yapi.cizgiler[i]}>
              <lineBasicMaterial ref={(m) => void (cizgiMat.current[i] = m)} color={AMBER} transparent opacity={0} depthTest={false} />
            </lineSegments>
          </mesh>
        ))}
        {/* görünmez algılama yüzeyi: olaylar buradan, isabet ışın yürütmeyle bulunur */}
        <mesh position={[0, 0, 0.02]} onPointerMove={hareket} onPointerOut={() => { setHover(-1); document.body.style.cursor = 'default' }} onClick={tikla}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {BOLGELER.map((b, i) => (
        <Etiket key={b} ad={BOLGE_AD[b]} poz={{ current: etiketPoz.current[i] }} hover={hover === i} secili={seciliIdx.has(i)} boyut={W / 4.56} />
      ))}
    </group>
  )
}

/** Duvardaki düz harita (aynı doku): koyu çerçeve, kendi ışığıyla parlar. */
export function DuvarHaritasi({ genislik = 3, vurgu = [], ...props }: { genislik?: number; vurgu?: Bolge[] } & React.ComponentProps<'group'>) {
  const tex = useDoku(vurgu)
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[genislik + 0.1, genislik / EN_BOY + 0.1, 0.04]} />
        <meshStandardMaterial color="#12161c" roughness={0.6} />
      </mesh>
      <mesh>
        <planeGeometry args={[genislik, genislik / EN_BOY]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55} />
      </mesh>
      <pointLight position={[0, 0, 0.6]} color="#4aa8ff" intensity={0.5} distance={3} decay={2} />
    </group>
  )
}

export { BOLGELER }
