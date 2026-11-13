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
import { mkdir, stat } from 'node:fs/promises'

const MODELLER = {
  helikopter: { girdi: '.kaynak-modeller/helikopter.glb', cikti: 'public/models/helikopter.glb', oran: 0.07, hata: 0.02, animasyonuSil: true },
  nuri: { girdi: '.kaynak-modeller/erkek-karakter.glb', cikti: 'public/models/nuri.glb', oran: 0.04, hata: 0.02 },
  ayse: { girdi: '.kaynak-modeller/kadin-karakter.glb', cikti: 'public/models/ayse.glb', oran: 0.25, hata: 0.02 },
}

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
await mkdir('public/models', { recursive: true })

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
