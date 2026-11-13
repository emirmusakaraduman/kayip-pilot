/* Test yardımcıları: kaynakları Node'da yükler, harita verisini okur, küçük sahte DOM kurar. */
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');
function loadKP() {
  var DOC = fakeDocument();
  globalThis.document = DOC;
  globalThis.window = undefined; // kaynaklar globalThis'e bağlanır
  delete globalThis.KP;
  ['kp.js', 'geo.js', 'contour.js', 'types/pin.js', 'types/number.js', 'types/cards.js', 'types/decision.js', 'types/graph.js', 'types/route.js', 'ui.js', 'engine.js'].forEach(function (f) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'src/questions', f), 'utf8'), { filename: f });
  });
  var md = fs.readFileSync(path.join(ROOT, 'data/map_data.js'), 'utf8');
  var MAP = JSON.parse(md.slice('window.MAP_DATA='.length).replace(/;\s*$/, ''));
  KP.geo.setMapData(MAP);
  return { KP: KP, DOC: DOC, MAP: MAP };
}
function loadCases() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vakalar/ornek_vakalar.json'), 'utf8')).vakalar; }

/* ---- küçük sahte DOM ---- */
function FakeNode(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.style = {}; this.listeners = {}; this.textContent = ''; this.parentNode = null; this.value = ''; this.disabled = false; this.hidden = false;
  var self = this; this.classList = { toggle: function () {}, add: function () {}, remove: function () {} }; }
FakeNode.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
FakeNode.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; };
Object.defineProperty(FakeNode.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
FakeNode.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); if (k === 'disabled') this.disabled = true; };
FakeNode.prototype.removeAttribute = function (k) { delete this.attrs[k]; };
FakeNode.prototype.addEventListener = function (e, f) { (this.listeners[e] = this.listeners[e] || []).push(f); };
FakeNode.prototype.fire = function (e, ev) { (this.listeners[e] || []).forEach(function (f) { f(ev || {}); }); };
FakeNode.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 360, height: 360 }; };
function fakeDocument() {
  var body = new FakeNode('body');
  return { body: body, createElement: function (t) { return new FakeNode(t); }, createElementNS: function (n, t) { return new FakeNode(t); },
    createTextNode: function (t) { var n = new FakeNode('#text'); n.textContent = t; return n; }, getElementById: function () { return null; } };
}
function find(node, pred, out) { out = out || []; if (pred(node)) out.push(node); node.children.forEach(function (c) { find(c, pred, out); }); return out; }
function hasClass(n, c) { return (n.attrs['class'] || '').split(/\s+/).indexOf(c) >= 0; }
module.exports = { loadKP: loadKP, loadCases: loadCases, find: find, hasClass: hasClass, FakeNode: FakeNode, fakeDocument: fakeDocument };
