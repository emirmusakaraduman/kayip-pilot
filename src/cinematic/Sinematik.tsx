import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { AssetModel } from '../components/AssetModel'
import { ORTAMLAR, type OrtamAyar } from './ortam'
import { Agaclar, BulutGolgesi, Daglar, GUNES_YON, Gokyuzu, Zemin } from './env'
import { Havuz } from './particles'
import { ENKAZ, KISA, OLAY, TOPLAM, altyaziMetni, heliDurum, kamera, rotorParca } from './timeline'
import { sinematikSesBaslat, type SinematikSes } from '../game/sinematikSes'
import { bip, cizirti } from '../game/audio'
import { useOyun } from '../game/store'
import type { Ortam } from '../game/types'

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const yum = (x: number) => {
  const u = Math.min(1, Math.max(0, x))
  return u * u * (3 - 2 * u)
}

interface SahneProps {
  ayar: OrtamAyar
  kisa: boolean
  baslangic: number
  tRef: React.MutableRefObject<number>
  onDone: () => void
  onAltyazi: (a: { kim: string; metin: string } | null) => void
  kaplama: React.RefObject<HTMLDivElement | null>
}

function Sahne({ ayar, kisa, baslangic, tRef, onDone, onAltyazi, kaplama }: SahneProps) {
  const { camera, gl } = useThree()
  const heliRef = useRef<THREE.Group>(null)
  const rotorRef = useRef<THREE.Group>(null)
  const kopukRotor = useRef<THREE.Group>(null)
  const gunes = useRef<THREE.DirectionalLight>(null)
  const patlamaIsigi = useRef<THREE.PointLight>(null)
  const topRef = useRef<THREE.Mesh>(null)
  const ses = useRef<SinematikSes | null>(null)
  const bitti = useRef(false)
  const once = useRef({ poz: new THREE.Vector3(), t: baslangic, patladi: false, agacPatladi: false, altyazi: '', kelime: 0 })
  const v = useMemo(() => new THREE.Vector3(), [])
  const biriken = useRef({ alev: 0, duman: 0, kor: 0 })

  const havuzlar = useMemo(
    () => ({
      alev: new Havuz(1400, true, 1.5, 0.6),
      duman: new Havuz(1400, false, 1.6, 0.35),
    }),
    [],
  )
  useEffect(() => {
    const h = heliRef.current
    h?.traverse((o) => {
      if (o.name === 'rotor') o.visible = false // yer tutucunun sabit rotoru: kendi dönen rotorumuz var
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    return () => {
      havuzlar.alev.dispose()
      havuzlar.duman.dispose()
      ses.current?.durdur()
    }
  }, [havuzlar])

  useFrame((_, dtHam) => {
    const dt = Math.min(dtHam, 0.05)
    const hiz = kisa ? KISA.hiz : 1
    const t = (tRef.current += dt * hiz)
    const son = kisa ? KISA.son : TOPLAM
    const o = once.current

    if (!ses.current) ses.current = sinematikSesBaslat()
    ses.current?.guncelle(t)

    // — helikopter
    const h = heliDurum(t)
    const g = heliRef.current
    if (g) {
      g.rotation.order = 'YXZ'
      g.position.set(...h.poz)
      g.rotation.set(h.pitch, h.yaw, h.roll)
    }
    const vel = dt > 0 ? v.set(h.poz[0], h.poz[1], h.poz[2]).sub(o.poz).divideScalar(dt) : v.set(0, 0, 0)
    const hx = vel.x, hy = vel.y, hz = vel.z
    o.poz.set(...h.poz)

    if (rotorRef.current) {
      rotorRef.current.visible = t < OLAY.agacCarpma
      rotorRef.current.rotation.y += h.rotorHiz * dt * hiz
    }
    const kp = rotorParca(t)
    if (kopukRotor.current) {
      kopukRotor.current.visible = !!kp
      if (kp) {
        kopukRotor.current.position.set(...kp.poz)
        kopukRotor.current.rotation.set(kp.yerde ? 0.2 : 0.8, kp.donus, kp.yerde ? 0.15 : 0.3)
      }
    }

    // — kamera
    const k = kamera(t)
    camera.position.set(...k.poz)
    camera.lookAt(...k.bak)
    const pc = camera as THREE.PerspectiveCamera
    if (pc.fov !== k.fov) {
      pc.fov = k.fov
      pc.updateProjectionMatrix()
    }

    // — güneş ve gölge kutusu helikoptere eşlenir
    if (gunes.current) {
      const hedef = new THREE.Vector3(...h.poz)
      gunes.current.position.copy(hedef).addScaledVector(GUNES_YON, 90)
      gunes.current.target.position.copy(hedef)
      gunes.current.target.updateMatrixWorld()
    }

    // — parçacıklar
    const olcek = (gl.getDrawingBufferSize(new THREE.Vector2()).y) / (2 * Math.tan((pc.fov * Math.PI) / 360))
    const yangin = yum((t - OLAY.yanginBasla) / 3)
    const yanimda = g ? g.localToWorld(v.set(0.55, 0.55, 0.3)) : v
    const ex = yanimda.x, ey = yanimda.y, ez = yanimda.z
    const b = biriken.current
    b.alev += yangin * 70 * dt * hiz
    b.duman += yangin * 45 * dt * hiz
    while (b.alev >= 1) {
      b.alev--
      havuzlar.alev.emit({
        p: [ex + rnd(-0.15, 0.15), ey + rnd(-0.1, 0.2), ez + rnd(-0.15, 0.15)],
        v: [hx * 0.4 + rnd(-0.8, 0.8), 1.5 + rnd(0, 2) + hy * 0.2, hz * 0.4 + rnd(-0.8, 0.8)],
        omur: rnd(0.5, 1.0), s0: 0.6 + yangin * 0.5, s1: 0.15,
        c0: [1, 0.6, 0.15, 0.7], c1: [0.9, 0.1, 0.02, 0],
      })
    }
    while (b.duman >= 1) {
      b.duman--
      havuzlar.duman.emit({
        p: [ex, ey + 0.3, ez],
        v: [hx * 0.7 + rnd(-0.6, 0.6), 1.5 + rnd(0, 1.5), hz * 0.7 + rnd(-0.6, 0.6)],
        omur: rnd(2.5, 4.5), s0: 0.8, s1: 5 + yangin * 3,
        c0: [0.12, 0.11, 0.11, 0.55], c1: [0.2, 0.19, 0.19, 0],
      })
    }
    // Ağaç tepeleri: yaprak ve dal parçaları
    if (t >= OLAY.agacCarpma && !o.agacPatladi) {
      o.agacPatladi = true
      for (let i = 0; i < 160; i++)
        havuzlar.duman.emit({
          p: [ex + rnd(-1, 1), h.poz[1] + 1.2, h.poz[2] + rnd(-1, 1)],
          v: [rnd(-6, 10), rnd(1, 9), rnd(-7, 5)],
          omur: rnd(0.8, 2), s0: 0.35, s1: 0.2,
          c0: [0.2, 0.45, 0.15, 1], c1: [0.3, 0.25, 0.1, 0],
        })
    }
    // Patlama
    if (t >= OLAY.patlama && !o.patladi) {
      o.patladi = true
      for (let i = 0; i < 320; i++) {
        const a = rnd(0, 6.28), e = rnd(-0.3, 1.2), s = rnd(4, 15)
        havuzlar.alev.emit({
          p: [ENKAZ[0] + rnd(-1, 1), 1.2, ENKAZ[2] + rnd(-1, 1)],
          v: [Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 2, Math.sin(a) * Math.cos(e) * s],
          omur: rnd(0.6, 1.8), s0: rnd(3, 6), s1: 1,
          c0: [1, 0.8, 0.4, 1], c1: [0.9, 0.2, 0.05, 0],
        })
      }
      for (let i = 0; i < 220; i++)
        havuzlar.duman.emit({
          p: [ENKAZ[0] + rnd(-2, 2), 1.5, ENKAZ[2] + rnd(-2, 2)],
          v: [rnd(-6, 6), rnd(2, 10), rnd(-6, 6)],
          omur: rnd(4, 7), s0: 2, s1: 11,
          c0: [0.05, 0.05, 0.05, 0.7], c1: [0.18, 0.17, 0.17, 0],
        })
    }
    if (t >= OLAY.patlama) {
      // Yanan enkaz: çevrede ek alev ve kalın siyah duman
      b.kor += 90 * dt * hiz
      while (b.kor >= 1) {
        b.kor--
        const px = ENKAZ[0] + rnd(-2.5, 2.5), pz = ENKAZ[2] + rnd(-2, 2)
        havuzlar.alev.emit({ p: [px, 0.8, pz], v: [rnd(-0.5, 0.5), rnd(2, 5), rnd(-0.5, 0.5)], omur: rnd(0.6, 1.2), s0: 2.2, s1: 0.4, c0: [1, 0.6, 0.15, 0.85], c1: [0.8, 0.1, 0, 0] })
        if (Math.random() < 0.6)
          havuzlar.duman.emit({ p: [px, 2, pz], v: [rnd(0.5, 2), rnd(3, 5), rnd(-1, 1)], omur: rnd(4, 6), s0: 2, s1: 9, c0: [0.05, 0.05, 0.05, 0.6], c1: [0.2, 0.19, 0.19, 0] })
      }
    }
    havuzlar.alev.update(dt * hiz, olcek)
    havuzlar.duman.update(dt * hiz, olcek)

    const dp = t - OLAY.patlama
    if (topRef.current) {
      topRef.current.visible = dp >= 0 && dp < 1.4
      if (dp >= 0) {
        topRef.current.scale.setScalar(1 + dp * 12)
        ;(topRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - dp / 1.4)
      }
    }
    if (patlamaIsigi.current) patlamaIsigi.current.intensity = dp >= 0 ? 900 * Math.exp(-2.5 * dp) + 60 : 0

    // — altyazı (kelime kelime, sesle eşli)
    const a = altyaziMetni(t)
    const anahtar = a ? a.kim + a.metin : ''
    if (anahtar !== o.altyazi) {
      if (a && a.kelime !== o.kelime && o.altyazi !== '') {
        const sonKelime = a.metin.split(' ').pop() ?? ''
        if (sonKelime.includes('[cızırtı]')) cizirti(0.25)
        else bip(640 + (a.kelime % 3) * 70, 0.03, 0.012)
      } else if (a) cizirti(0.12)
      o.altyazi = anahtar
      o.kelime = a?.kelime ?? 0
      onAltyazi(a ? { kim: a.kim, metin: a.metin } : null)
    }

    // — ekran geçişleri: açılış karartması, patlama parlaması, kapanış karartması
    const kap = kaplama.current
    if (kap) {
      const acilis = 1 - yum((t - (kisa ? KISA.bas : 0)) / 1.0)
      const flas = dp >= 0 ? Math.exp(-5 * dp) * 0.9 : 0
      const kapanis = yum((t - (son - 1.4)) / 1.2)
      kap.style.background = flas > 0.02 ? `rgba(255,235,200,${flas})` : `rgba(0,0,0,${Math.max(acilis, kapanis)})`
    }

    if (t >= son && !bitti.current) {
      bitti.current = true
      onDone()
    }
  })

  return (
    <>
      <fogExp2 attach="fog" args={[ayar.sis, ayar.sisYogunluk]} />
      <Gokyuzu ayar={ayar} />
      <Daglar ayar={ayar} />
      <Zemin ayar={ayar} />
      <BulutGolgesi ayar={ayar} />
      <Agaclar ayar={ayar} />

      <hemisphereLight args={[ayar.gokUst, '#3a3022', 1.0]} />
      <directionalLight
        ref={gunes}
        color={ayar.gunes}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
      />
      <primitive object={gunes.current?.target ?? new THREE.Object3D()} />
      <pointLight ref={patlamaIsigi} position={[ENKAZ[0], 3, ENKAZ[2]]} color="#ff9a40" distance={80} decay={1.6} intensity={0} />

      {/* ortam yansıması: ağda HDR dosyası yok, ışık levhalarından üretilir */}
      <Environment resolution={64} background={false}>
        <Lightformer form="rect" color={ayar.gokUfuk} intensity={4} position={[14, 2, -8]} scale={[30, 6, 1]} />
        <Lightformer form="rect" color={ayar.gokUst} intensity={1.2} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[40, 40, 1]} />
      </Environment>

      <group ref={heliRef}>
        <AssetModel varlik="helikopter" />
        <group ref={rotorRef} position={[0, 1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[6, 0.04, 0.22]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[6, 0.04, 0.22]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      </group>
      <group ref={kopukRotor} visible={false}>
        <mesh castShadow>
          <boxGeometry args={[6, 0.05, 0.22]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[5.2, 0.05, 0.22]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      <mesh ref={topRef} position={[ENKAZ[0], 2, ENKAZ[2]]} visible={false}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#ffb050" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <primitive object={havuzlar.duman.points} />
      <primitive object={havuzlar.alev.points} />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

export interface SinematikProps {
  ortam?: Ortam
  /** Bölüm başı kısa sürüm (yaklaşık 16 sn). */
  kisa?: boolean
  /** Geliştirme: belirli bir saniyeden başlat. */
  baslangic?: number
  onDone: () => void
}

export function Sinematik({ ortam = 'karadeniz', kisa = false, baslangic, onDone }: SinematikProps) {
  const bas = baslangic ?? (kisa ? KISA.bas : 0)
  const tRef = useRef(bas)
  const kaplama = useRef<HTMLDivElement>(null)
  const [alt, setAlt] = useState<{ kim: string; metin: string } | null>(null)
  const sesAcik = useOyun((s) => s.sesAcik)
  const sesDegistir = useOyun((s) => s.sesDegistir)
  const ayar = ORTAMLAR[ortam]
  const bitirildi = useRef(false)
  const bitir = () => {
    if (bitirildi.current) return
    bitirildi.current = true
    onDone()
  }

  return (
    <div className="sinema">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 36, near: 0.3, far: 4000, position: [-14, 3, 40] }}
        gl={{ toneMapping: THREE.NoToneMapping, antialias: false, preserveDrawingBuffer: import.meta.env.DEV && baslangic !== undefined }}
      >
        <Sahne ayar={ayar} kisa={kisa} baslangic={bas} tRef={tRef} onDone={bitir} onAltyazi={setAlt} kaplama={kaplama} />
      </Canvas>
      <div ref={kaplama} className="sinema-kaplama" />
      <div className="sinema-ust">
        <button className="kucuk" onClick={sesDegistir}>{sesAcik ? '🔊 Ses' : '🔇 Ses'}</button>
        <button className="kucuk" onClick={bitir}>Atla ▶▶</button>
      </div>
      {alt && (
        <div className="sinema-alt">
          <b className={alt.kim === 'DENİZ' ? 'deniz' : 'merkez'}>{alt.kim}:</b> {alt.metin}
        </div>
      )}
    </div>
  )
}
