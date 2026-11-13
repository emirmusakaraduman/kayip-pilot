/* Eş yükselti (kontur) bulmacaları için sentetik arazi. Koordinatlar 0..1 pano birimi, yükseklik metre. */
(function (root) {
  'use strict';
  var KP = root.KP, C = KP.contour = {};
  C.heightAt = function (t, x, y) {
    var h = t.base || 0, i;
    for (i = 0; i < t.hills.length; i++) {
      var k = t.hills[i], dx = x - k.x, dy = y - k.y;
      h += k.h * Math.exp(-(dx * dx + dy * dy) / (2 * k.r * k.r));
    }
    return h;
  };
  // Marching squares: seviye başına çizgi parçaları [x1,y1,x2,y2,seviye]
  C.contourSegments = function (t, levels, n) {
    n = n || 64;
    var H = [], i, j, segs = [];
    for (j = 0; j <= n; j++) { H[j] = []; for (i = 0; i <= n; i++) H[j][i] = C.heightAt(t, i / n, j / n); }
    levels.forEach(function (L) {
      for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
        var h00 = H[j][i], h10 = H[j][i + 1], h11 = H[j + 1][i + 1], h01 = H[j + 1][i], pts = [];
        function e(xa, ya, ha, xb, yb, hb) { if ((ha < L) !== (hb < L)) { var f = (L - ha) / (hb - ha); pts.push([(xa + (xb - xa) * f) / n, (ya + (yb - ya) * f) / n]); } }
        e(i, j, h00, i + 1, j, h10); e(i + 1, j, h10, i + 1, j + 1, h11); e(i, j + 1, h01, i + 1, j + 1, h11); e(i, j, h00, i, j + 1, h01);
        if (pts.length === 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1], L]);
        else if (pts.length === 4) { segs.push([pts[0][0], pts[0][1], pts[3][0], pts[3][1], L]); segs.push([pts[1][0], pts[1][1], pts[2][0], pts[2][1], L]); }
      }
    });
    return segs;
  };
  // Rota istatistikleri. widthKm: panonun gerçek genişliği (km). Eğim yüzde olarak.
  C.routeStats = function (t, pts, widthKm) {
    var out = { lengthKm: 0, ascentM: 0, descentM: 0, maxGradePct: 0, maxH: -1e9, minH: 1e9 }, i, k;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], segN = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.004));
      var prev = C.heightAt(t, a[0], a[1]);
      out.maxH = Math.max(out.maxH, prev); out.minH = Math.min(out.minH, prev);
      for (k = 1; k <= segN; k++) {
        var f = k / segN, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, h = C.heightAt(t, x, y);
        var dsM = Math.hypot(b[0] - a[0], b[1] - a[1]) / segN * widthKm * 1000, dh = h - prev;
        if (dh > 0) out.ascentM += dh; else out.descentM -= dh;
        if (dsM > 0) out.maxGradePct = Math.max(out.maxGradePct, Math.abs(dh) / dsM * 100);
        out.lengthKm += dsM / 1000; out.maxH = Math.max(out.maxH, h); out.minH = Math.min(out.minH, h); prev = h;
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
