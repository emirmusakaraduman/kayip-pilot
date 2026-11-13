/* Harita koordinatları: masadaki kabartma harita (metre) <-> enlem/boylam, mesafe, bölge sorgusu. */
(function (root) {
  'use strict';
  var KP = root.KP, G = KP.geo = {};
  // Harita levhasının merkezi (35.435°D, 38.96°K) ve ölçekleri. Haritanın kendi izdüşümü doğrusaldır.
  // Kara kütlesi: boylam 26.05–44.82 = 4.05 m, enlem 42.10–35.82 = 1.801 m.
  G.LON0 = 35.435; G.LAT0 = 38.96; G.KX = 18.77 / 4.05; G.KY = 6.28 / 1.801;
  G.KM_LAT = 111.0; G.KM_LON = 86.5;   // 39° enleminde 1° ≈ km

  G.localToLatLon = function (x, y) { return { lat: G.LAT0 + y * G.KY, lon: G.LON0 + x * G.KX }; };
  G.latLonToLocal = function (lat, lon) { return { x: (lon - G.LON0) / G.KX, y: (lat - G.LAT0) / G.KY }; };

  G.distanceKm = function (a, b) {
    var R = 6371, dLat = KP.util.rad(b.lat - a.lat), dLon = KP.util.rad(b.lon - a.lon);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(KP.util.rad(a.lat)) * Math.cos(KP.util.rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  G.plane = function (p) { return { x: (p.lon - G.LON0) * G.KM_LON, y: (p.lat - G.LAT0) * G.KM_LAT }; };
  G.segPointDistKm = function (a, b, c) {
    var A = G.plane(a), B = G.plane(b), C = G.plane(c), dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy;
    var t = L2 ? Math.max(0, Math.min(1, ((C.x - A.x) * dx + (C.y - A.y) * dy) / L2)) : 0;
    return Math.hypot(C.x - (A.x + t * dx), C.y - (A.y + t * dy));
  };
  G.polylineLengthKm = function (pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += G.distanceKm(pts[i - 1], pts[i]); return s; };
  G.samplePolyline = function (pts, stepKm) {
    var out = [], acc = 0, i, k;
    if (!pts.length) return out;
    out.push({ lat: pts[0].lat, lon: pts[0].lon, s: 0 });
    for (i = 1; i < pts.length; i++) {
      var seg = G.distanceKm(pts[i - 1], pts[i]), n = Math.max(1, Math.ceil(seg / stepKm));
      for (k = 1; k <= n; k++) {
        var t = k / n;
        out.push({ lat: pts[i - 1].lat + (pts[i].lat - pts[i - 1].lat) * t, lon: pts[i - 1].lon + (pts[i].lon - pts[i - 1].lon) * t, s: acc + seg * t });
      }
      acc += seg;
    }
    return out;
  };

  // Bölge ızgarası (MAP_DATA.G): 0 karasal, 1 akdeniz, 2 karadeniz, 3 sert karasal, 4 göl (karasal), 255 deniz.
  var ZN = ['karasal', 'akdeniz', 'karadeniz', 'sert', 'karasal'];
  var grid = null;
  function b64(s) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(s, 'base64'));
    var bin = atob(s), u = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
  }
  G.setMapData = function (md) { grid = { G: b64(md.G), HG: b64(md.HG), GW: md.GW, GH: md.GH, PW: md.PW, PH: md.PH }; return G; };
  G.hasGrid = function () { return !!grid; };
  function cell(lat, lon) {
    var p = G.latLonToLocal(lat, lon), u = p.x / grid.PW + 0.5, v = p.y / grid.PH + 0.5;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
    return { c: Math.floor(u * grid.GW), r: Math.floor((1 - v) * grid.GH) };
  }
  G.zoneAt = function (lat, lon) {
    if (!grid) return null;
    var k = cell(lat, lon); if (!k) return null;
    var z = grid.G[k.r * grid.GW + k.c];
    return z === 255 ? 'sea' : ZN[z];
  };
  // Kıyıdaki noktalar haritada denize düşebilir (kıyı çizgisi sadeleştirildi). En yakın kara hücresinin bölgesi.
  G.zoneNear = function (lat, lon, radiusKm) {
    var z = G.zoneAt(lat, lon);
    if (z && z !== 'sea') return z;
    if (!grid) return null;
    var k = cell(lat, lon); if (!k) return null;
    var cellKm = (grid.PW / grid.GW) * G.KX * G.KM_LON, R = Math.ceil((radiusKm || 30) / cellKm), best = null, bd = 1e9, dr, dc;
    for (dr = -R; dr <= R; dr++) for (dc = -R; dc <= R; dc++) {
      var r = k.r + dr, c = k.c + dc; if (r < 0 || c < 0 || r >= grid.GH || c >= grid.GW) continue;
      var v = grid.G[r * grid.GW + c]; if (v === 255) continue;
      var d = Math.hypot(dr, dc); if (d < bd) { bd = d; best = v; }
    }
    return best == null || bd * cellKm > (radiusKm || 30) ? null : ZN[best];
  };
})(typeof window !== 'undefined' ? window : globalThis);
