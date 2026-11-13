import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { KP_KONU, KP_ZORLUK } from '../game/kpKopru'
import { KONULAR } from './topics'

/** Soru sistemi (public/oda): tarayıcı betikleri, düz window.KP. Test için aynı betikler vm içinde yüklenir. */
const ODA = join(process.cwd(), 'public', 'oda')
const oku = (yol: string) => readFileSync(join(ODA, yol), 'utf-8')

interface KpVaka { id: string; topic: string; difficulty: number; type: string; reward?: { jeton: number } }
interface KP {
  validateCase: (c: unknown) => string[]
  runSelfTest: (c: unknown) => string[]
}

function yukle(): { KP: KP; vakalar: KpVaka[] } {
  const pencere: Record<string, unknown> = {}
  pencere.window = pencere
  const ctx = pencere as { KP?: KP; KP_CASES?: KpVaka[] }
  const betikler = [
    'src/questions/kp.js', 'src/questions/geo.js', 'src/questions/contour.js',
    ...readdirSync(join(ODA, 'src/questions/types')).sort().map((f) => `src/questions/types/${f}`),
    'src/questions/engine.js',
    'data/vakalar/vakalar.js',
  ]
  // geo/contour/engine tarayıcı olmadan da yüklenebilir; ui.js ve defter.js (DOM) bilerek yüklenmez
  runInNewContext(betikler.map(oku).join('\n;\n'), Object.assign(pencere, { console, Math, Date, JSON }))
  if (!ctx.KP || !ctx.KP_CASES) throw new Error('soru sistemi yüklenemedi')
  return { KP: ctx.KP, vakalar: ctx.KP_CASES }
}

const { KP, vakalar } = yukle()

describe('soru sistemi vaka verisi (public/oda/data)', () => {
  it('vaka kimlikleri benzersiz', () => {
    const idler = vakalar.map((v) => v.id)
    expect(new Set(idler).size).toBe(idler.length)
  })

  it.each(vakalar.map((v) => [v.id, v] as const))('%s: doğrulayıcıdan temiz geçer', (_id, v) => {
    expect(KP.validateCase(v), `${v.id} doğrulama hataları`).toEqual([])
  })

  it.each(vakalar.map((v) => [v.id, v] as const))('%s: kendi örnek cevapları doğru sınıflanır', (_id, v) => {
    expect(KP.runSelfTest(v), `${v.id} selfTest`).toEqual([])
  })

  it('vakalar.js, tek tek JSON dosyalarıyla aynı vakaları içerir (paket güncel)', () => {
    const dizin = join(ODA, 'data/vakalar')
    const idler = new Set<string>()
    for (const f of readdirSync(dizin).filter((x) => x.endsWith('.json'))) {
      const j = JSON.parse(readFileSync(join(dizin, f), 'utf-8')) as { vakalar?: KpVaka[] } | KpVaka[]
      for (const v of Array.isArray(j) ? j : (j.vakalar ?? [])) idler.add(v.id)
    }
    expect([...idler].sort()).toEqual(vakalar.map((v) => v.id).sort())
  })

  it('oyundaki her konu/zorluk için soru sisteminde en az bir vaka var', () => {
    const eksik: string[] = []
    for (const k of KONULAR)
      for (const z of ['kolay', 'orta', 'zor'] as const) {
        const var_ = vakalar.some((v) => v.topic === KP_KONU[k.id] && v.difficulty === KP_ZORLUK[z])
        if (!var_) eksik.push(`${k.id}/${z}`)
      }
    expect(eksik, 'soru sisteminde karşılığı olmayan konu/zorluk').toEqual([])
  })
})
