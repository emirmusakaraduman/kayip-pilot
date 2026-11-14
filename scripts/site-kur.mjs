// Oyun merkezi sitesini kurar: site/ klasörü.
//   site/                 oyun merkezi sayfası (merkez/)
//   site/kayip-pilot/     Kayıp Pilot (Vite derlemesi, alt klasör yoluyla)
//   site/<klasör>/        oyunlar/<klasör> içindeki hazır (derlenmiş) oyunlar
// Kullanım: npm run site   (Vercel de bunu çalıştırır, bkz. vercel.json)
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const kok = resolve(import.meta.dirname, '..')
const site = join(kok, 'site')
const calistir = (komut, env = {}) => execSync(komut, { cwd: kok, stdio: 'inherit', env: { ...process.env, ...env } })

rmSync(site, { recursive: true, force: true })
mkdirSync(site, { recursive: true })

// 1) Kayıp Pilot: /kayip-pilot/ altında çalışacak şekilde derlenir
console.log('\n▶ Kayıp Pilot derleniyor (/kayip-pilot/)')
calistir('npx tsc -b')
calistir(`npx vite build --outDir "${join(site, 'kayip-pilot')}" --emptyOutDir`, { SITE_BASE: '/kayip-pilot/' })

// 2) Oyun merkezi sayfası site kökünde
console.log('\n▶ Oyun merkezi sayfası kopyalanıyor')
cpSync(join(kok, 'merkez'), site, { recursive: true })

// 3) Diğer oyunlar: oyunlar/<klasör>/ içindeki hazır dosyalar site/<klasör>/ olur
const oyunlarKlasoru = join(kok, 'oyunlar')
if (existsSync(oyunlarKlasoru)) {
  for (const ad of readdirSync(oyunlarKlasoru)) {
    const yol = join(oyunlarKlasoru, ad)
    if (!statSync(yol).isDirectory()) continue
    if (!existsSync(join(yol, 'index.html'))) {
      console.warn(`! oyunlar/${ad}: index.html yok, atlandı. (Derlenmiş oyun dosyalarını bu klasörün içine koy, bkz. oyunlar/README.md)`)
      continue
    }
    console.log(`▶ Oyun ekleniyor: ${ad}`)
    cpSync(yol, join(site, ad), { recursive: true })
  }
}

console.log('\n✔ Site hazır: site/  (yerelde denemek için: npx vite preview --outDir site ya da npx serve site)')
