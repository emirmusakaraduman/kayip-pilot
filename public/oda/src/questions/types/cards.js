/* Seçenek kartı: 3-4 karttan doğrusunu seçer. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  KP.registerType('cards', {
    mapNeeded: false,
    checkCase: function (c) {
      var e = [], b = c.board || {}, a = c.answer || {};
      if (!b.cards || b.cards.length < 3 || b.cards.length > 4) e.push('board.cards 3 ya da 4 kart olmalı');
      else {
        var ids = b.cards.map(function (k) { return k.id; });
        if (ids.length !== new Set(ids).size) e.push('kart id\'leri benzersiz olmalı');
        if (!a.correct || !a.correct.length) e.push('answer.correct dolu olmalı');
        else a.correct.forEach(function (id) { if (ids.indexOf(id) < 0) e.push('answer.correct bilinmeyen kart: ' + id); });
        b.cards.forEach(function (k) { if (a.correct && a.correct.indexOf(k.id) < 0 && !k.why) e.push('yanlış kartın "why" açıklaması olmalı: ' + k.id); });
      }
      return e;
    },
    // a = ["b"]  (seçilen kart id'leri)
    validate: function (c, a) {
      var want = c.answer.correct.slice().sort().join('|');
      if (!Array.isArray(a) || !a.length) return { ok: false, score: 0, detail: { reason: 'bos' } };
      var got = a.slice().sort().join('|'), ok = got === want, why = [];
      (c.board.cards || []).forEach(function (k) { if (a.indexOf(k.id) >= 0 && c.answer.correct.indexOf(k.id) < 0 && k.why) why.push(k.why); });
      return { ok: ok, score: ok ? 1 : 0, detail: { why: why } };
    },
    mount: function (ctx) {
      var b = ctx.case.board, picked = [], btns = {}, gone = {}, list = U.el('div', { class: 'kp-cards', role: 'group', 'aria-label': 'Seçenekler' });
      b.cards.forEach(function (k) {
        var btn = U.el('button', { type: 'button', class: 'kp-card', 'aria-pressed': 'false', 'data-id': k.id,
          onclick: function () {
            if (gone[k.id]) return;
            var i = picked.indexOf(k.id);
            if (i >= 0) picked.splice(i, 1); else { if (!b.multi) picked.length = 0; picked.push(k.id); }
            Object.keys(btns).forEach(function (id) { btns[id].setAttribute('aria-pressed', picked.indexOf(id) >= 0 ? 'true' : 'false'); });
            ctx.changed();
          } }, [U.el('strong', { text: k.title || k.text }), k.title && k.text ? U.el('span', { text: k.text }) : null]);
        btns[k.id] = btn; list.appendChild(btn);
      });
      ctx.host.appendChild(list);
      return {
        getAnswer: function () { return picked.slice(); }, isReady: function () { return picked.length > 0; },
        lock: function (v) { Object.keys(btns).forEach(function (id) { btns[id].disabled = !!v || !!gone[id]; }); },
        applyHint: function (h) { (h.eliminate || []).forEach(function (id) { if (!btns[id] || (ctx.case.answer.correct.indexOf(id) >= 0)) return; gone[id] = true; btns[id].disabled = true; btns[id].setAttribute('aria-disabled', 'true'); btns[id].setAttribute('class', 'kp-card kp-gone'); var i = picked.indexOf(id); if (i >= 0) picked.splice(i, 1); }); ctx.changed(); },
        destroy: function () {}
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
