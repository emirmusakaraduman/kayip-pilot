/* KP: Kayıp Pilot soru sistemi çekirdeği. Düz script (derleme yok), window.KP altında toplanır. */
(function (root) {
  'use strict';
  var KP = root.KP = root.KP || {};
  KP.types = {};
  KP.registerType = function (name, impl) { KP.types[name] = impl; };

  // 15 konu (TYT coğrafya). Her vaka bu listedeki bir konuya bağlanır.
  KP.TOPIC_NAMES = {
    'dunya-sekli-hareketleri': 'Dünya’nın şekli ve hareketleri', 'cografi-konum': 'Coğrafi konum', 'harita-bilgisi': 'Harita bilgisi',
    'iklim-elemanlari': 'İklim elemanları', 'iklim-tipleri': 'İklim tipleri ve bitki örtüsü', 'ic-kuvvetler': 'İç kuvvetler',
    'dis-kuvvetler': 'Dış kuvvetler', 'kayaclar-topraklar': 'Kayaçlar ve topraklar', 'su-kaynaklari': 'Su kaynakları',
    'turkiye-yer-sekilleri-iklimi': 'Türkiye’nin yer şekilleri ve iklimi', 'nufus-yerlesme': 'Nüfus ve yerleşme', 'goc': 'Göç',
    'ekonomik-faaliyetler': 'Ekonomik faaliyetler', 'ulasim': 'Ulaşım', 'dogal-afetler': 'Doğal afetler'
  };
  // Hangi cevap türü hangi konulara uyar (tasarım tablosu). Doğrulayıcı bunu zorunlu tutar.
  KP.TYPE_TOPICS = {
    pin: ['cografi-konum', 'iklim-tipleri', 'dis-kuvvetler', 'kayaclar-topraklar', 'turkiye-yer-sekilleri-iklimi', 'ekonomik-faaliyetler'],
    number: ['dunya-sekli-hareketleri', 'cografi-konum', 'harita-bilgisi', 'iklim-elemanlari'],
    cards: ['ic-kuvvetler', 'su-kaynaklari', 'nufus-yerlesme', 'goc'],
    route: ['harita-bilgisi', 'ulasim'],
    decision: ['dogal-afetler', 'ulasim'],
    graph: ['iklim-tipleri', 'goc']
  };

  var U = KP.util = {};
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.rad = function (d) { return d * Math.PI / 180; };

  // "42,5" "1.250,5" "1.000" "42 km" -> sayı. Nokta binlik ayracı kabul edilir (TR yazımı).
  U.parseNumber = function (s) {
    if (typeof s === 'number') return s;
    if (s == null) return NaN;
    var t = String(s).replace(/\s+/g, '').replace(/[^\d.,\-+]/g, '');
    if (!t) return NaN;
    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(',', '.');
    var v = parseFloat(t);
    return isFinite(v) ? v : NaN;
  };
  // "42", "42°", "71°27′", "71 27", "42,5" -> ondalık derece
  U.parseDegrees = function (s) {
    if (typeof s === 'number') return s;
    if (s == null) return NaN;
    var t = String(s).replace(/[A-Za-zÇĞİÖŞÜçğıöşü]/g, ' ').trim();
    var m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*[°º˚]?\s*(?:(\d+(?:[.,]\d+)?)\s*['′’´]?)?\s*$/);
    if (!m) return NaN;
    var d = parseFloat(m[1].replace(',', '.')), mi = m[2] ? parseFloat(m[2].replace(',', '.')) : 0;
    return d + (d < 0 ? -mi : mi) / 60;
  };

  var SVGT = { svg: 1, g: 1, line: 1, rect: 1, path: 1, circle: 1, text: 1, polyline: 1, polygon: 1 };
  // Küçük DOM yardımcısı: el('div', {class:'x', text:'y', onclick:fn}, [çocuklar])
  U.el = function (tag, props, kids) {
    var doc = root.document;
    var n = SVGT[tag] ? doc.createElementNS('http://www.w3.org/2000/svg', tag) : doc.createElement(tag);
    var k;
    props = props || {};
    for (k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
      var v = props[k];
      if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'style' && v && typeof v === 'object') { for (var s in v) n.style[s] = v[s]; }
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    if (kids != null) {
      if (!Array.isArray(kids)) kids = [kids];
      kids.forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    }
    return n;
  };
  U.clear = function (n) { while (n && n.firstChild) n.removeChild(n.firstChild); };

  // Basit olay yayıcı (KP.on('correct', fn))
  var L = {};
  KP.on = function (e, f) { (L[e] = L[e] || []).push(f); };
  KP.emit = function (e, d) { (L[e] || []).forEach(function (f) { try { f(d); } catch (x) { if (root.console) console.warn('KP olay hatası', e, x); } }); };
})(typeof window !== 'undefined' ? window : globalThis);
