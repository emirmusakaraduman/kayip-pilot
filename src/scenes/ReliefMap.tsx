import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { BOLGELER, EN_BOY, LAT0, LAT1, LON0, LON1, bolgeOf, dokuCiz, haritaUret, icerde, type Bolge } from '../map/turkey'

const KABARTMA = 0.018 // km başına yükseklik (abartılı)

export type Tiklama = { bolge: Bolge; enlem: number; boylam: number }

/** Harita dokusu: iklim maskesi + nehirler + göller. vurgu bölgeleri parlatılır. */
function useDoku(vurgu: Bolge[]) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return { canvas, tex }
  }, [])
  const anahtar = vurgu.join(',')
  useEffect(() => {
    dokuCiz(haritaUret(), canvas, anahtar ? (anahtar.split(',') as Bolge[]) : [])
    tex.needsUpdate = true
  }, [anahtar, canvas, tex])
  return tex
}

/** Masaüstü kabartma harita. Yükseklik ağı iklim maskesinden üretilir. */
export function ReliefMap({
  genislik = 2,
  vurgu = [],
  onTikla,
  ...props
}: { genislik?: number; vurgu?: Bolge[]; onTikla?: (t: Tiklama) => void } & React.ComponentProps<'group'>) {
  const tex = useDoku(vurgu)
  const yukseklik = genislik / EN_BOY
  const geo = useMemo(() => {
    const v = haritaUret()
    const sx = 200
    const sy = Math.round(sx / EN_BOY)
    const g = new THREE.PlaneGeometry(genislik, yukseklik, sx, sy)
    const pos = g.attributes.position
    for (let j = 0; j <= sy; j++)
      for (let i = 0; i <= sx; i++) {
        const px = Math.min(v.w - 1, Math.round((i / sx) * (v.w - 1)))
        const py = Math.min(v.h - 1, Math.round((j / sy) * (v.h - 1)))
        pos.setZ(j * (sx + 1) + i, v.yuk[py * v.w + px] * KABARTMA * (genislik / 2))
      }
    g.computeVertexNormals()
    return g
  }, [genislik, yukseklik])

  const tikla = (e: ThreeEvent<MouseEvent>) => {
    if (!onTikla || !e.uv) return
    e.stopPropagation()
    const boylam = LON0 + e.uv.x * (LON1 - LON0)
    const enlem = LAT0 + e.uv.y * (LAT1 - LAT0)
    if (!icerde(boylam, enlem)) return
    onTikla({ bolge: bolgeOf(boylam, enlem), enlem, boylam })
  }

  return (
    <group {...props}>
      <mesh position={[0, -0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[genislik + 0.06, yukseklik + 0.06, 0.06]} />
        <meshStandardMaterial color="#3b2a1a" />
      </mesh>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} onClick={tikla}>
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Duvardaki düz harita (aynı doku). */
export function DuvarHaritasi({ genislik = 3, vurgu = [], ...props }: { genislik?: number; vurgu?: Bolge[] } & React.ComponentProps<'group'>) {
  const tex = useDoku(vurgu)
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[genislik + 0.1, genislik / EN_BOY + 0.1, 0.04]} />
        <meshStandardMaterial color="#2a1d12" />
      </mesh>
      <mesh>
        <planeGeometry args={[genislik, genislik / EN_BOY]} />
        <meshStandardMaterial map={tex} />
      </mesh>
    </group>
  )
}

export { BOLGELER }
