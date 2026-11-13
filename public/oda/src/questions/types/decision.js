/* Karar verme: senaryoda Deniz'e ne yapacağını söyler (çok adımlı, sonuçlu). */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  function stepMap(b) { var m = {}; (b.steps || []).forEach(function (s) { m[s.id] = s; }); return m; }
  KP.registerType('decision', {
    mapNeeded: false,
    checkCase: function (c) {
      var e = [], b = c.board || {}, m = stepMap(b), ids = {};
      if (!b.start || !m[b.start]) e.push('board.start geçerli bir adım olmalı');
      (b.steps || []).forEach(function (s) {
        if (!s.options || s.options.length < 2 || s.options.length > 4) e.push('adım ' + s.id + ': 2-4 seçenek olmalı');
        (s.options || []).forEach(function (o) {
          if (ids[o.id]) e.push('seçenek id tekrarı: ' + o.id); ids[o.id] = 1;
          if (!o.next && !o.end) e.push('seçenek ' + o.id + ': next ya da end gerekli');
          if (o.next && !m[o.next]) e.push('seçenek ' + o.id + ': bilinmeyen next ' + o.next);
          if (o.end && ['best', 'ok', 'bad'].indexOf(o.end) < 0) e.push('seçenek ' + o.id + ': end best|ok|bad olmalı');
          if (!o.note) e.push('seçenek ' + o.id + ': note (sonuç cümlesi) gerekli');
        });
      });
      if (!c.answer || !c.answer.okEndings || !c.answer.okEndings.length) e.push('answer.okEndings gerekli');
      return e;
    },
    // a = ["s1b","s2a"]  (seçilen seçenek id'leri, sırayla)
    validate: function (c, a) {
      var m = stepMap(c.board), cur = c.board.start, score = 0, ending = null, notes = [], i;
      if (!Array.isArray(a) || !a.length) return { ok: false, score: 0, detail: { reason: 'bos' } };
      for (i = 0; i < a.length; i++) {
        var st = m[cur], o = st && st.options.filter(function (x) { return x.id === a[i]; })[0];
        if (!o) return { ok: false, score: 0, detail: { reason: 'gecersiz-yol' } };
        score += (o.effects && o.effects.score) || 0; notes.push(o.note);
        if (o.end) { ending = o.end; break; }
        cur = o.next;
      }
      var ok = ending !== null && c.answer.okEndings.indexOf(ending) >= 0;
      return { ok: ok, score: ok ? 1 : 0, detail: { ending: ending, notes: notes, incomplete: ending === null, points: score } };
    },
    mount: function (ctx) {
      var b = ctx.case.board, m = stepMap(b), cur = b.start, path = [], done = false, box = U.el('div', { class: 'kp-decision' });
      ctx.host.appendChild(box);
      function show() {
        U.clear(box);
        var st = m[cur];
        box.appendChild(U.el('p', { class: 'kp-scene', text: st.text }));
        var list = U.el('div', { class: 'kp-cards', role: 'group' });
        st.options.forEach(function (o) {
          list.appendChild(U.el('button', { type: 'button', class: 'kp-card', 'data-id': o.id, onclick: function () {
            path.push(o.id);
            if (o.end) { done = true; U.clear(box); box.appendChild(U.el('p', { class: 'kp-scene', text: o.note })); ctx.changed(); ctx.submit(); }
            else { box.appendChild(U.el('p', { class: 'kp-note', text: o.note })); cur = o.next; var dl = (KP.config && KP.config.stepDelayMs != null) ? KP.config.stepDelayMs : 600; if (dl > 0) setTimeout(show, dl); else show(); }
          } }, [U.el('strong', { text: o.text })]));
        });
        box.appendChild(list);
      }
      show();
      return {
        getAnswer: function () { return path.slice(); }, isReady: function () { return done; },
        lock: function () {}, applyHint: function () {},
        reset: function () { cur = b.start; path = []; done = false; show(); }, destroy: function () {}
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
