import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { OrtamAyar } from './ortam'
import { ASSETS, yuklenebilirMi, type AssetSlot } from '../assets/registry'
import { YukleHatasi } from '../components/AssetModel'
import { AGAC_BOY, type Orman } from './orman'

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

interface AgacGeo {
  yakinTac: THREE.BufferGeometry
  uzakTac: THREE.BufferGeometry
  /** null: model gövdeyi zaten içeriyor (GLB). */
  govde: THREE.BufferGeometry | null
}

/**
 * Geçici (GLB gelene kadar) organik ağaçlar. Taç geometrileri taç merkezi y=0'da, ±1,6 aralığında.
 * Çam: üst üste üç koni; geniş yapraklı: birleşik küreler. Uzak sürüm çok daha az üçgenlidir (LOD).
 */
function agacGeometrileri(tur: 'ibre' | 'genis'): AgacGeo {
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

interface OrmanCizimProps {
  orman: Orman
  ayar: OrtamAyar
  tRef: React.MutableRefObject<number>
  geo: AgacGeo
  tacMat: THREE.Material | THREE.Material[]
  /** Taç örneğinin taban üstündeki yüksekliği (ölçekle çarpılır). Taç merkezli geometride 2,2; tabanda başlayan GLB'de 0. */
  tacY: number
}

/** GLB ağaç: tüm parçalar tek geometride birleştirilir, boyu AGAC_BOY'a ölçeklenip tabanı y=0'a oturtulur; malzemeler korunur. */
function GlbAgaclar(props: OrmanCizimProps & { slot: AssetSlot }) {
  const { slot, ...kalan } = props
  const { scene } = useGLTF(slot.url!)
  const model = useMemo(() => {
    scene.updateMatrixWorld(true)
    const parcalar: THREE.BufferGeometry[] = []
    const malzemeler: THREE.Material[] = []
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      let g = m.geometry.clone()
      g.applyMatrix4(m.matrixWorld)
      if (g.index) g = g.toNonIndexed()
      for (const ad of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(ad)) g.deleteAttribute(ad)
      parcalar.push(g)
      malzemeler.push(Array.isArray(m.material) ? m.material[0] : m.material)
    })
    if (!parcalar.length) return null
    if (parcalar.some((g) => !g.attributes.uv)) parcalar.forEach((g) => g.deleteAttribute('uv'))
    const g = mergeGeometries(parcalar, true)
    if (!g) return null
    g.computeBoundingBox()
    const kutu = g.boundingBox!
    const k = AGAC_BOY / (kutu.max.y - kutu.min.y)
    g.translate(-(kutu.min.x + kutu.max.x) / 2, -kutu.min.y, -(kutu.min.z + kutu.max.z) / 2)
    g.scale(k, k, k)
    return { g, malzemeler }
  }, [scene])
  if (!model) return <OrmanCizim {...kalan} />
  return <OrmanCizim {...kalan} geo={{ yakinTac: model.g, uzakTac: model.g, govde: null }} tacMat={model.malzemeler} tacY={0} />
}

