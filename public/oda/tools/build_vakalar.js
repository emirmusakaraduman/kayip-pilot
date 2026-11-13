/* JSON vakaları tarayıcıda yüklemek için tek bir script dosyasına çevirir (file:// ile fetch çalışmaz).
   Kullanım: node tools/build_vakalar.js   ->  data/vakalar/vakalar.js (window.KP_CASES) */
var fs = require('fs'), path = require('path');
var dir = path.join(__dirname, '..', 'data', 'vakalar'), all = [];
fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).sort().forEach(function (f) {
  var d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); (d.vakalar || []).forEach(function (c) { all.push(c); });
});
var ids = {}; all.forEach(function (c) { if (ids[c.id]) throw new Error('Tekrarlanan vaka id: ' + c.id); ids[c.id] = 1; });
fs.writeFileSync(path.join(dir, 'vakalar.js'), 'window.KP_CASES=' + JSON.stringify(all) + ';\n');
console.log(all.length + ' vaka -> data/vakalar/vakalar.js');
