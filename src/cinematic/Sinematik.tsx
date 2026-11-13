import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { AssetModel } from '../components/AssetModel'
import { ASSETS } from '../assets/registry'
import { ORTAMLAR, type OrtamAyar } from './ortam'
import { BulutGolgesi, Daglar, GUNES_YON, Gokyuzu, Zemin } from './env'
import { Agaclar } from './ormanCizim'
import { ormanUret } from './orman'
import { HDRI_URL } from './dokular'
import { Havuz } from './particles'
import { ALTYAZILAR, KISA, OLAY, SURUKLEME, TOPLAM, altyaziMetni, heliDurum, kamera, rotorParca } from './timeline'
import { sinematikSesBaslat, type SinematikSes } from '../game/sinematikSes'
import { bip, cizirti } from '../game/audio'
import { konus, konusmaDurdur, konusmaHazirla } from '../game/konusma'
import { useOyun } from '../game/store'
import type { Ortam } from '../game/types'

/** Deniz'in kabindeki koltuk noktası (helikopter-yerel: +z burun, +x sol) ve ölçeği. */
const DENIZ_KOLTUK: [number, number, number] = [-0.3, 0.22, 3.0]
const DENIZ_OLCEK = 0.48

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
  const kopukBlade = useRef<THREE.Group>(null)
  const deniz = useRef<THREE.Group>(null)
  // GLB helikopterin adlandırılmış rotor düğümleri (yükleme asenkron; hazır olana dek yer tutucu rotor kullanılır)
  const glb = useRef<{
    ana: THREE.Object3D; kuy: THREE.Object3D | null
    qAna: THREE.Quaternion; qKuy: THREE.Quaternion
    eksAna: THREE.Vector3; eksKuy: THREE.Vector3
    aciAna: number; aciKuy: number
    kopuk: boolean; kok: [number, number, number] | null
  } | null>(null)
  const qs = useMemo(() => new THREE.Quaternion(), [])
  const gunes = useRef<THREE.DirectionalLight>(null)
  const ses = useRef<SinematikSes | null>(null)
  const bitti = useRef(false)
  const once = useRef({ poz: new THREE.Vector3(), t: baslangic, agacPatladi: false, tozPatladi: false, kirilma: 0, altyazi: '', kelime: 0 })
  const v = useMemo(() => new THREE.Vector3(), [])
  const biriken = useRef({ alev: 0, duman: 0, toz: 0, kivilcim: 0 })
  const orman = useMemo(() => ormanUret(ayar), [ayar])

  const havuzlar = useMemo(
    () => ({
      alev: new Havuz(1400, true, 1.5, 0.6),
      duman: new Havuz(1400, false, 1.6, 0.35),
      // yaprak/dal parçaları: duman gibi süzülmez; yerçekimiyle düşer, az hava direnci, opak
      yaprak: new Havuz(2600, false, -9, 0.12),
    }),
    [],
  )
  useEffect(() => {
    const h = heliRef.current
    h?.traverse((o) => {
      if (o.name === 'rotor') o.visible = false // yer tutucunun sabit rotoru: kendi dönen rotorumuz var
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    void konusmaHazirla()
    return () => {
      havuzlar.alev.dispose()
      havuzlar.duman.dispose()
      havuzlar.yaprak.dispose()
      ses.current?.durdur()
      konusmaDurdur()
    }
  }, [havuzlar])

  useFrame((_, dtHam) => {
    const dt = Math.min(dtHam, 0.05)
    const hiz = import.meta.env.DEV && new URLSearchParams(location.search).has('dondur') ? 0 : kisa ? KISA.hiz : 1 // ?dondur: geliştirmede kareyi dondurur
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

    // — GLB helikopter: rotorları ada göre bul, döndür, ağaca çarpınca ana rotoru kopar
    if (!glb.current && g) {
      const p = ASSETS.helikopter.parcalar
      const ana = g.getObjectByName(p.anaRotor)
      if (ana?.parent) {
        g.updateMatrixWorld(true)
        const gq = g.getWorldQuaternion(new THREE.Quaternion())
        // heli-yerel bir ekseni, düğümün ebeveyn çerçevesine çevirir (düğümün kendi dönüşü bu çerçevede uygulanır)
        const eksen = (yerel: THREE.Vector3, d: THREE.Object3D) => {
          const pq = d.parent!.getWorldQuaternion(new THREE.Quaternion())
          return yerel.clone().applyQuaternion(gq.clone().invert().multiply(pq).invert())
        }
        const kuy = g.getObjectByName(p.kuyrukRotor) ?? null
        glb.current = {
          ana, kuy,
          qAna: ana.quaternion.clone(), qKuy: kuy ? kuy.quaternion.clone() : new THREE.Quaternion(),
          eksAna: eksen(new THREE.Vector3(0, 1, 0), ana), // ana rotor: heli yukarı ekseni
          eksKuy: kuy ? eksen(new THREE.Vector3(1, 0, 0), kuy) : new THREE.Vector3(1, 0, 0), // kuyruk rotoru: yanal eksen
          aciAna: 0, aciKuy: 0, kopuk: false, kok: null,
        }
        g.traverse((m) => {
          const me = m as THREE.Mesh
          if (!me.isMesh) return
          me.castShadow = true
          // Camlar yarı saydam: kabindeki Deniz dışarıdan görünsün
          const mat = me.material as THREE.MeshStandardMaterial
          // Plastiğimsi/aşırı parlak yüzey: gövde boyası pürüzlü ve az metalik, ortam yansıması kısık (gerçek hava aracı boyası)
          if (mat?.isMeshStandardMaterial && mat.name !== 'glass') {
            const k = mat.clone()
            k.metalness = Math.min(k.metalness, 0.35)
            k.roughness = Math.min(1, Math.max(k.roughness, 0.55))
            k.envMapIntensity = 0.55
            me.material = k
          }
          if (mat?.name === 'glass') {
            const k = mat.clone()
            k.transparent = true
            k.opacity = 0.22
            k.depthWrite = false
            me.material = k
            me.castShadow = false
          }
        })
        if (kopukBlade.current) kopukBlade.current.visible = false
      }
    }
    const G = glb.current
    if (G) {
      G.aciAna += h.rotorHiz * dt * hiz
      G.aciKuy += (t < OLAY.yereInis ? 38 * (1 - 0.7 * yum((t - OLAY.kuyrukKaybi) / 10)) : 0) * dt * hiz
      if (!G.kopuk) G.ana.quaternion.copy(G.qAna).premultiply(qs.setFromAxisAngle(G.eksAna, G.aciAna))
      if (G.kuy) G.kuy.quaternion.copy(G.qKuy).premultiply(qs.setFromAxisAngle(G.eksKuy, G.aciKuy))
      if (!G.kopuk && t >= OLAY.agacCarpma && g) {
        G.kopuk = true
        g.updateMatrixWorld(true)
        const poz = G.ana.getWorldPosition(new THREE.Vector3())
        G.kok = [poz.x, poz.y, poz.z]
        const klon = G.ana.clone(true)
        klon.position.set(0, 0, 0)
        klon.quaternion.copy(G.ana.getWorldQuaternion(new THREE.Quaternion()))
        klon.scale.copy(G.ana.getWorldScale(new THREE.Vector3()))
        kopukRotor.current?.add(klon)
        G.ana.visible = false
      }
    }
    if (rotorRef.current) {
      rotorRef.current.visible = !G && t < OLAY.agacCarpma
      rotorRef.current.rotation.y += h.rotorHiz * dt * hiz
    }
    const kp = rotorParca(t, G?.kok ?? undefined)
    if (kopukRotor.current) {
      kopukRotor.current.visible = !!kp
      if (kp) {
        kopukRotor.current.position.set(...kp.poz)
        kopukRotor.current.rotation.set(kp.yerde ? 0.2 : 0.8, kp.donus, kp.yerde ? 0.15 : 0.3)
      }
    }

    // — Deniz (kabinde panik): yangınla birlikte titrer, başını sağa sola çevirir
    if (deniz.current) {
      const pn = yum((t - OLAY.yanginBasla) / 2)
      deniz.current.rotation.z = 0.12 * Math.sin(13 * t) * pn
      deniz.current.rotation.y = 0.5 * Math.sin(2.6 * t) * pn
      deniz.current.position.y = DENIZ_KOLTUK[1] + 0.02 * Math.sin(30 * t) * pn
    }

    // — kamera
    const k = kamera(t)
    camera.position.set(...k.poz)
    camera.lookAt(...k.bak)
    // Geliştirme: ?kam=x,y,z,bx,by,bz → helikopter-yerel deneme kamerası (kabin yerleşimini ayarlamak için)
    const deneme = import.meta.env.DEV ? new URLSearchParams(location.search).get('kam') : null
    if (deneme && g) {
      const n = deneme.split(',').map(Number)
      g.updateMatrixWorld(true)
      camera.position.copy(g.localToWorld(new THREE.Vector3(n[0], n[1], n[2])))
      camera.lookAt(g.localToWorld(new THREE.Vector3(n[3], n[4], n[5])))
      ;(camera as THREE.PerspectiveCamera).fov = 40
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
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
    // Kırılan ağaç tepesinden yaprak/dal fırlatır: önce yukarı ve helikopterin gittiği yöne savrulur, sonra yerçekimiyle düşer
    const yaprakFirlat = (px: number, py: number, pz: number, guc: number) => {
      const dal = Math.random() < 0.18
      havuzlar.yaprak.emit({
        p: [px, py, pz],
        v: [rnd(0.5, 7) * guc + Math.max(0, hx) * 0.5, rnd(2, 10) * guc, rnd(-5, 5) * guc],
        omur: rnd(1.8, 3.2), s0: dal ? rnd(0.22, 0.3) : rnd(0.32, 0.6), s1: dal ? 0.18 : rnd(0.22, 0.4),
        c0: dal ? [0.3, 0.2, 0.1, 1] : [rnd(0.12, 0.3), rnd(0.35, 0.6), rnd(0.08, 0.16), 1],
        c1: dal ? [0.25, 0.17, 0.09, 0] : [0.28, 0.4, 0.1, 0],
      })
    }
    const olcek = (gl.getDrawingBufferSize(new THREE.Vector2()).y) / (2 * Math.tan((pc.fov * Math.PI) / 360))
    const yangin = yum((t - OLAY.yanginBasla) / 3)
    const motor = ASSETS.helikopter.motorNoktasi
    const yanimda = g ? g.localToWorld(glb.current ? v.set(motor[0], motor[1], motor[2]) : v.set(0.55, 0.55, 0.3)) : v
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
    // Kıvılcımlar: arıza anında sol motordan fırlayan ışıltılar
    if (t > OLAY.yanginBasla - 0.6 && t < OLAY.agacCarpma && Math.random() < 0.5 + yangin * 0.3)
      havuzlar.alev.emit({
        p: [ex, ey, ez],
        v: [hx * 0.5 + rnd(-5, 5), rnd(0, 4) + hy * 0.3, hz * 0.5 + rnd(-5, 5)],
        omur: rnd(0.25, 0.6), s0: 0.18, s1: 0.05,
        c0: [1, 0.9, 0.5, 1], c1: [1, 0.4, 0.1, 0],
      })
    // Ağaç tepeleri: pervane çarpınca yaprak ve dal parçaları
    if (t >= OLAY.agacCarpma && !o.agacPatladi) {
      o.agacPatladi = true
      for (let i = 0; i < 220; i++) yaprakFirlat(ex + rnd(-1.5, 1.5), h.poz[1] + 1.2, h.poz[2] + rnd(-1.5, 1.5), 1.6)
    }
    // Her kırılan ağacın tepesinden küçük bir yaprak/dal sağanağı
    while (o.kirilma < orman.kirilmalar.length && orman.kirilmalar[o.kirilma].t <= t) {
      const k = orman.kirilmalar[o.kirilma++]
      for (let i = 0; i < 55; i++) yaprakFirlat(k.p[0] + rnd(-0.8, 0.8), k.p[1] - rnd(0, 1.4), k.p[2] + rnd(-0.8, 0.8), 1)
    }
    // Yere inişte toz/toprak: sert inişte bir patlama, sürüklenirken sürekli, yavaşladıkça azalır
    const yerde = t >= OLAY.yereInis && t < OLAY.yereInis + SURUKLEME + 0.8
    if (t >= OLAY.yereInis && !o.tozPatladi) {
      o.tozPatladi = true
      for (let i = 0; i < 140; i++) {
        const a = rnd(0, 6.28), s = rnd(1.5, 6)
        havuzlar.duman.emit({
          p: [h.poz[0] + rnd(-2, 2), 0.3, h.poz[2] + rnd(-2, 2)],
          v: [Math.cos(a) * s + hx * 0.3, rnd(0.5, 3.5), Math.sin(a) * s],
          omur: rnd(1.5, 3), s0: 1, s1: rnd(3, 6),
          c0: [0.42, 0.33, 0.22, 0.6], c1: [0.5, 0.42, 0.3, 0],
        })
      }
    }
    if (yerde) {
      const kalan = 1 - Math.min(1, (t - OLAY.yereInis) / (SURUKLEME + 0.8))
      b.toz += 130 * kalan * dt * hiz
      while (b.toz >= 1) {
        b.toz--
        havuzlar.duman.emit({
          p: [h.poz[0] + rnd(-3, 3), 0.25, h.poz[2] + rnd(-1.6, 1.6)],
          v: [rnd(-1, 2) + hx * 0.15, rnd(0.6, 2.4), rnd(-2.2, 2.2)],
          omur: rnd(1.2, 2.6), s0: 0.8, s1: rnd(2.5, 4.5),
          c0: [0.42, 0.33, 0.22, 0.5], c1: [0.5, 0.42, 0.3, 0],
        })
      }
      // metal yere sürtünürken birkaç ufak kıvılcım (patlama değil)
      b.kivilcim += 30 * kalan * dt * hiz
      while (b.kivilcim >= 1) {
        b.kivilcim--
        havuzlar.alev.emit({
          p: [h.poz[0] + rnd(-2, 2), 0.2, h.poz[2] + rnd(-1, 1)],
          v: [rnd(0, 4), rnd(1, 3), rnd(-2, 2)],
          omur: rnd(0.2, 0.5), s0: 0.12, s1: 0.04,
          c0: [1, 0.85, 0.5, 1], c1: [1, 0.4, 0.1, 0],
        })
      }
    }
    havuzlar.alev.update(dt * hiz, olcek)
    havuzlar.duman.update(dt * hiz, olcek)
    havuzlar.yaprak.update(dt * hiz, olcek)

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
      if (a) { const i = ALTYAZILAR.findIndex((x) => x.t0 === a.anahtar); if (i >= 0) konus(i, ALTYAZILAR[i].kim, ALTYAZILAR[i].metin, (ALTYAZILAR[i].t1 - ALTYAZILAR[i].t0) / (kisa ? KISA.hiz : 1), kisa ? KISA.hiz : 1) }
      else konusmaDurdur()
    }

    // — ekran geçişleri: açılış karartması, duman, kapanış karartması (patlama parlaması yok)
    const kap = kaplama.current
    if (kap) {
      const acilis = 1 - yum((t - (kisa ? KISA.bas : 0)) / 1.0)
      // Son 4,5 sn: kalın duman ekranı kaplar, sonra tam karartma (kısa sürümde yalnız karartma)
      const duman = kisa ? 0 : yum((t - (son - 4.5)) / 3.5)
      const kapanis = yum((t - (son - 1.4)) / 1.2)
      kap.style.background = `radial-gradient(ellipse at 50% 60%, rgba(40,34,32,${duman * 0.95}) 0%, rgba(8,7,7,${duman}) 75%), rgba(0,0,0,${Math.max(acilis, kapanis)})`
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
      <Agaclar ayar={ayar} orman={orman} tRef={tRef} />

      <hemisphereLight args={[ayar.gokUst, '#4a3c2a', 1.5]} />
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
        shadow-bias={-0.0003}
        shadow-normalBias={0.05}
      />
      <primitive object={gunes.current?.target ?? new THREE.Object3D()} />

      {/* ortam yansıması: dokular.ts'te HDRI_URL verilirse HDRI, yoksa ışık levhalarından üretilen ortam */}
      {HDRI_URL ? (
        <Environment files={HDRI_URL} background={false} />
      ) : (
        <Environment resolution={128} background={false}>
          <Lightformer form="rect" color={ayar.gokUfuk} intensity={4} position={[14, 2, -8]} scale={[30, 6, 1]} />
          <Lightformer form="rect" color={ayar.gokUst} intensity={1.2} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[40, 40, 1]} />
          <Lightformer form="rect" color="#ffffff" intensity={0.6} position={[-10, 6, 12]} scale={[24, 10, 1]} />
        </Environment>
      )}

      <group ref={heliRef}>
        <AssetModel varlik="helikopter" />
        <group ref={deniz} position={DENIZ_KOLTUK}>
          <AssetModel varlik="deniz" scale={DENIZ_OLCEK} />
        </group>
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
        <group ref={kopukBlade}>
          <mesh castShadow>
            <boxGeometry args={[6, 0.05, 0.22]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[5.2, 0.05, 0.22]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      </group>

      <primitive object={havuzlar.duman.points} />
      <primitive object={havuzlar.yaprak.points} />
      <primitive object={havuzlar.alev.points} />

      <EffectComposer multisampling={0} enableNormalPass>
        <SSAO samples={16} rings={5} radius={0.1} intensity={6} luminanceInfluence={0.6} bias={0.03} distanceScaling worldDistanceThreshold={40} worldDistanceFalloff={12} worldProximityThreshold={1.2} worldProximityFalloff={1.5} color="#0a0805" />
        <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
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
