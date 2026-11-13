import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrtamAyar } from './ortam'
import { ZEMIN_DOKU } from './dokular'
import { arazi, rastgele, toprakAgirlik } from './orman'

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

/** Dalgalı arazi: yükseklik `arazi()` ile; açıklık yeşil çayır, yalnızca hafif toprak lekeli. PBR dokuları dokular.ts'ten takılabilir. */
export function Zemin({ ayar }: { ayar: OrtamAyar }) {
  const tex = useMemo(() => {
    const t = tarlaDokusu(ayar.tarla)
    t.repeat.set(ZEMIN_DOKU.tekrar, ZEMIN_DOKU.tekrar)
    return t
  }, [ayar])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(900, 900, 300, 300)
    g.rotateX(-Math.PI / 2)
    g.translate(40, 0, 0)
    const p = g.attributes.position
    const toprak = new Float32Array(p.count)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i)
      p.setY(i, arazi(x, z))
      toprak[i] = toprakAgirlik(x, z)
    }
    g.setAttribute('aToprak', new THREE.BufferAttribute(toprak, 1))
    g.computeVertexNormals()
    return g
  }, [])
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aToprak;\nvarying float vToprak;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvToprak = aToprak;')
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vToprak;')
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          vec3 toprak = vec3(0.46, 0.32, 0.2) * (0.7 + 1.1 * diffuseColor.g);
          diffuseColor.rgb = mix(diffuseColor.rgb, toprak, vToprak * 0.18);
          diffuseColor.rgb *= vec3(1.0 + 0.9 * vToprak, 1.0 + 1.5 * vToprak, 1.0 + 0.5 * vToprak);`,
        )
    }
    return m
  }, [tex])

  // Gerçek PBR dokuları verilmişse yer tutucunun yerine geçer.
  useEffect(() => {
    const yukle = new THREE.TextureLoader()
    const hazirla = (url: string | null, renk: boolean, uygula: (t: THREE.Texture) => void) => {
      if (!url) return
      yukle.load(url, (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(ZEMIN_DOKU.tekrar, ZEMIN_DOKU.tekrar)
        t.anisotropy = 8
        if (renk) t.colorSpace = THREE.SRGBColorSpace
        uygula(t)
        mat.needsUpdate = true
      })
    }
    hazirla(ZEMIN_DOKU.renk, true, (t) => { mat.map = t })
    hazirla(ZEMIN_DOKU.normal, false, (t) => { mat.normalMap = t })
    hazirla(ZEMIN_DOKU.puruz, false, (t) => { mat.roughnessMap = t })
  }, [mat])

  return (
    <>
      <mesh geometry={geo} material={mat} receiveShadow />
      {/* arazinin ötesi: düz taban (arazi kenarlarda zaten sıfıra iner) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
    </>
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
