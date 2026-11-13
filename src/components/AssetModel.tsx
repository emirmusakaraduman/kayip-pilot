import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as iskeletKlonla } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { ASSETS, yuklenebilirMi, type AssetId, type AssetSlot } from '../assets/registry'
import { Placeholder } from './Placeholders'

/** Modeli yükler, kopyalar (iskeletli modeller için güvenli), sınır kutusundan ortalar, ölçekler ve yere oturtur. */
function GlbModel({ slot }: { slot: AssetSlot }) {
  const { scene } = useGLTF(slot.url!)
  const nesne = useMemo(() => {
    const kopya = iskeletKlonla(scene)
    kopya.rotation.y = slot.donusY ?? 0
    kopya.updateMatrixWorld(true)
    const kutu = new THREE.Box3().setFromObject(kopya)
    const boyut = kutu.getSize(new THREE.Vector3())
    const orta = kutu.getCenter(new THREE.Vector3())
    const olcek = slot.hedefBoy
      ? slot.hedefBoy / boyut.y
      : slot.hedefUzunluk
        ? slot.hedefUzunluk / Math.max(boyut.x, boyut.z)
        : 1
    const duzen = new THREE.Group()
    duzen.name = 'duzen'
    duzen.add(kopya)
    duzen.scale.setScalar(olcek)
    duzen.position.set(-orta.x * olcek, (slot.taban ?? 0) - kutu.min.y * olcek, -orta.z * olcek)
    return duzen
  }, [scene, slot])
  return <primitive object={nesne} />
}

/** GLB dosyası yüklenemezse (404, bozuk dosya) oyunu çökertmek yerine yer tutucuya döner. */
class YukleHatasi extends Component<{ yedek: ReactNode; children: ReactNode }, { hata: boolean }> {
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
export function AssetModel({ varlik, ...props }: { varlik: AssetId } & React.ComponentProps<'group'>) {
  const slot: AssetSlot = ASSETS[varlik]
  const placeholder = <Placeholder kind={slot.placeholder} />
  return (
    <group {...props}>
      {yuklenebilirMi(slot) ? (
        <YukleHatasi yedek={placeholder}>
          <Suspense fallback={placeholder}>
            <GlbModel slot={slot} />
          </Suspense>
        </YukleHatasi>
      ) : (
        placeholder
      )}
    </group>
  )
}
