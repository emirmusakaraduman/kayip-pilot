/* Konu x zorluk kapsama tablosu. Hedef: 15 konu x 3 zorluk = 45 vaka.  Kullanım: node tests/coverage.js */
var H = require('./helpers.js'), fs = require('fs'), path = require('path');
var KP = H.loadKP().KP, dir = path.join(__dirname, '..', 'data', 'vakalar'), cases = [];
fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) { cases = cases.concat(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).vakalar || []); });
var missing = 0, total = 0;
console.log('Konu'.padEnd(34) + ' Kolay Orta Zor  Kullanılan / izinli cevap türleri');
Object.keys(KP.TOPIC_NAMES).forEach(function (k) {
  var row = [0, 0, 0], used = {}, allowed = Object.keys(KP.TYPE_TOPICS).filter(function (t) { return KP.TYPE_TOPICS[t].indexOf(k) >= 0; });
  cases.filter(function (c) { return c.topic === k; }).forEach(function (c) { row[c.difficulty - 1]++; used[c.type] = 1; });
  row.forEach(function (n) { if (n) total++; else missing++; });
  console.log(KP.TOPIC_NAMES[k].padEnd(34) + ' ' + row.map(function (n) { return (n ? String(n) : '·').padEnd(5); }).join('') + ' ' + (Object.keys(used).join(',') || '-') + '  /  ' + allowed.join(','));
});
console.log('\nToplam vaka: ' + cases.length + '   dolu hücre: ' + total + '/45   eksik hücre: ' + missing);

// plan karşılaştırması (data/vaka_plani.json)
try {
  var plan = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'vaka_plani.json'), 'utf8')), list = plan.vakalar || plan.plan || [], ids = {}, off = [];
  cases.forEach(function (x) { ids[x.id] = x; });
  list.forEach(function (p) { var x = ids[p.id]; if (!x) off.push('YOK    ' + p.id); else if (x.topic !== p.konu || x.type !== p.tur || x.difficulty !== p.zorluk) off.push('FARKLI ' + p.id); });
  var inPlan = {}; list.forEach(function (p) { inPlan[p.id] = 1; });
  var extra = cases.filter(function (x) { return !inPlan[x.id]; }).map(function (x) { return x.id; });
  console.log('Plan: ' + list.length + ' vaka, plana uymayan: ' + off.length);
  off.forEach(function (o) { console.log('  ' + o); });
  console.log('Plan dışı ek vaka: ' + (extra.join(', ') || '-'));
} catch (e) { console.log('Plan dosyası okunamadı: ' + e.message); }
