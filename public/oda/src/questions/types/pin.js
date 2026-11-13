/* Haritaya pin: oyuncu Deniz'in konumunu masadaki haritada işaretler. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  KP.registerType('pin', {
    mapNeeded: true,
    checkCase: function (c) {
      var e = [], a = c.answer || {};
      if (a.mode === 'zone') { if (['karasal', 'akdeniz', 'karadeniz', 'sert'].indexOf(a.zone) < 0) e.push('answer.zone: karasal|akdeniz|karadeniz|sert'); }
      else if (a.mode === 'point') { if (typeof a.lat !== 'number' || typeof a.lon !== 'number' || typeof a.radiusKm !== 'number') e.push('answer: lat, lon, radiusKm gerekli'); }
      else e.push('answer.mode: zone|point');
      return e;
    },
    // a = {lat, lon, zone?}  (zone: haritanın seçtiği bölge adı; yoksa en yakın kara hücresine bakılır)
    validate: function (c, a) {
      var ans = c.answer;
      if (!a || typeof a.lat !== 'number' || typeof a.lon !== 'number') return { ok: false, score: 0, detail: { reason: 'bos' } };
      if (ans.mode === 'zone') {
        var z = a.zone || KP.geo.zoneNear(a.lat, a.lon, 30), ok = z === ans.zone;
        return { ok: ok, score: ok ? 1 : 0, detail: { zone: z } };
      }
      var d = KP.geo.distanceKm(a, ans), ok2 = d <= ans.radiusKm;
      return { ok: ok2, score: ok2 ? 1 : 0, detail: { distKm: Math.round(d), near: !ok2 && d <= ans.radiusKm * 2 } };
    },
    mount: function (ctx) {
      var c = ctx.case, A = ctx.adapter || {}, last = null;
      var sel = U.el('div', { class: 'kp-sel', text: 'Henüz bir yer seçmedin.' });
      ctx.host.appendChild(U.el('div', { class: 'kp-info', text: 'Masadaki haritaya dokunarak Deniz’in konumunu işaretle. Değiştirmek için başka bir yere dokun.' }));
      ctx.host.appendChild(sel);
      if (A.setMapMode) A.setMapMode((c.board && c.board.mapMode) || 'neutral', c.board || {});
      if (A.enableMapPick) A.enableMapPick(function (p) {
        last = { lat: p.lat, lon: p.lon, zone: p.zone };
        sel.textContent = 'Seçtiğin yer: ' + p.lat.toFixed(2) + '°K, ' + p.lon.toFixed(2) + '°D';
        if (A.clearMarkers) A.clearMarkers();
        if (A.addMarker) A.addMarker(p.lat, p.lon);
        ctx.changed();
      });
      return {
        getAnswer: function () { return last; }, isReady: function () { return !!last; }, lock: function () {}, applyHint: function () {},
        destroy: function () { if (A.disableMapPick) A.disableMapPick(); if (A.clearMarkers) A.clearMarkers(); }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
