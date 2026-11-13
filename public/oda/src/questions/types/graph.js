/* Grafik okuma: iklim grafiği (yağış-sıcaklık) ya da nüfus piramidi üzerinde seçim/yorum. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  KP.MONTHS = MONTHS;

  function climo(d, sel, onToggle) {
    var W = 360, H = 220, L = 34, R = 34, T = 14, B = 30, pw = W - L - R, ph = H - T - B, i;
    var pmax = Math.ceil(Math.max.apply(null, d.precip) / 50) * 50 || 50;
    var tmin = Math.min(0, Math.floor(Math.min.apply(null, d.temp) / 5) * 5), tmax = Math.ceil(Math.max.apply(null, d.temp) / 5) * 5 || 5;
    var svg = U.el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'kp-chart', role: 'img', 'aria-label': d.title || 'Yağış ve sıcaklık grafiği' });
    svg.appendChild(U.el('line', { x1: L, y1: T, x2: L, y2: T + ph, class: 'kp-axis' }));
    svg.appendChild(U.el('line', { x1: W - R, y1: T, x2: W - R, y2: T + ph, class: 'kp-axis' }));
    svg.appendChild(U.el('line', { x1: L, y1: T + ph, x2: W - R, y2: T + ph, class: 'kp-axis' }));
    svg.appendChild(U.el('text', { x: 4, y: 10, class: 'kp-axt', text: 'mm' }));
    svg.appendChild(U.el('text', { x: W - 20, y: 10, class: 'kp-axt', text: '°C' }));
    [0, 0.5, 1].forEach(function (f) {
      svg.appendChild(U.el('text', { x: L - 4, y: T + ph - f * ph + 3, class: 'kp-axt', 'text-anchor': 'end', text: String(Math.round(pmax * f)) }));
      svg.appendChild(U.el('text', { x: W - R + 4, y: T + ph - f * ph + 3, class: 'kp-axt', text: String(Math.round(tmin + (tmax - tmin) * f)) }));
    });
    var pts = [];
    for (i = 0; i < 12; i++) {
      var x = L + pw * (i + 0.5) / 12, bw = pw / 12 * 0.62, h = d.precip[i] / pmax * ph;
      svg.appendChild(U.el('rect', { x: x - bw / 2, y: T + ph - h, width: bw, height: h, class: 'kp-bar' + (sel.indexOf(i + 1) >= 0 ? ' kp-sel' : ''), 'data-m': i + 1 }));
      pts.push(x.toFixed(1) + ',' + (T + ph - (d.temp[i] - tmin) / (tmax - tmin) * ph).toFixed(1));
      svg.appendChild(U.el('text', { x: x, y: H - 12, class: 'kp-axt', 'text-anchor': 'middle', text: MONTHS[i] }));
    }
    svg.appendChild(U.el('polyline', { points: pts.join(' '), class: 'kp-line' }));
    if (onToggle) for (i = 0; i < 12; i++) (function (m) {
      var x2 = L + pw * (m - 0.5) / 12;
      svg.appendChild(U.el('rect', { x: x2 - pw / 24, y: T, width: pw / 12, height: ph + 18, class: 'kp-hit', role: 'button', tabindex: '0', 'aria-label': MONTHS[m - 1], onclick: function () { onToggle(m); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') onToggle(m); } }));
    })(i + 1);
    return svg;
  }
  function pyramid(d, sel, onToggle) {
    var W = 360, rowH = 22, H = d.groups.length * rowH + 30, cx = W / 2, half = 130, i;
    var mx = Math.max(Math.max.apply(null, d.male), Math.max.apply(null, d.female)) || 1;
    var svg = U.el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'kp-chart', role: 'img', 'aria-label': d.title || 'Nüfus piramidi' });
    svg.appendChild(U.el('text', { x: cx - 60, y: 12, class: 'kp-axt', 'text-anchor': 'middle', text: 'Erkek (%)' }));
    svg.appendChild(U.el('text', { x: cx + 60, y: 12, class: 'kp-axt', 'text-anchor': 'middle', text: 'Kadın (%)' }));
    for (i = 0; i < d.groups.length; i++) {
      var y = 20 + (d.groups.length - 1 - i) * rowH, wm = d.male[i] / mx * half, wf = d.female[i] / mx * half, on = sel.indexOf(i) >= 0;
      svg.appendChild(U.el('rect', { x: cx - wm, y: y, width: wm, height: rowH - 4, class: 'kp-pbar kp-m' + (on ? ' kp-sel' : '') }));
      svg.appendChild(U.el('rect', { x: cx, y: y, width: wf, height: rowH - 4, class: 'kp-pbar kp-f' + (on ? ' kp-sel' : '') }));
      svg.appendChild(U.el('text', { x: cx, y: y + rowH - 8, class: 'kp-axt kp-mid', 'text-anchor': 'middle', text: d.groups[i] }));
      if (onToggle) (function (k, yy) { svg.appendChild(U.el('rect', { x: 0, y: yy, width: W, height: rowH - 4, class: 'kp-hit', role: 'button', tabindex: '0', 'aria-label': d.groups[k] + ' yaş grubu', onclick: function () { onToggle(k); } })); })(i, y);
    }
    return svg;
  }

  KP.registerType('graph', {
    mapNeeded: false,
    renderClimograph: climo, renderPyramid: pyramid,
    checkCase: function (c) {
      var e = [], b = c.board || {}, a = c.answer || {}, d = b.data || {};
      if (['climograph', 'pyramid'].indexOf(b.kind) < 0) e.push('board.kind: climograph|pyramid');
      if (b.kind === 'climograph' && (!d.temp || d.temp.length !== 12 || !d.precip || d.precip.length !== 12)) e.push('climograph: data.temp ve data.precip 12 değer olmalı');
      if (b.kind === 'pyramid' && (!d.groups || !d.male || !d.female || d.groups.length !== d.male.length || d.groups.length !== d.female.length)) e.push('pyramid: data.groups/male/female aynı uzunlukta olmalı');
      if (['months', 'bars', 'choice'].indexOf(b.pickMode) < 0) e.push('board.pickMode: months|bars|choice');
      if (b.pickMode === 'months' && b.kind !== 'climograph') e.push('months yalnızca climograph ile');
      if (b.pickMode === 'bars' && b.kind !== 'pyramid') e.push('bars yalnızca pyramid ile');
      if (b.pickMode === 'months' && (!a.months || !a.months.length)) e.push('answer.months gerekli');
      if (b.pickMode === 'bars' && (!a.bars || !a.bars.length)) e.push('answer.bars gerekli');
      if (b.pickMode === 'choice') {
        if (!b.choices || b.choices.length < 3 || b.choices.length > 4) e.push('board.choices 3-4 seçenek olmalı');
        else if (!b.choices.some(function (x) { return x.id === a.choice; })) e.push('answer.choice board.choices içinde olmalı');
      }
      return e;
    },
    // a = {months:[6,7,8]} | {bars:[0,1]} | {choice:"akdeniz"}
    validate: function (c, a) {
      var b = c.board, ans = c.answer;
      if (!a) return { ok: false, score: 0, detail: { reason: 'bos' } };
      function same(x, y) { return x.length === y.length && x.slice().sort().join() === y.slice().sort().join(); }
      var ok = false;
      if (b.pickMode === 'months') ok = !!a.months && a.months.length > 0 && same(a.months, ans.months);
      else if (b.pickMode === 'bars') ok = !!a.bars && a.bars.length > 0 && same(a.bars, ans.bars);
      else ok = !!a.choice && a.choice === ans.choice;
      var why = null;
      if (b.pickMode === 'choice' && !ok && a.choice) { var ch = b.choices.filter(function (x) { return x.id === a.choice; })[0]; why = ch && ch.why || null; }
      return { ok: ok, score: ok ? 1 : 0, detail: { why: why ? [why] : [] } };
    },
    mount: function (ctx) {
      var b = ctx.case.board, selM = [], selB = [], choice = null, box = U.el('div', { class: 'kp-graph' }), chBtns = {};
      ctx.host.appendChild(box);
      function draw() {
        U.clear(box);
        if (b.kind === 'climograph') box.appendChild(climo(b.data, selM, b.pickMode === 'months' ? function (m) { var i = selM.indexOf(m); if (i >= 0) selM.splice(i, 1); else selM.push(m); draw(); ctx.changed(); } : null));
        else box.appendChild(pyramid(b.data, selB, b.pickMode === 'bars' ? function (k) { var i = selB.indexOf(k); if (i >= 0) selB.splice(i, 1); else selB.push(k); draw(); ctx.changed(); } : null));
        if (b.pickMode === 'choice') {
          var list = U.el('div', { class: 'kp-cards', role: 'group' });
          b.choices.forEach(function (ch) {
            var btn = U.el('button', { type: 'button', class: 'kp-card', 'aria-pressed': choice === ch.id ? 'true' : 'false', onclick: function () { choice = ch.id; draw(); ctx.changed(); } }, [U.el('strong', { text: ch.text })]);
            chBtns[ch.id] = btn; list.appendChild(btn);
          });
          box.appendChild(list);
        } else if (b.hintText) box.appendChild(U.el('p', { class: 'kp-info', text: b.hintText }));
      }
      draw();
      return {
        getAnswer: function () { return b.pickMode === 'months' ? { months: selM.slice() } : b.pickMode === 'bars' ? { bars: selB.slice() } : { choice: choice }; },
        isReady: function () { return b.pickMode === 'months' ? selM.length > 0 : b.pickMode === 'bars' ? selB.length > 0 : !!choice; },
        lock: function () {}, applyHint: function () {}, destroy: function () {}
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
