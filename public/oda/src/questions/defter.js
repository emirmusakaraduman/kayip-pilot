/* Deniz'in defteri (HTML katmanı): açılan sayfalar ve yanlış defteri. Masadaki defter tıklanınca açılır. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  var D = KP.defter = { el: null, onKey: null };
  D.page = function (n) { var P = root.KP_PAGES || []; for (var i = 0; i < P.length; i++) if (P[i].n === n) return P[i]; return null; };
  D.unlocked = function () { var s = (KP.engine && KP.engine.state.pages) || {}; return Object.keys(s).map(Number).sort(function (a, b) { return a - b; }); };
  D.close = function () {
    if (D.el && D.el.parentNode) D.el.parentNode.removeChild(D.el);
    if (D.onKey) root.document.removeEventListener('keydown', D.onKey);
    D.el = null; D.onKey = null;
  };
  // tab: sayfa numarası ya da 'yanlis'
  D.open = function (tab) {
    var doc = root.document, host = doc.getElementById('stage') || doc.body, E = KP.engine, un = D.unlocked();
    D.close();
    if (tab == null) tab = un.length ? un[un.length - 1] : 'yanlis';
    var body = U.el('div', { class: 'kp-dbody' }), tabs = U.el('div', { class: 'kp-dtabs', role: 'tablist' });
    function show(t) {
      U.clear(body); U.clear(tabs);
      un.forEach(function (n) { tabs.appendChild(U.el('button', { type: 'button', role: 'tab', class: 'kp-btn kp-sm' + (t === n ? ' kp-on' : ''), 'aria-selected': t === n ? 'true' : 'false', text: 'Sayfa ' + n, onclick: function () { show(n); } })); });
      tabs.appendChild(U.el('button', { type: 'button', role: 'tab', class: 'kp-btn kp-sm' + (t === 'yanlis' ? ' kp-on' : ''), 'aria-selected': t === 'yanlis' ? 'true' : 'false', text: 'Yanlışlarım', onclick: function () { show('yanlis'); } }));
      if (t === 'yanlis') {
        var w = (E && E.state.wrong) || [];
        body.appendChild(U.el('h3', { text: 'Yanlış defteri' }));
        if (!w.length) body.appendChild(U.el('p', { text: 'Henüz yanlış cevabın yok.' }));
        else {
          var count = {}, order = [];
          w.forEach(function (x) { if (!count[x.id]) { count[x.id] = 0; order.push(x.id); } count[x.id]++; });
          var ul = U.el('ul', { class: 'kp-wl' });
          order.slice(-15).reverse().forEach(function (id) { var c = E.cases[id]; ul.appendChild(U.el('li', { text: (c ? c.title + ' (' + KP.TOPIC_NAMES[c.topic] + ')' : id) + ' — ' + count[id] + ' yanlış' })); });
          body.appendChild(ul);
        }
      } else {
        var pg = D.page(t);
        body.appendChild(U.el('h3', { text: 'Sayfa ' + t + ' / 15' }));
        body.appendChild(U.el('p', { class: 'kp-dtext', text: pg ? pg.metin : 'Bu sayfanın metni henüz yazılmadı.' }));
      }
    }
    var P = U.el('section', { class: 'kp-defter', role: 'dialog', 'aria-label': 'Deniz’in defteri' }, [
      U.el('div', { class: 'kp-head' }, [U.el('span', { class: 'kp-topic', text: 'Deniz’in defteri' }), U.el('button', { type: 'button', class: 'kp-x', 'aria-label': 'Defteri kapat', text: '×', onclick: D.close })]),
      tabs, body
    ]);
    host.appendChild(P); D.el = P; show(tab);
    D.onKey = function (e) { if (e.key === 'Escape') D.close(); };
    doc.addEventListener('keydown', D.onKey);
    var first = P.querySelector('button'); if (first && first.focus) first.focus();
  };
})(typeof window !== 'undefined' ? window : globalThis);
