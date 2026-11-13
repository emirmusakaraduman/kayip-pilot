/* Sayı girişi: hesabı yapıp değeri yazar (enlem, boylam, ölçek, yükselti...). */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  KP.registerType('number', {
    mapNeeded: false,
    checkCase: function (c) {
      var e = [], a = c.answer || {}, b = c.board || {};
      if (typeof a.value !== 'number') e.push('answer.value sayı olmalı');
      if (typeof a.tolerance !== 'number') e.push('answer.tolerance gerekli (kabul edilen sapma)');
      if (!b.unit) e.push('board.unit gerekli (km, m, °, °C ...)');
      if (a.dir && (!b.dirs || b.dirs.indexOf(a.dir) < 0)) e.push('answer.dir board.dirs içinde olmalı');
      return e;
    },
    // a = {raw:"42,5", dir:"K"}
    validate: function (c, a) {
      var ans = c.answer;
      if (!a || a.raw == null || String(a.raw).trim() === '') return { ok: false, score: 0, detail: { reason: 'bos' } };
      var v = ans.angle ? U.parseDegrees(a.raw) : U.parseNumber(a.raw);
      if (!isFinite(v)) return { ok: false, score: 0, detail: { reason: 'sayi-degil' } };
      var T = [{ value: ans.value, tolerance: ans.tolerance }].concat(ans.accepts || []);
      var diff = Math.min.apply(null, T.map(function (t) { return Math.abs(v - t.value); }));
      var okNum = T.some(function (t) { return Math.abs(v - t.value) <= t.tolerance; });
      var dirOk = !ans.dir || a.dir === ans.dir, ok = okNum && dirOk;
      return { ok: ok, score: ok ? 1 : 0, detail: { value: v, diff: diff, dirOk: dirOk, near: !ok && okNum === false && diff <= ans.tolerance * 4 } };
    },
    mount: function (ctx) {
      var b = ctx.case.board || {}, dir = null, input, wrap = U.el('div', { class: 'kp-number' });
      if (b.given && b.given.length) ctx.host.appendChild(U.el('ul', { class: 'kp-given' }, b.given.map(function (g) { return U.el('li', { text: g }); })));
      input = U.el('input', { class: 'kp-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Cevabın', placeholder: b.placeholder || 'Cevabını yaz',
        oninput: function () { ctx.changed(); }, onkeydown: function (e) { if (e.key === 'Enter') ctx.submit(); } });
      wrap.appendChild(input);
      wrap.appendChild(U.el('span', { class: 'kp-unit', text: b.unit }));
      if (b.dirs) b.dirs.forEach(function (d) {
        var btn = U.el('button', { type: 'button', class: 'kp-chip', text: d, onclick: function () { dir = d; Array.prototype.forEach.call(wrap.querySelectorAll ? wrap.querySelectorAll('.kp-chip') : [], function (x) { x.removeAttribute('aria-pressed'); }); btn.setAttribute('aria-pressed', 'true'); ctx.changed(); } });
        wrap.appendChild(btn);
      });
      ctx.host.appendChild(wrap);
      return {
        getAnswer: function () { return { raw: input.value, dir: dir }; },
        isReady: function () { return String(input.value || '').trim() !== '' && (!b.dirs || !!dir); },
        lock: function (v) { input.disabled = !!v; }, applyHint: function () {}, destroy: function () {}
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
