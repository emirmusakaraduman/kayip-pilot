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
