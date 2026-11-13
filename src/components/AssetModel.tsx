import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import { ASSETS, yuklenebilirMi, type AssetId, type AssetSlot } from '../assets/registry'
import { Placeholder } from './Placeholders'

function GlbModel({ slot }: { slot: AssetSlot }) {
  const { scene } = useGLTF(slot.url!)
  return <primitive object={scene.clone(true)} scale={slot.olcek ?? 1} position={[0, slot.yOfset ?? 0, 0]} />
}

/** Varlık kimliğiyle çağrılır: GLB varsa onu, yoksa yer tutucuyu gösterir. */
export function AssetModel({ varlik, ...props }: { varlik: AssetId } & React.ComponentProps<'group'>) {
  const slot: AssetSlot = ASSETS[varlik]
  const placeholder = <Placeholder kind={slot.placeholder} />
  return (
    <group {...props}>
      {yuklenebilirMi(slot) ? (
        <Suspense fallback={placeholder}>
          <GlbModel slot={slot} />
        </Suspense>
      ) : (
        placeholder
      )}
    </group>
  )
}