function OrmanCizim({ orman, ayar, tRef, geo, tacMat, tacY }: OrmanCizimProps) {
  const kamera = useThree((s) => s.camera)
  const yakinTac = useRef<THREE.InstancedMesh>(null)
  const yakinGovde = useRef<THREE.InstancedMesh>(null)
  const uzakTac = useRef<THREE.InstancedMesh>(null)
  const son = useRef(-1)
  const govdeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 1 }), [])
  const temel = useMemo(() => new THREE.Color(ayar.agacRenk), [ayar])
  const d = useMemo(() => new THREE.Object3D(), [])
  const renk = useMemo(() => new THREE.Color(), [])
  const procedural = geo.govde !== null

  useEffect(() => {
    son.current = -1 // veri değişince yeniden doldur
  }, [orman])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - son.current < 0.05) return
    son.current = t
    const yt = yakinTac.current, yg = yakinGovde.current, ut = uzakTac.current
    if (!yt || !ut || (procedural && !yg)) return
    const ts = tRef.current
    let ny = 0, nu = 0
    const cx = kamera.position.x, cz = kamera.position.z
    for (const a of orman.agaclar) {
      // çarpışmada tepesi kırılan ağaç kısa sürede kırık boyuna iner
      let olcek = a.olcek
      if (a.kirikT !== undefined && ts >= a.kirikT) {
        const u = Math.min(1, (ts - a.kirikT) / 0.25)
        olcek = a.olcek + (a.kirikOlcek! - a.olcek) * u * u * (3 - 2 * u)
      }
      const yakin = (a.x - cx) ** 2 + (a.z - cz) ** 2 < YAKIN * YAKIN
      renk.copy(temel).offsetHSL(0, 0, (a.ton - 0.5) * 0.08)
      if (yakin) {
        const sallan = Math.sin(t * 1.6 + a.faz) * 0.045
        if (yg) {
          d.position.set(a.x, a.y + 0.6 * olcek, a.z)
          d.rotation.set(0, 0, sallan)
          d.scale.setScalar(olcek)
          d.updateMatrix()
          yg.setMatrixAt(ny, d.matrix)
        }
        d.position.set(a.x, a.y + tacY * olcek, a.z)
        d.rotation.set(sallan * 0.6, a.faz, sallan)
        d.scale.setScalar(olcek)
        d.updateMatrix()
        yt.setMatrixAt(ny, d.matrix)
        yt.setColorAt(ny, renk)
        ny++
      } else {
        d.position.set(a.x, a.y + tacY * olcek, a.z)
        d.rotation.set(0, a.faz, 0)
        d.scale.setScalar(olcek)
        d.updateMatrix()
        ut.setMatrixAt(nu, d.matrix)
        ut.setColorAt(nu, renk)
        nu++
      }
    }
    for (const [m, n] of [[yt, ny], [yg, ny], [ut, nu]] as const) {
      if (!m) continue
      m.count = n
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  const n = orman.agaclar.length
  const anahtar = ayar.agacTuru + (procedural ? 'p' : 'g')
  return (
    <>
      <instancedMesh key={anahtar + 'y'} ref={yakinTac} args={[geo.yakinTac, tacMat, n]} frustumCulled={false} castShadow receiveShadow />
      {geo.govde && <instancedMesh key={anahtar + 'g'} ref={yakinGovde} args={[geo.govde, govdeMat, n]} frustumCulled={false} castShadow />}
      <instancedMesh key={anahtar + 'u'} ref={uzakTac} args={[geo.uzakTac, tacMat, n]} frustumCulled={false} castShadow />
    </>
  )
}

/**
 * Orman: örnekli çizim + yakınlığa göre ayrıntı seviyesi, arazi yüksekliğine oturur.
 * `registry.ts` içindeki agacCam / agacYaprakli yuvalarına GLB (url) verilirse onlar kullanılır; yoksa kodla üretilen organik ağaçlar.
 * Yerleşim ve helikopterle çakışmalar `orman.ts`'te çözülür (yolun üstündeki ağaçlar kısalır, çarpışmada tepesi kırılır).
 */
export function Agaclar({ ayar, orman, tRef }: { ayar: OrtamAyar; orman: Orman; tRef: React.MutableRefObject<number> }) {
  const yedek = useMemo(() => agacGeometrileri(ayar.agacTuru), [ayar.agacTuru])
  const tacMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, vertexColors: true, flatShading: true }), [])
  const slot = ASSETS[ayar.agacTuru === 'ibre' ? 'agacCam' : 'agacYaprakli']
  const ortak = { orman, ayar, tRef, geo: yedek, tacMat }
  const gecici = <OrmanCizim {...ortak} tacY={AGAC_BOY - 1.6} />
  if (!yuklenebilirMi(slot)) return gecici
  return (
    <YukleHatasi yedek={gecici}>
      <Suspense fallback={gecici}>
        <GlbAgaclar {...ortak} tacY={0} slot={slot} />
      </Suspense>
    </YukleHatasi>
  )
}
