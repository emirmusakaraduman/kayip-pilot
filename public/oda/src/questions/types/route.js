/* Rota çizme: haritada ya da eş yükselti panosunda helikopter/kurtarma rotasını çizer. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;

  function validateMap(c, a) {
    var b = c.board, G = KP.geo, pts = (a && a.points) || [], d = {}, i, k;
    if (pts.length < 2) return { ok: false, score: 0, detail: { reason: 'kisa' } };
    d.tooMany = !!b.maxPoints && pts.length > b.maxPoints;
    d.startOk = G.distanceKm(pts[0], b.start) <= b.start.radiusKm;
    d.endOk = G.distanceKm(pts[pts.length - 1], b.end) <= b.end.radiusKm;
    d.lengthKm = Math.round(G.polylineLengthKm(pts));
    d.lengthOk = !b.maxLengthKm || d.lengthKm <= b.maxLengthKm;
    d.hit = [];
    (b.forbidden || []).forEach(function (f, fi) {
      for (i = 1; i < pts.length; i++) if (G.segPointDistKm(pts[i - 1], pts[i], f) < f.radiusKm) { d.hit.push(f.name || ('yasak bölge ' + (fi + 1))); break; }
    });
    d.missed = [];
    var samples = G.samplePolyline(pts, 10), idx = -1;
    (b.waypoints || []).forEach(function (w) {
      var from = b.ordered ? idx + 1 : 0, found = -1;
      for (k = from; k < samples.length; k++) if (G.distanceKm(samples[k], w) <= w.radiusKm) { found = k; break; }
      if (found < 0) d.missed.push(w.name || 'ara nokta'); else if (b.ordered) idx = found;
    });
    var ok = d.startOk && d.endOk && d.lengthOk && !d.tooMany && !d.hit.length && !d.missed.length;
    return { ok: ok, score: ok ? 1 : 0, detail: d };
  }
  function validateContour(c, a) {
    var b = c.board, pts = (a && a.points) || [], d = {};
    if (pts.length < 2) return { ok: false, score: 0, detail: { reason: 'kisa' } };
    function near(p, t) { return Math.hypot(p[0] - t.x, p[1] - t.y) <= t.r; }
    d.tooMany = !!b.maxPoints && pts.length > b.maxPoints;
    d.startOk = near(pts[0], b.start); d.endOk = near(pts[pts.length - 1], b.end);
    var st = KP.contour.routeStats(b.terrain, pts, b.widthKm);
    d.stats = { lengthKm: +st.lengthKm.toFixed(1), ascentM: Math.round(st.ascentM), maxGradePct: +st.maxGradePct.toFixed(1) };
    d.ascentOk = st.ascentM <= b.maxAscentM;
    d.gradeOk = !b.maxGradePct || st.maxGradePct <= b.maxGradePct;
    d.lengthOk = !b.maxLengthKm || st.lengthKm <= b.maxLengthKm;
    var ok = d.startOk && d.endOk && d.ascentOk && d.gradeOk && d.lengthOk && !d.tooMany;
    return { ok: ok, score: ok ? 1 : 0, detail: d };
  }

  KP.registerType('route', {
    mapNeeded: function (c) { return c.board && c.board.mode === 'map'; },
    checkCase: function (c) {
      var e = [], b = c.board || {};
      if (b.mode === 'map') {
        if (!b.start || !b.end || typeof b.start.radiusKm !== 'number' || typeof b.end.radiusKm !== 'number') e.push('map: board.start/end {lat,lon,radiusKm} gerekli');
        if (!b.maxLengthKm) e.push('map: board.maxLengthKm gerekli');
      } else if (b.mode === 'contour') {
        if (!b.terrain || !b.terrain.hills || !b.terrain.hills.length) e.push('contour: board.terrain.hills gerekli');
        if (!b.start || !b.end || typeof b.start.r !== 'number') e.push('contour: board.start/end {x,y,r} gerekli');
        if (typeof b.maxAscentM !== 'number' || !b.widthKm) e.push('contour: board.maxAscentM ve widthKm gerekli');
      } else e.push('board.mode: map|contour');
      return e;
    },
    // a = {points:[{lat,lon},...]} (map)  |  {points:[[x,y],...]} (contour)
    validate: function (c, a) { return c.board.mode === 'map' ? validateMap(c, a) : validateContour(c, a); },
    mount: function (ctx) {
      var c = ctx.case, b = c.board, A = ctx.adapter || {}, pts = [], info = U.el('div', { class: 'kp-sel', text: 'Henüz nokta eklemedin.' });
      function status() {
        if (b.mode === 'contour') {
          if (pts.length > 1) { var st = KP.contour.routeStats(b.terrain, pts, b.widthKm); info.textContent = pts.length + ' nokta · yol ' + st.lengthKm.toFixed(1) + ' km · toplam tırmanış ' + Math.round(st.ascentM) + ' m (sınır ' + b.maxAscentM + ' m)'; }
          else info.textContent = pts.length ? '1 nokta eklendi.' : 'Henüz nokta eklemedin.';
        } else info.textContent = pts.length ? pts.length + ' nokta · ' + Math.round(KP.geo.polylineLengthKm(pts)) + ' km (en fazla ' + b.maxLengthKm + ' km)' : 'Henüz nokta eklemedin.';
        ctx.changed();
      }
      function redraw() { if (b.mode === 'map' && A.drawRoute) A.drawRoute(pts); if (draw) draw(); status(); }
      var draw = null;
      ctx.host.appendChild(U.el('div', { class: 'kp-info', text: b.mode === 'map' ? 'Haritaya dokunarak rotanın noktalarını sırayla ekle. Başlangıçtan Deniz’e doğru çiz.' : 'Panoya dokunarak A noktasından B noktasına rotanı çiz. Eş yükselti çizgileri sıklaştıkça yamaç diktir.' }));
      ctx.host.appendChild(info);
      var bar = U.el('div', { class: 'kp-row' }, [
        U.el('button', { type: 'button', class: 'kp-btn kp-sm', text: 'Son noktayı sil', onclick: function () { pts.pop(); redraw(); } }),
        U.el('button', { type: 'button', class: 'kp-btn kp-sm', text: 'Temizle', onclick: function () { pts = []; redraw(); } })
      ]);
      ctx.host.appendChild(bar);
      if (b.mode === 'map') {
        if (A.setMapMode) A.setMapMode(b.mapMode || 'neutral', b);
        if (A.showEndpoints) A.showEndpoints(b);
        if (A.enableMapPick) A.enableMapPick(function (p) { pts.push({ lat: p.lat, lon: p.lon }); redraw(); });
      } else {
        if (A.setMapMode) A.setMapMode('hidden', b);
        var S = 360, svg = U.el('svg', { viewBox: '0 0 ' + S + ' ' + S, class: 'kp-chart kp-contour', role: 'img', 'aria-label': 'Eş yükselti haritası' });
        var segs = KP.contour.contourSegments(b.terrain, (function () { var L = [], h = b.contourInterval || 50, k; for (k = 1; k < 30; k++) L.push((b.terrain.base || 0) + h * k); return L; })(), 64);
        segs.forEach(function (s) { var idx = Math.round((s[4] - (b.terrain.base || 0)) / (b.contourInterval || 50)); svg.appendChild(U.el('line', { x1: s[0] * S, y1: s[1] * S, x2: s[2] * S, y2: s[3] * S, class: 'kp-cl' + (idx % 5 === 0 ? ' kp-clx' : '') })); });
        [['A', b.start], ['B', b.end]].forEach(function (p) {
          svg.appendChild(U.el('circle', { cx: p[1].x * S, cy: p[1].y * S, r: Math.max(6, p[1].r * S), class: 'kp-pt' }));
          svg.appendChild(U.el('text', { x: p[1].x * S, y: p[1].y * S + 4, class: 'kp-ptt', 'text-anchor': 'middle', text: p[0] }));
        });
        var layer = U.el('g', {}); svg.appendChild(layer);
        draw = function () {
          U.clear(layer);
          if (pts.length > 1) layer.appendChild(U.el('polyline', { points: pts.map(function (p) { return (p[0] * S).toFixed(1) + ',' + (p[1] * S).toFixed(1); }).join(' '), class: 'kp-route' }));
          pts.forEach(function (p) { layer.appendChild(U.el('circle', { cx: p[0] * S, cy: p[1] * S, r: 3.5, class: 'kp-rp' })); });
        };
        svg.addEventListener('click', function (e) {
          var r = svg.getBoundingClientRect && svg.getBoundingClientRect(); if (!r || !r.width) return;
          // viewBox kare; kutu daha geniş/dar olunca çizim ortalanır (meet). Tıklamayı çizilen kareye göre hesapla.
          var side = Math.min(r.width, r.height || r.width), ox = r.left + (r.width - side) / 2, oy = r.top + ((r.height || r.width) - side) / 2;
          pts.push([U.clamp((e.clientX - ox) / side, 0, 1), U.clamp((e.clientY - oy) / side, 0, 1)]); redraw();
        });
        ctx.host.appendChild(svg);
        if (b.contourNote) ctx.host.appendChild(U.el('p', { class: 'kp-info', text: b.contourNote }));
      }
      return {
        getAnswer: function () { return { points: pts.slice() }; }, isReady: function () { return pts.length >= 2; },
        lock: function () {}, applyHint: function () {},
        reset: function () { pts = []; redraw(); },
        destroy: function () { if (A.disableMapPick) A.disableMapPick(); if (A.clearRoute) A.clearRoute(); if (A.clearMarkers) A.clearMarkers(); }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
