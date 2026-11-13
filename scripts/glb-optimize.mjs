// Ham GLB modellerini web için küçültür: kaynak klasörü .kaynak-modeller/ (repoya girmez) → public/models/.
//
// Kullanım:  node scripts/glb-optimize.mjs [model-adı ...]      (adsız çalışırsa hepsi)
//
// Yapılanlar: köşe birleştirme (weld), üçgen sadeleştirme (meshoptimizer), kullanılmayan veriyi silme,
// dokuları 1024 px WebP'ye çevirme, meshopt sıkıştırma. Düğüm adları ve hiyerarşi KORUNUR
// (helikopterin rotorları ad ile bulunur). Dosyalar CC-BY-4.0 olduğundan değişiklik atıf satırında belirtilir.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, getBounds, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import * as THREE from 'three'
import { mkdir, stat } from 'node:fs/promises'

const MODELLER = {
  helikopter: { girdi: '.kaynak-modeller/helikopter.glb', cikti: 'public/models/helikopter.glb', oran: 0.07, hata: 0.02, animasyonuSil: true },
  nuri: { girdi: '.kaynak-modeller/erkek-karakter.glb', cikti: 'public/models/nuri.glb', oran: 0.04, hata: 0.02, kollariIndir: true },
  ayse: { girdi: '.kaynak-modeller/kadin-karakter.glb', cikti: 'public/models/ayse.glb', oran: 0.25, hata: 0.02 },
}

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
await mkdir('public/models', { recursive: true })

/**
 * Nuri iskeletsiz tek parça bir ağdır ve T-pozda durur. Kolları omuz ekleminde aşağı döndürerek (A-poz) oturur hâle uygun hale getirir.
 * Ölçüler (dünya uzayı, boy ≈ 1,0): kollar y≈0,10–0,25 ve |z|>0,13; omuz ekleminde y=0,20, |z|=0,15.
 * Dönüş |z|'ye bağlı yumuşak ağırlıkla uygulanır; omuza yakın köşeler daha az döner.
 */
function kollariIndir(doc, aci = (68 * Math.PI) / 180) {
  const OMUZ_Y = 0.2, OMUZ_Z = 0.15
  const yum = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  const v = new THREE.Vector3(), n = new THREE.Vector3()
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh()
    if (!mesh) continue
    const W = new THREE.Matrix4().fromArray(node.getWorldMatrix())
    const Wi = W.clone().invert()
    const R = new THREE.Matrix4().extractRotation(W)
    const Ri = R.clone().invert()
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION')
      const nor = prim.getAttribute('NORMAL')
      const e = [0, 0, 0]
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, e)
        v.set(e[0], e[1], e[2]).applyMatrix4(W)
        const az = Math.abs(v.z)
        const w = yum(OMUZ_Z - 0.02, OMUZ_Z + 0.07, az) * yum(0.06, 0.1, v.y) // kol bölgesi (bacaklar/gövde hariç)
        if (w <= 0) { continue }
        const a = aci * w
        const yon = Math.sign(v.z) || 1
        const dz = az - OMUZ_Z, dy = v.y - OMUZ_Y
        const dz2 = dz * Math.cos(a) + dy * Math.sin(a)
        const dy2 = -dz * Math.sin(a) + dy * Math.cos(a)
        v.set(v.x, OMUZ_Y + dy2, yon * (OMUZ_Z + dz2)).applyMatrix4(Wi)
        pos.setElement(i, [v.x, v.y, v.z])
        if (nor) {
          nor.getElement(i, e)
          n.set(e[0], e[1], e[2]).applyMatrix4(R)
          const nz1 = n.z * yon, ny1 = n.y
          const nz2 = nz1 * Math.cos(a) + ny1 * Math.sin(a)
          const ny2 = -nz1 * Math.sin(a) + ny1 * Math.cos(a)
          n.set(n.x, ny2, nz2 * yon).normalize().applyMatrix4(Ri).normalize()
          nor.setElement(i, [n.x, n.y, n.z])
        }
      }
    }
  }
}

const ucgenSay = (doc) => {
  let n = 0
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()) n += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3
  return Math.round(n)
}
const mb = (b) => (b / 1e6).toFixed(2) + ' MB'

const istenen = process.argv.slice(2)
for (const [ad, c] of Object.entries(MODELLER)) {
  if (istenen.length && !istenen.includes(ad)) continue
  const doc = await io.read(c.girdi)
  const once = ucgenSay(doc)
  if (c.kollariIndir) kollariIndir(doc)
  if (c.animasyonuSil) for (const a of doc.getRoot().listAnimations()) a.dispose() // rotorlar kodla döndürülür
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: c.oran, error: c.hata }),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 80 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(c.cikti, doc)
  const b = getBounds(doc.getRoot().listScenes()[0])
  console.log(`${ad.padEnd(11)} ${mb((await stat(c.girdi)).size)} → ${mb((await stat(c.cikti)).size)} | üçgen ${once.toLocaleString('tr')} → ${ucgenSay(doc).toLocaleString('tr')} | sınır ${b.min.map((v) => +v.toFixed(2))} .. ${b.max.map((v) => +v.toFixed(2))}`)
}
