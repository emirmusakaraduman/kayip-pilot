import * as THREE from 'three'

type V3 = [number, number, number]
type Renk = [number, number, number, number]

export interface Salim {
  p: V3
  v: V3
  omur: number
  s0: number
  s1: number
  c0: Renk
  c1: Renk
}

const VERT = /* glsl */ `
attribute float aSize;
attribute vec4 aColor;
uniform float uScale;
varying vec4 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
varying vec4 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  gl_FragColor = vec4(vColor.rgb, vColor.a * a * a);
}`

/** Tek çizim çağrısıyla çizilen parçacık havuzu (alev, duman, kıvılcım, yaprak). */
export class Havuz {
  readonly points: THREE.Points
  private readonly n: number
  private readonly pos: Float32Array
  private readonly vel: Float32Array
  private readonly kalan: Float32Array
  private readonly toplam: Float32Array
  private readonly s0: Float32Array
  private readonly s1: Float32Array
  private readonly c0: Float32Array
  private readonly c1: Float32Array
  private readonly renk: Float32Array
  private readonly boyut: Float32Array
  private readonly mat: THREE.ShaderMaterial
  private readonly kaldirma: number
  private readonly surtunme: number
  private imlec = 0

  constructor(n: number, ekle: boolean, kaldirma: number, surtunme: number) {
    this.n = n
    this.kaldirma = kaldirma
    this.surtunme = surtunme
    this.pos = new Float32Array(n * 3)
    this.vel = new Float32Array(n * 3)
    this.kalan = new Float32Array(n)
    this.toplam = new Float32Array(n).fill(1)
    this.s0 = new Float32Array(n)
    this.s1 = new Float32Array(n)
    this.c0 = new Float32Array(n * 4)
    this.c1 = new Float32Array(n * 4)
    this.renk = new Float32Array(n * 4)
    this.boyut = new Float32Array(n)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aColor', new THREE.BufferAttribute(this.renk, 4).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSize', new THREE.BufferAttribute(this.boyut, 1).setUsage(THREE.DynamicDrawUsage))
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: ekle ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    this.points = new THREE.Points(g, this.mat)
    this.points.frustumCulled = false
  }

  emit(s: Salim) {
    const i = this.imlec
    this.imlec = (i + 1) % this.n
    this.pos.set(s.p, i * 3)
    this.vel.set(s.v, i * 3)
    this.kalan[i] = this.toplam[i] = s.omur
    this.s0[i] = s.s0
    this.s1[i] = s.s1
    this.c0.set(s.c0, i * 4)
    this.c1.set(s.c1, i * 4)
  }

  /** olcek: piksel cinsinden ekran yüksekliği / (2·tan(fov/2)) */
  update(dt: number, olcek: number) {
    this.mat.uniforms.uScale.value = olcek
    const sd = Math.exp(-this.surtunme * dt)
    for (let i = 0; i < this.n; i++) {
      if (this.kalan[i] <= 0) {
        this.boyut[i] = 0
        continue
      }
      this.kalan[i] -= dt
      const u = 1 - Math.max(0, this.kalan[i]) / this.toplam[i]
      const k = i * 3
      this.vel[k + 1] += this.kaldirma * dt
      this.vel[k] *= sd
      this.vel[k + 1] *= sd
      this.vel[k + 2] *= sd
      this.pos[k] += this.vel[k] * dt
      this.pos[k + 1] += this.vel[k + 1] * dt
      this.pos[k + 2] += this.vel[k + 2] * dt
      this.boyut[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * u
      for (let c = 0; c < 4; c++) this.renk[i * 4 + c] = this.c0[i * 4 + c] + (this.c1[i * 4 + c] - this.c0[i * 4 + c]) * u
    }
    const g = this.points.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.aColor.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
  }

  dispose() {
    this.points.geometry.dispose()
    this.mat.dispose()
  }
}
