// data/defter/sayfalar.json -> sayfalar.js (tarayıcı için; file:// ile de çalışsın)
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..', 'data', 'defter');
var pages = JSON.parse(fs.readFileSync(path.join(root, 'sayfalar.json'), 'utf8'));
if (pages.length !== 15) throw new Error('15 sayfa olmalı, bulunan: ' + pages.length);
fs.writeFileSync(path.join(root, 'sayfalar.js'), 'window.KP_PAGES=' + JSON.stringify(pages) + ';');
console.log(pages.length + ' sayfa -> data/defter/sayfalar.js');
