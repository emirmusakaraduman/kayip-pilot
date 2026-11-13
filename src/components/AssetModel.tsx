import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as iskeletKlonla } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { ASSETS, yuklenebilirMi, type AssetId, type AssetSlot } from '../assets/registry'
import { Placeholder } from './Placeholders'

/** Modeli yükler, kopyalar (iskeletli modeller için güvenli), sınır kutusundan ortalar, ölçekler ve yere oturtur. */
function GlbModel({ slot, oturan }: { slot: AssetSlot; oturan: boolean }) {
  const { scene } = useGLTF(slot.url!)
  const nesne = useMemo(() => {
    const kopya = iskeletKlonla(scene)
    // Kemik pozu: eksen model uzayında verilir; ebeveyn çerçevesine çevrilip dönüş öne eklenir.
    for (const poz of slot.kemikPozu ?? []) {
      kopya.updateMatrixWorld(true)
      const re = new RegExp(poz.ad)
      let kemik: THREE.Object3D | null = null
      kopya.traverse((o) => { if (!kemik && (o as THREE.Bone).isBone && re.test(o.name)) kemik = o })
      const k = kemik as THREE.Object3D | null
      if (!k?.parent) continue
      const kq = kopya.getWorldQuaternion(new THREE.Quaternion())
      const pq = k.parent.getWorldQuaternion(new THREE.Quaternion())
      const eksen = new THREE.Vector3(...poz.eksen).applyQuaternion(kq).applyQuaternion(pq.invert())
      k.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(eksen, poz.aci))
    }
    kopya.rotation.y = slot.donusY ?? 0
    kopya.updateMatrixWorld(true)
    const kutu = new THREE.Box3().setFromObject(kopya)
    const boyut = kutu.getSize(new THREE.Vector3())
    const orta = kutu.getCenter(new THREE.Vector3())
    if (slot.kes) {
      // bacak kısmını at: ağırlık merkezi kesim hizasının altında kalan üçgenleri sil (iskeletsiz model)
      const kesY = kutu.min.y + slot.kes * boyut.y
      const v = new THREE.Vector3()
      kopya.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const g = m.geometry as THREE.BufferGeometry
        const pos = g.attributes.position
        const dizin = g.index
        const adet = dizin ? dizin.count : pos.count
        const kalan: number[] = []
        for (let i = 0; i < adet; i += 3) {
          const id = [0, 1, 2].map((k) => (dizin ? dizin.getX(i + k) : i + k))
          let ys = 0
          for (const j of id) ys += v.fromBufferAttribute(pos, j).applyMatrix4(m.matrixWorld).y
          if (ys / 3 >= kesY) kalan.push(...id)
        }
        const ng = g.clone()
        ng.setIndex(kalan)
        m.geometry = ng
      })
    }
    const olcek = slot.hedefBoy
      ? slot.hedefBoy / boyut.y
      : slot.hedefUzunluk
        ? slot.hedefUzunluk / Math.max(boyut.x, boyut.z)
        : 1
    const duzen = new THREE.Group()
    duzen.name = 'duzen'
    duzen.add(kopya)
    duzen.scale.setScalar(olcek)
    duzen.position.set(-orta.x * olcek, (slot.taban ?? 0) - (oturan ? (slot.oturma ?? 0) : 0) - kutu.min.y * olcek, -orta.z * olcek)
    return duzen
  }, [scene, slot, oturan])
  return <primitive object={nesne} />
}

/** GLB dosyası yüklenemezse (404, bozuk dosya) oyunu çökertmek yerine yer tutucuya döner. */
export class YukleHatasi extends Component<{ yedek: ReactNode; children: ReactNode }, { hata: boolean }> {
  state = { hata: false }
  static getDerivedStateFromError() {
    return { hata: true }
  }
  componentDidCatch(e: unknown) {
    console.warn('[varlık] model yüklenemedi, yer tutucu kullanılıyor:', e)
  }
  render() {
    return this.state.hata ? this.props.yedek : this.props.children
  }
}

/** Varlık kimliğiyle çağrılır: GLB varsa onu, yoksa yer tutucuyu gösterir. */
export function AssetModel({ varlik, oturan = false, ...props }: { varlik: AssetId; oturan?: boolean } & React.ComponentProps<'group'>) {
  const slot: AssetSlot = ASSETS[varlik]
  const placeholder = <Placeholder kind={slot.placeholder} />
  return (
    <group {...props}>
      {yuklenebilirMi(slot) ? (
        <YukleHatasi yedek={placeholder}>
          <Suspense fallback={placeholder}>
            <GlbModel slot={slot} oturan={oturan} />
          </Suspense>
        </YukleHatasi>
      ) : (
        placeholder
      )}
    </group>
  )
}
