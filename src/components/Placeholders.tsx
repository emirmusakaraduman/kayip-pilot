import type { PlaceholderKind } from '../assets/registry'

export function PlaceholderHelicopter() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.9, 3]} />
        <meshStandardMaterial color="#c8412f" />
      </mesh>
      <mesh position={[0, 0.2, -2.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 2.2, 8]} />
        <meshStandardMaterial color="#b0b0b0" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh name="rotor" position={[0, 1, 0]}>
        <boxGeometry args={[6, 0.04, 0.2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.15, 0.6, -3.4]}>
        <boxGeometry args={[0.04, 0.5, 0.3]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  )
}

export function PlaceholderTree({ tur }: { tur: 'tree-pine' | 'tree-broadleaf' | 'tree-palm' }) {
  const renk = tur === 'tree-pine' ? '#1f5a32' : tur === 'tree-broadleaf' ? '#3f7a2c' : '#7f8f3a'
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
        <meshStandardMaterial color="#5b3d22" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[tur === 'tree-pine' ? 0.9 : 1.2, 3, 8]} />
        <meshStandardMaterial color={renk} />
      </mesh>
    </group>
  )
}

export function PlaceholderPerson() {
  return (
    <mesh position={[0, 0.9, 0]}>
      <capsuleGeometry args={[0.3, 1.0, 4, 10]} />
      <meshStandardMaterial color="#d9a066" />
    </mesh>
  )
}

export function Placeholder({ kind }: { kind: PlaceholderKind }) {
  if (kind === 'helicopter') return <PlaceholderHelicopter />
  if (kind === 'person') return <PlaceholderPerson />
  return <PlaceholderTree tur={kind} />
}
