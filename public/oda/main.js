(function () {
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('c');
  var errBox = document.getElementById('err');

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) {
    errBox.style.display = 'flex';
    return;
  }
  if (!window.THREE) { errBox.style.display = 'flex'; return; }

  var DPR = Math.min(window.devicePixelRatio || 1, 2), qRatio = Math.min(DPR * 1.35, 3);
  renderer.setPixelRatio(qRatio);
  var MAXA = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070a);
  scene.fog = new THREE.FogExp2(0x04070a, 0.04);

  var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);

  /* ---------- yardımcılar ---------- */
  function makeTex(w, h, draw, repeat) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    draw(g, w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = MAXA;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  function mesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function shadows(obj) {
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }

  /* ---------- malzeme dokuları ---------- */
  var woodTex = makeTex(512, 512, function (g, w, h) {
    g.fillStyle = '#3d2819'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 240; i++) {
      var y = Math.random() * h;
      g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '18,9,4' : '96,64,36') + ',' + (0.05 + Math.random() * 0.13) + ')';
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(0, y);
      for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.6);
      g.stroke();
    }
  }, [2, 1]);

  var floorTex = makeTex(512, 512, function (g, w, h) {
    g.fillStyle = '#140f0c'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 8; i++) {
      var v = 16 + Math.floor(Math.random() * 14);
      g.fillStyle = 'rgb(' + v + ',' + (v - 4) + ',' + (v - 7) + ')';
      g.fillRect(i * 64, 0, 64, h);
      g.fillStyle = '#080504'; g.fillRect(i * 64, 0, 2, h);
    }
    for (var j = 0; j < 80; j++) {
      g.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.25 + ')';
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1);
    }
  }, [6, 6]);

  var wallTex = makeTex(256, 256, function (g, w, h) {
    g.fillStyle = '#161e1b'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1200; i++) {
      var a = Math.random() * 0.06;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 2 + ')';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, [4, 2]);

  // sıva pürüzü: soluk, düzensiz benekli yükseklik haritası (yalnız bump; renk wallTex'te)
  var plasterBump = makeTex(256, 256, function (g, w, h) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 5000; i++) {
      var v = 90 + Math.floor(Math.random() * 80);
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.5)';
      var s = 1 + Math.random() * 3;
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
  }, [3, 1.5]);

  /* ---------- oda ---------- */
  var floor =mesh(new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 0.6, roughness: 0.6, metalness: 0.0 }), 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  var wall = mesh(new THREE.PlaneGeometry(16, 7),
    new THREE.MeshStandardMaterial({ map: wallTex, bumpMap: plasterBump, bumpScale: 0.8, roughness: 1, metalness: 0 }), 0, 3.5, -4);
  wall.receiveShadow = true;
  scene.add(wall);

  var sideWall = mesh(new THREE.PlaneGeometry(10, 7),
    new THREE.MeshStandardMaterial({ map: wallTex, bumpMap: plasterBump, bumpScale: 0.8, roughness: 1, metalness: 0 }), -7, 3.5, 0);
  sideWall.rotation.y = Math.PI / 2;
  scene.add(sideWall);

  var DY = 1.06; // masa üst yüzeyi

  /* ---------- masa ---------- */
  var deskMat = new THREE.MeshStandardMaterial({ map: woodTex, bumpMap: woodTex, bumpScale: 0.5, roughness: 0.8, metalness: 0.03 });
  deskMat.bumpMap = woodTex; deskMat.bumpScale = 1.1;
  var desk = mesh(new THREE.BoxGeometry(11.0, 0.12, 3.3), deskMat, 0.3, DY - 0.06, 0.5);
  desk.castShadow = true; desk.receiveShadow = true;
  scene.add(desk);
  [[-5.0, -1.0], [5.6, -1.0], [-5.0, 1.95], [5.6, 1.95]].forEach(function (p) {
    var leg = mesh(new THREE.BoxGeometry(0.16, DY - 0.12, 0.16), deskMat, p[0], (DY - 0.12) / 2, p[1]);
    leg.castShadow = true; scene.add(leg);
  });

  /* ---------- pencere: gerçekçi fırtına bulutları, yağmur, şimşek ---------- */
  var WW = 560, WH = 360;
  var winC = document.createElement('canvas'); winC.width = WW; winC.height = WH;
  var wg = winC.getContext('2d');
  var winTex = new THREE.CanvasTexture(winC); winTex.encoding = THREE.sRGBEncoding; winTex.anisotropy = MAXA;

  function hash2(ix, iy, seed) {
    var n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vnoise(x, y, period, seed) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var x0 = ((ix % period) + period) % period, x1 = (((ix + 1) % period) + period) % period;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    var a = hash2(x0, iy, seed), b = hash2(x1, iy, seed), c = hash2(x0, iy + 1, seed), d = hash2(x1, iy + 1, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  function fbm(x, y, basePeriod, seed) {
    var sum = 0, amp = 0.5, f = 1, norm = 0;
    for (var o = 0; o < 5; o++) { sum += amp * vnoise(x * f, y * f, basePeriod * f, seed + o); norm += amp; amp *= 0.5; f *= 2; }
    return sum / norm;
  }
  function makeClouds(W, H, seed, scaleY, lo, hi, dark, light) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), img = g.createImageData(W, H), P = 4;
    for (var py = 0; py < H; py++) {
      for (var px = 0; px < W; px++) {
        var u = px / W * P, v = py / H * scaleY;
        var d = fbm(u, v, P, seed) * 1.2 + (1 - py / H) * 0.18 - 0.1;
        var d2 = fbm(u, v + 0.04, P, seed) * 1.2 + (1 - (py + 8) / H) * 0.18 - 0.1;
        var a = Math.max(0, Math.min(1, (d - lo) / (hi - lo))); a = a * a * (3 - 2 * a);
        var lit = Math.max(0, Math.min(1, 0.45 + (d - d2) * 7));
        var k = (py * W + px) * 4;
        img.data[k] = dark[0] + (light[0] - dark[0]) * lit;
        img.data[k + 1] = dark[1] + (light[1] - dark[1]) * lit;
        img.data[k + 2] = dark[2] + (light[2] - dark[2]) * lit;
        img.data[k + 3] = a * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  var cloudFar = makeClouds(384, 192, 11, 2.0, 0.42, 0.78, [20, 32, 40], [100, 124, 136]);
  var cloudNear = makeClouds(384, 192, 47, 2.6, 0.46, 0.80, [7, 12, 16], [64, 82, 92]);
  var cloudX = 0;
  var flash = 0, flashPhase = 0, bolt = null;
  var drops = [];
  for (var di = 0; di < 170; di++) drops.push({ x: Math.random() * 620, y: Math.random() * 380, v: 11 + Math.random() * 12 });
  var beads = [];
  for (var bd = 0; bd < 80; bd++) beads.push({ x: Math.random() * WW, y: Math.random() * WH, r: 2.5 + Math.random() * 5, v: 0 });

  function drawLayer(img, off, alpha, flashAmt) {
    var w = WW * 1.3, hh = WH * 0.92;
    var m = ((off % w) + w) % w, x = -m;
    wg.globalAlpha = alpha;
    wg.drawImage(img, x, 0, w, hh);
    wg.drawImage(img, x + w, 0, w, hh);
    if (flashAmt > 0) {
      wg.globalCompositeOperation = 'lighter';
      wg.globalAlpha = Math.min(1, flashAmt * 0.95) * alpha;
      wg.drawImage(img, x, 0, w, hh);
      wg.drawImage(img, x + w, 0, w, hh);
      wg.globalCompositeOperation = 'source-over';
    }
    wg.globalAlpha = 1;
  }
  function makeBolt() {
    var pts = [], x = 90 + Math.random() * (WW - 180), y = 0;
    pts.push([x, y]);
    while (y < WH * 0.78) { y += 18 + Math.random() * 26; x += (Math.random() - 0.5) * 46; pts.push([x, y]); }
    var bi = Math.max(2, Math.floor(pts.length * 0.4));
    var bx = pts[bi][0], by = pts[bi][1], br = [[bx, by]];
    for (var k = 0; k < 4; k++) { by += 16 + Math.random() * 18; bx += (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 20); br.push([bx, by]); }
    bolt = { main: pts, branch: br };
  }
  function strokePath(pts, w) {
    wg.beginPath(); wg.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) wg.lineTo(pts[i][0], pts[i][1]);
    wg.lineWidth = w; wg.stroke();
  }
  function triggerFlash() { flash = 1; flashPhase = 1; makeBolt(); }

  // oyun durumu: drawWindow ilk kez hemen aşağıda çağrılır, bu yüzden pencereden önce tanımlanmalı
  var state = { pil: 100, secili: {}, hover: null, ilerleme: 0, iz: {}, parazit: 0 };

  function drawWindow() {
    cloudX += 2;
    var sky = wg.createLinearGradient(0, 0, 0, WH);
    sky.addColorStop(0, '#0b161d'); sky.addColorStop(0.55, '#15252d'); sky.addColorStop(1, '#27393f');
    wg.fillStyle = sky; wg.fillRect(0, 0, WW, WH);
    drawLayer(cloudFar, cloudX * 0.35, 0.95, flash);
    drawLayer(cloudNear, cloudX * 0.8, 0.92, flash * 0.8);
    var hz = wg.createLinearGradient(0, WH * 0.55, 0, WH);
    hz.addColorStop(0, 'rgba(46,66,76,0)'); hz.addColorStop(1, 'rgba(60,82,92,0.55)');
    wg.fillStyle = hz; wg.fillRect(0, WH * 0.55, WW, WH * 0.45);
    if (state.ilerleme > 0) { // ilerledikçe ufuktan sıcak bir şafak aydınlığı
      var dw = wg.createLinearGradient(0, WH * 0.35, 0, WH);
      dw.addColorStop(0, 'rgba(255,170,90,0)'); dw.addColorStop(1, 'rgba(255,170,90,' + (state.ilerleme * 0.32).toFixed(3) + ')');
      wg.fillStyle = dw; wg.fillRect(0, WH * 0.35, WW, WH * 0.65);
    }
    if (bolt && flash > 0.12) {
      wg.save();
      wg.strokeStyle = 'rgba(235,245,255,' + Math.min(1, flash * 1.3) + ')';
      wg.shadowColor = '#9cc4ff'; wg.shadowBlur = 18; wg.lineJoin = 'round';
      strokePath(bolt.main, 2.8); strokePath(bolt.branch, 1.6);
      wg.restore();
    }
    wg.strokeStyle = 'rgba(175,205,218,' + (0.42 * (1 - state.ilerleme * 0.5)).toFixed(3) + ')'; wg.lineWidth = 1.5;
    for (var k = 0; k < drops.length; k++) {
      var d = drops[k];
      d.y += d.v; d.x -= d.v * 0.12;
      if (d.y > 390) { d.y = -30; d.x = Math.random() * 620; }
      wg.beginPath(); wg.moveTo(d.x, d.y); wg.lineTo(d.x + 5, d.y - 28); wg.stroke();
    }
    for (var bj = 0; bj < beads.length; bj++) {
      var bb = beads[bj];
      if (bb.v === 0 && Math.random() < 0.0015) bb.v = 2 + Math.random() * 3;
      if (bb.v > 0) {
        wg.strokeStyle = 'rgba(170,200,215,0.16)'; wg.lineWidth = bb.r * 0.7;
        wg.beginPath(); wg.moveTo(bb.x, bb.y - bb.v * 10); wg.lineTo(bb.x, bb.y); wg.stroke();
        bb.y += bb.v; bb.v *= 0.985; if (bb.v < 0.35) bb.v = 0;
        if (bb.y > WH + 10) { bb.y = -10; bb.x = Math.random() * WW; bb.v = 0; }
      }
      var bg3 = wg.createRadialGradient(bb.x - bb.r * 0.3, bb.y - bb.r * 0.3, bb.r * 0.1, bb.x, bb.y, bb.r);
      bg3.addColorStop(0, 'rgba(230,242,250,0.6)'); bg3.addColorStop(0.55, 'rgba(120,150,165,0.2)'); bg3.addColorStop(1, 'rgba(8,16,22,0.4)');
      wg.fillStyle = bg3; wg.beginPath(); wg.ellipse(bb.x, bb.y, bb.r * 0.85, bb.r, 0, 0, Math.PI * 2); wg.fill();
    }
    if (flash > 0) { wg.fillStyle = 'rgba(215,232,255,' + Math.min(1, flash * 0.45) + ')'; wg.fillRect(0, 0, WW, WH); }
    winTex.needsUpdate = true;
  }
  drawWindow();
  var winPane = mesh(new THREE.PlaneGeometry(2.8, 1.8),
    new THREE.MeshBasicMaterial({ map: winTex, fog: false, toneMapped: false }), -3.0, 2.55, -3.96);
  scene.add(winPane);
  var frameMat = new THREE.MeshStandardMaterial({ color: 0x1d282c, roughness: 0.6, metalness: 0.4 });
  [[0, 0.93, 2.9, 0.1], [0, -0.93, 2.9, 0.1], [-1.45, 0, 0.1, 1.9], [1.45, 0, 0.1, 1.9], [0, 0, 0.05, 1.8], [0, 0, 2.8, 0.05]].forEach(function (f) {
    scene.add(mesh(new THREE.BoxGeometry(f[2], f[3], 0.08), frameMat, -3.0 + f[0], 2.55 + f[1], -3.93));
  });
  scene.add(mesh(new THREE.BoxGeometry(3.1, 0.08, 0.3), frameMat, -3.0, 1.6, -3.85));

  /* ---------- Türkiye iklim haritası (kabartma) ---------- */
  var ZONES = [
    { zone: 'karasal',  pts: '17,30 61,23 86,49 100,66 80,76 49,80 17,72', color: 0xd4c878, depth: 0.05 },
    { zone: 'karasal',  pts: '100,68 120,75 150,72 184,46 232,46 264,72 300,86 340,84 380,65 375,92 395,110 430,128 462,130 458,198 411,205 355,209 306,213 272,217 270,180 235,165 190,168 150,175 130,155 105,130 112,100', color: 0xd4c878, depth: 0.06, main: true },
    { zone: 'karadeniz', pts: '86,49 135,49 184,19 232,19 264,46 306,61 348,57 392,38 380,65 340,84 300,86 264,72 232,46 184,46 150,72 120,75 100,68', color: 0x348f89, depth: 0.10, main: true },
    { zone: 'sert',     pts: '392,38 438,53 445,87 472,106 462,130 430,128 395,110 375,92 380,65', color: 0x9c2222, depth: 0.11, main: true },
    { zone: 'akdeniz',  pts: '17,72 49,80 80,76 100,68 112,100 105,130 130,155 150,175 190,168 235,165 270,180 272,217 257,247 252,220 223,220 184,243 147,217 125,213 100,236 71,220 47,209 42,182 22,160 29,125 17,103', color: 0xb184bd, depth: 0.07, main: true }
  ];
  var OUTLINE = '17,30 61,23 86,49 135,49 184,19 232,19 264,46 306,61 348,57 392,38 438,53 445,87 472,106 460,152 458,198 411,205 355,209 306,213 272,217 257,247 252,220 223,220 184,243 147,217 125,213 100,236 71,220 47,209 42,182 22,160 29,125 17,103 20,84 49,80 17,72';
  var S = 4.05 / 490;
  var MAP_X = 1.85, MAP_Z = 0.2;
  function parsePts(str) { return str.split(' ').map(function (p) { var a = p.split(','); return [parseFloat(a[0]), parseFloat(a[1])]; }); }
  function shapeFrom(str) {
    var sh = new THREE.Shape();
    parsePts(str).forEach(function (p, i) {
      var x = (p[0] - 245) * S, y = (130 - p[1]) * S;
      if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    });
    sh.closePath();
    return sh;
  }
  var mapG = new THREE.Group();
  mapG.position.set(MAP_X, DY, MAP_Z);
  mapG.rotation.x = -Math.PI / 2;
  scene.add(mapG);

  var zoneMeshes = [];
  var zoneInfo = {};
  // soru sistemi nötr modu: iklim renklerini gri tona çeker (doku yeniden üretilmez), uNeutral 0..1 arası yumuşakça değişir
  var KP_NEUTRAL = { value: 0 };
  function kpNeutralize(mat) {
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uNeutral = KP_NEUTRAL;
      sh.fragmentShader = 'uniform float uNeutral;\n' + sh.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\nfloat kpLum = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(kpLum) * vec3(1.05,1.0,0.9), uNeutral);');
    };
  }
  (function buildReliefMap() {
    var MD = window.MAP_DATA;
    if (!MD) return;
    function b64buf(bs) { var st = atob(bs), u = new Uint8Array(st.length); for (var q = 0; q < st.length; q++) u[q] = st.charCodeAt(q); return u.buffer; }
    var Vq = new Int16Array(b64buf(MD.V)), Tq = new Uint16Array(b64buf(MD.T)), Zq = new Uint8Array(b64buf(MD.Z));
    var nV = Vq.length / 3, nT = Tq.length / 3;
    var px = new Float32Array(nV), py = new Float32Array(nV), pz = new Float32Array(nV);
    for (var i = 0; i < nV; i++) { px[i] = Vq[3 * i] / 10000; py[i] = Vq[3 * i + 1] / 10000; pz[i] = Vq[3 * i + 2] / 10000; }
    var nx = new Float32Array(nV), ny = new Float32Array(nV), nz = new Float32Array(nV);
    for (var t = 0; t < nT; t++) {
      var ia = Tq[3 * t], ib = Tq[3 * t + 1], ic = Tq[3 * t + 2];
      var ux = px[ib] - px[ia], uy = py[ib] - py[ia], uz = pz[ib] - pz[ia];
      var vx = px[ic] - px[ia], vy = py[ic] - py[ia], vz = pz[ic] - pz[ia];
      var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      nx[ia] += fx; ny[ia] += fy; nz[ia] += fz; nx[ib] += fx; ny[ib] += fy; nz[ib] += fz; nx[ic] += fx; ny[ic] += fy; nz[ic] += fz;
    }
    for (i = 0; i < nV; i++) { var ln = Math.sqrt(nx[i] * nx[i] + ny[i] * ny[i] + nz[i] * nz[i]) || 1; nx[i] /= ln; ny[i] /= ln; nz[i] /= ln; }

    var PW = MD.PW, PH = MD.PH;
    var KEYS = ['karasal', 'akdeniz', 'karadeniz', 'sert', 'lake'];
    var ZC = [0xc9b97a, 0xa89a6a, 0x4a8a5a, 0xa8584a, 0x2c78b8];
    var texMats = [], terrainTex = null, nrmMats = [];
    if (MD.NRM) {
      var nimg = new Image();
      nimg.onload = function () {
        var nrmTex = new THREE.Texture(nimg);
        nrmTex.encoding = THREE.LinearEncoding; nrmTex.anisotropy = MAXA; nrmTex.needsUpdate = true;
        nrmMats.forEach(function (m) { m.normalMap = nrmTex; m.normalScale.set(1.1, 1.1); m.needsUpdate = true; });
      };
      nimg.src = MD.NRM;
    }
    function applyTex() { texMats.forEach(function (m) { m.map = terrainTex; m.color.setHex(0xffffff); m.needsUpdate = true; }); }
    if (MD.TEX) {
      var timg = new Image();
      timg.onload = function () {
        terrainTex = new THREE.Texture(timg);
        terrainTex.encoding = THREE.sRGBEncoding; terrainTex.anisotropy = MAXA; terrainTex.needsUpdate = true;
        applyTex();
      };
      timg.src = MD.TEX;
    }

    // deniz levhası (batimetri dokulu) ve gövdesi
    var seaMat = new THREE.MeshStandardMaterial({ color: 0x2b6d94, roughness: 0.22, metalness: 0.08 });
    var seaTop = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), seaMat);
    seaTop.position.z = 0.0282; seaTop.receiveShadow = true; mapG.add(seaTop); texMats.push(seaMat);
    var slab = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.0275), new THREE.MeshStandardMaterial({ color: 0x14222c, roughness: 0.7 }));
    slab.position.z = 0.01375; slab.castShadow = true; slab.receiveShadow = true; mapG.add(slab);

    for (var zi = 0; zi < 5; zi++) {
      var posA = [], norA = [], uvA = [], edgeMap = {};
      for (var t2 = 0; t2 < nT; t2++) {
        if (Zq[t2] !== zi) continue;
        var tri = [Tq[3 * t2], Tq[3 * t2 + 1], Tq[3 * t2 + 2]];
        for (var j = 0; j < 3; j++) {
          var k = tri[j], k2 = tri[(j + 1) % 3];
          posA.push(px[k], py[k], pz[k]); norA.push(nx[k], ny[k], nz[k]);
          uvA.push((px[k] + PW / 2) / PW, (py[k] + PH / 2) / PH);
          var key = k < k2 ? k * 65536 + k2 : k2 * 65536 + k;
          if (edgeMap[key]) edgeMap[key].n++; else edgeMap[key] = { a: k, b: k2, n: 1 };
        }
      }
      if (!posA.length) continue;
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posA), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(norA), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvA), 2));
      var mat = new THREE.MeshStandardMaterial({ color: ZC[zi], roughness: zi === 4 ? 0.2 : 0.88, metalness: zi === 4 ? 0.12 : 0.0, emissive: 0xffc47a, emissiveIntensity: 0 });
      texMats.push(mat); kpNeutralize(mat);
      if (zi < 4) nrmMats.push(mat);
      var mz = new THREE.Mesh(geo, mat);
      mz.castShadow = true; mz.receiveShadow = true; mz.userData.zone = KEYS[zi];

      // yan duvarlar: ayrı, vertex renkli çocuk ağ (üst ağın ölçeğiyle birlikte büyür)
      var sPos = [], sNor = [], sCol = [];
      Object.keys(edgeMap).forEach(function (kk) {
        var e = edgeMap[kk]; if (e.n !== 1) return;
        var A = e.a, B = e.b, dx = px[B] - px[A], dy = py[B] - py[A], l2 = Math.sqrt(dx * dx + dy * dy) || 1, wx = dy / l2, wy = -dx / l2;
        [[A, pz[A], 1], [A, 0, 0], [B, 0, 0], [A, pz[A], 1], [B, 0, 0], [B, pz[B], 1]].forEach(function (v) {
          sPos.push(px[v[0]], py[v[0]], v[1]); sNor.push(wx, wy, 0);
          var g = 0.16 + 0.26 * v[2];
          sCol.push(g * 1.1, g * 0.95, g * 0.8);
        });
      });
      if (sPos.length) {
        var sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sPos), 3));
        sg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(sNor), 3));
        sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sCol), 3));
        var sk = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
        sk.castShadow = true; sk.receiveShadow = true; mz.add(sk);
      }
      var eg = new THREE.Group();
      ((MD.L && MD.L[KEYS[zi]]) || []).forEach(function (arr) {
        var g2 = new THREE.BufferGeometry();
        g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
        eg.add(new THREE.LineLoop(g2, new THREE.LineBasicMaterial({ color: 0xffc47a })));
      });
      eg.visible = false; mz.add(eg); mz.userData.edges = eg;
      mapG.add(mz);
      if (zi < 4) {
        zoneMeshes.push(mz);
        zoneInfo[KEYS[zi]] = { meshes: [mz], depth: Math.max(0.05, MD.C[KEYS[zi]][2] - 0.04 + 0.02) };
      }
    }
  })();

  /* bölge etiketleri */
  var LABELS = {
    akdeniz:   { text: 'Akdeniz',        c: [150, 203] },
    karadeniz: { text: 'Karadeniz',      c: [236, 33] },
    karasal:   { text: 'Ilıman karasal', c: [300, 150] },
    sert:      { text: 'Sert karasal',   c: [424, 96] }
  };
  function labelTex(text, color) {
    return makeTex(512, 128, function (g, w, h) {
      g.fillStyle = 'rgba(5,8,10,0.62)'; g.fillRect(0, 16, w, 96);
      g.font = '600 60px "Barlow Condensed", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = color; g.fillText(text, w / 2, 66);
    });
  }
  Object.keys(LABELS).forEach(function (k) {
    if (!window.MAP_DATA || !zoneInfo[k]) return; // harita verisi yüklenmediyse etiket yok, sahne yine de açılır
    var L = LABELS[k];
    var texN = labelTex(L.text, '#d5ded8');
    var texS = labelTex(L.text, '#ffc47a');
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texN, transparent: true, depthTest: false, fog: false }));
    sp.scale.set(0.72, 0.18, 1);
    sp.renderOrder = 10;
    var cc2 = window.MAP_DATA.C[k];
    var wx = MAP_X + cc2[0];
    var wz = MAP_Z - cc2[1];
    sp.position.set(wx, DY + 0.4, wz);
    scene.add(sp);
    zoneInfo[k].sprite = sp; zoneInfo[k].texN = texN; zoneInfo[k].texS = texS; zoneInfo[k].wx = wx; zoneInfo[k].wz = wz;
  });

  /* ---------- sarkıt lamba ---------- */
  var LAMP_Y = 3.7;
  scene.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 4, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }), MAP_X, LAMP_Y + 2.1, MAP_Z));
  var shade = mesh(new THREE.CylinderGeometry(0.12, 0.44, 0.36, 40, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2d2621, roughness: 0.45, metalness: 0.7, side: THREE.DoubleSide }), MAP_X, LAMP_Y + 0.18, MAP_Z);
  scene.add(shade);
  var bulb = mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe3b4, toneMapped: false, fog: false }), MAP_X, LAMP_Y + 0.02, MAP_Z);
  scene.add(bulb);
  var spot = new THREE.SpotLight(0xffedd5, 0.55, 14, 0.62, 0.85, 1.2);
  spot.position.set(MAP_X, LAMP_Y, MAP_Z);
  spot.target.position.set(MAP_X, DY, MAP_Z);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.camera.near = 0.8; spot.shadow.camera.far = 6.5;
  spot.shadow.bias = -0.0004;
  scene.add(spot); scene.add(spot.target);
  var coneAlpha = makeTex(4, 64, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#000000');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var cones = [];
  [0.5, 0.68, 0.84, 1.0].forEach(function (f) {
    var c = mesh(new THREE.ConeGeometry(1.75 * f, 2.6, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, alphaMap: coneAlpha, transparent: true, opacity: 0.03, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      MAP_X, LAMP_Y - 1.3, MAP_Z);
    scene.add(c); cones.push(c);
  });

  /* ---------- telsiz ---------- */
  var radio = new THREE.Group();
  radio.position.set(-2.55, DY, 0.05);
  radio.rotation.y = 0.22;
  radio.scale.setScalar(0.97);
  scene.add(radio);
  var metal = new THREE.MeshStandardMaterial({ color: 0x24302a, roughness: 0.55, metalness: 0.45 });
  radio.add(mesh(new THREE.BoxGeometry(2.3, 1.15, 1.0), metal, 0, 0.575, 0));
  radio.add(mesh(new THREE.BoxGeometry(2.34, 0.05, 1.04), new THREE.MeshStandardMaterial({ color: 0x33423a, roughness: 0.5, metalness: 0.5 }), 0, 1.15, 0));
  radio.add(mesh(new THREE.BoxGeometry(1.62, 0.74, 0.04), new THREE.MeshStandardMaterial({ color: 0x060907, roughness: 0.4 }), 0, 0.62, 0.51));

  var scrC = document.createElement('canvas'); scrC.width = 640; scrC.height = 264;
  var sg = scrC.getContext('2d');
  var scrTex = new THREE.CanvasTexture(scrC); scrTex.encoding = THREE.sRGBEncoding;
  radio.add(mesh(new THREE.PlaneGeometry(1.5, 0.62), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false, fog: false }), 0, 0.62, 0.533));

  var segs = [];
  for (var bi = 0; bi < 10; bi++) {
    for (var hf = 0; hf < 2; hf++) {
      var segMat = new THREE.MeshStandardMaterial({ color: 0x2a1210, emissive: 0x000000, roughness: 0.5 });
      var seg = mesh(new THREE.BoxGeometry(0.047, 0.06, 0.03), segMat, -0.78 + bi * 0.13 + (hf ? 0.0238 : -0.0238), 1.07, 0.52);
      radio.add(seg); segs.push(segMat);
    }
  }
  var battC = document.createElement('canvas'); battC.width = 512; battC.height = 128;
  var bg2 = battC.getContext('2d');
  var battTex = new THREE.CanvasTexture(battC); battTex.encoding = THREE.sRGBEncoding;
  function drawBatt() {
    bg2.clearRect(0, 0, 512, 128);
    bg2.fillStyle = '#0a0605'; bg2.fillRect(0, 0, 512, 128);
    bg2.strokeStyle = '#3a1f1c'; bg2.lineWidth = 6; bg2.strokeRect(4, 4, 504, 120);
    var low = state.pil <= 30;
    bg2.font = '700 80px "Barlow Condensed", sans-serif';
    bg2.textAlign = 'center'; bg2.textBaseline = 'middle';
    bg2.shadowColor = low ? '#ff3a2e' : '#ff9a3a'; bg2.shadowBlur = 20;
    bg2.fillStyle = low ? '#ff5a4d' : '#ffb35a';
    bg2.fillText('PİL %' + state.pil, 256, 68);
    bg2.shadowBlur = 0;
    battTex.needsUpdate = true;
  }
  radio.add(mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshBasicMaterial({ map: battTex, toneMapped: false, fog: false }), 0.86, 1.07, 0.523));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawBatt(); });
  [-0.85, -0.57].forEach(function (x) {
    var kn = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x2f3b35, roughness: 0.3, metalness: 0.8 }), x, 0.16, 0.54);
    kn.rotation.x = Math.PI / 2; radio.add(kn);
  });
  var grilleTex = makeTex(128, 64, function (g, w, h) {
    g.fillStyle = '#0a0f0d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#26332d';
    for (var i = 0; i < 8; i++) g.fillRect(6, 6 + i * 7, w - 12, 3);
  });
  radio.add(mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.8 }), 0.6, 0.16, 0.506));
  var antenna = mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 8), metal, 0.9, 1.9, -0.1);
  antenna.rotation.z = -0.08; radio.add(antenna);
  var tip = mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff5a4d, toneMapped: false, fog: false }), 0.96, 2.65, -0.1);
  radio.add(tip);
  shadows(radio);

  var tipLight = new THREE.PointLight(0xff3b30, 0.6, 3.2, 2);
  tipLight.position.set(-1.663, DY + 2.5705, -0.248);
  scene.add(tipLight);
  var screenLight = new THREE.PointLight(0x8cffc1, 0.9, 3.6, 2);
  screenLight.position.set(-2.4, DY + 0.65, 1.4);
  scene.add(screenLight);

  /* telsiz ekranı: daktilo altyazı */
  var MSG = '';
  function wrapText(text, maxChars) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  var LINES = [], scrDone = false, IDLE = ['KS-7 HAZIR', '', 'Sinyal bekleniyor...'];
  var TOTAL = MSG.length + 2;
  var FONT = '24px ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace';
  sg.font = FONT;
  var CW = sg.measureText('M').width || 14.4;
  var typed = 0, holdT = 0, scrClock = 0;

  // boştaki ekran: ilerledikçe sinyal çubukları dolar (Deniz'in konumu netleşir)
  function idleLines() {
    var n = Math.round(state.ilerleme * 5), bars = '';
    for (var i = 0; i < 5; i++) bars += i < n ? '|' : '.';
    return state.ilerleme > 0 ? ['KS-7 HAZIR', 'Sinyal [' + bars + '] %' + Math.round(state.ilerleme * 100), 'Deniz bekleniyor...'] : IDLE;
  }
  function drawScreen(t) {
    sg.clearRect(0, 0, 640, 264);
    sg.fillStyle = '#04120b'; sg.fillRect(0, 0, 640, 264);
    sg.font = FONT; sg.textBaseline = 'alphabetic';
    sg.shadowColor = 'rgba(140,255,193,0.8)'; sg.shadowBlur = 8;
    sg.fillStyle = '#8cffc1';
    var y0 = 42, lh = 33, cl = 0, cn = 0;
    var vis = LINES.length ? LINES.slice(-6) : idleLines();
    if (!LINES.length) sg.globalAlpha = 0.6;
    for (var i = 0; i < vis.length; i++) { sg.fillText(vis[i], 28, y0 + i * lh); cl = i; cn = vis[i].length; }
    sg.globalAlpha = 1;
    sg.shadowBlur = 0;
    if (Math.floor(t * 2) % 2 === 0) {
      sg.fillStyle = '#ffc47a';
      sg.fillRect(28 + cn * CW + 2, y0 + cl * lh - 21, CW * 0.8, 25);
    }
    // parazit şeritleri (pil azaldıkça artar)
    var g = 1 - state.pil / 100;
    if (Math.random() < g * 0.18) {
      var by = Math.floor(Math.random() * 230), bh = 4 + Math.floor(Math.random() * 14), dx = (Math.random() - 0.5) * 40;
      sg.drawImage(scrC, 0, by, 640, bh, dx, by, 640, bh);
    }
    if (state.parazit > 0) { // yanlış cevapta kısa bir cızırtı patlaması
      for (var ps = 0; ps < 14; ps++) {
        var py = Math.floor(Math.random() * 250), ph = 2 + Math.floor(Math.random() * 10);
        sg.fillStyle = 'rgba(140,255,193,' + (0.08 + Math.random() * 0.25 * state.parazit) + ')';
        sg.fillRect(Math.random() * 60, py, 480 + Math.random() * 160, ph);
      }
      state.parazit = Math.max(0, state.parazit - 0.05);
    }
    sg.fillStyle = 'rgba(0,0,0,0.22)';
    for (var yy = 0; yy < 264; yy += 3) sg.fillRect(0, yy, 640, 1);
    var vg = sg.createRadialGradient(320, 132, 90, 320, 132, 360);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    sg.fillStyle = vg; sg.fillRect(0, 0, 640, 264);
    scrTex.needsUpdate = true;
  }

  /* pil göstergesi */
  function updateBattery() {
    var lit = Math.round(state.pil / 5);
    drawBatt();
    segs.forEach(function (m, i) {
      if (i < lit) { m.color.setHex(0x330a08); m.emissive.setHex(0xff3a2e); m.emissiveIntensity = 1.6; }
      else { m.color.setHex(0x2a1210); m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
    });
  }
  updateBattery();

  /* ---------- defter ---------- */
  var nb = new THREE.Group();
  nb.position.set(-0.8, DY, 1.0);
  nb.rotation.y = -0.25;
  nb.scale.setScalar(0.92);
  scene.add(nb);
  nb.add(mesh(new THREE.BoxGeometry(0.98, 0.045, 0.72), new THREE.MeshStandardMaterial({ color: 0x3b2417, roughness: 0.8 }), 0, 0.0225, 0));
  nb.add(mesh(new THREE.BoxGeometry(0.92, 0.03, 0.66), new THREE.MeshStandardMaterial({ color: 0xcfc29c, roughness: 0.9 }), 0.0, 0.06, 0));
  var defterN = 0;
  function drawPage(g, w, h) {
    g.fillStyle = '#d6c9a3'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,100,60,0.45)'; g.lineWidth = 1.5;
    for (var y = 90; y < h; y += 34) { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); }
    g.strokeStyle = 'rgba(160,60,50,0.5)'; g.beginPath(); g.moveTo(58, 0); g.lineTo(58, h); g.stroke();
    g.fillStyle = '#2b2214'; g.font = '700 34px "Barlow Condensed", sans-serif'; g.fillText('Deniz’in defteri', 74, 58);
    g.font = '600 24px "IBM Plex Mono", monospace'; g.fillText('Sayfa ' + defterN + ' / 15', 74, 118);
    g.font = 'italic 26px cursive, "Brush Script MT", serif';
    if (defterTxt) { // soru sistemi: açılan sayfanın ilk satırları (tamamı defter katmanında)
      g.font = 'italic 21px cursive, "Brush Script MT", serif';
      var tl = wrapText(defterTxt.replace(/\n/g, ' '), 34), mx = 8;
      for (var li = 0; li < Math.min(tl.length, mx); li++) g.fillText(tl[li] + (li === mx - 1 && tl.length > mx ? '…' : ''), 74, 156 + li * 26);
    } else {
      g.fillText('yazlar kurak,', 74, 186); g.fillText('kışlar ılık ve yağışlı...', 74, 220);
    }
  }
  var defterTxt = '';
  var pageTex = makeTex(512, 384, drawPage);
  var pageTop = mesh(new THREE.PlaneGeometry(0.9, 0.64), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 }), 0, 0.0755, 0);
  pageTop.rotation.x = -Math.PI / 2; nb.add(pageTop);
  var pen = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.36, 10), new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.3, metalness: 0.6 }), 0.32, 0.1, 0.18);
  pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5; nb.add(pen);
  shadows(nb);
  var pickables = zoneMeshes.slice();
  nb.traverse(function (o) { if (o.isMesh) { o.userData.nb = true; pickables.push(o); } });
  radio.traverse(function (o) { if (o.isMesh) { o.userData.rd = true; pickables.push(o); } }); // telsize tıklayınca telsiz ekranı açılır

  /* ---------- jeton kavanozu ---------- */
  var jar = new THREE.Group();
  jar.position.set(-1.95, DY, 1.12);
  jar.scale.setScalar(1.0);
  scene.add(jar);
  jar.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xcfe8e0, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }), 0, 0.21, 0));
  jar.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 32), new THREE.MeshStandardMaterial({ color: 0xcfe8e0, transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0.01, 0));
  jar.add(mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.035, 32), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4, metalness: 0.7 }), 0, 0.44, 0));
  var coinMat = new THREE.MeshStandardMaterial({ color: 0xd9a24a, roughness: 0.3, metalness: 0.95 });
  [[0, 0.03, 0, 0], [0.04, 0.045, -0.03, 0.25], [-0.03, 0.062, 0.04, -0.2]].forEach(function (c) {
    var coin = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.014, 28), coinMat, c[0], c[1], c[2]);
    coin.rotation.z = c[3]; jar.add(coin);
  });
  jar.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  var jetonTex = makeTex(512, 256, function (g, w, h) {
    g.fillStyle = '#e8dec2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a7a52'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#2b2214'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 140px "Barlow Condensed", sans-serif';
    g.fillText('3 jeton', w / 2, h / 2 + 8);
  });
  var jetonLabel = mesh(new THREE.CylinderGeometry(0.174, 0.174, 0.125, 40, 1, true, -0.7225, 1.445),
    new THREE.MeshStandardMaterial({ map: jetonTex, roughness: 0.85, side: THREE.DoubleSide }), 0, 0.22, 0);
  jar.add(jetonLabel);

  /* ---------- arkadaki yardımcılar ---------- */
  var people = [];
  function limb(parent, a, b, r1, r2, mat) {
    var dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 14), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  function blob(parent, r, sx, sy, sz, x, y, z, mat) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true;
    parent.add(m);
    return m;
  }
  function cssHex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function fabricTex(hex, rib) {
    return makeTex(128, 128, function (g, w, h) {
      g.fillStyle = cssHex(hex); g.fillRect(0, 0, w, h);
      for (var x = 0; x < w; x += rib) {
        g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x, 0, 1.5, h);
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 2, 0, 1, h);
      }
      for (var i = 0; i < 900; i++) {
        g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + Math.random() * 0.07 + ')';
        g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
      }
    }, [5, 3]);
  }
  function hairTexture(hex, light) {
    return makeTex(256, 256, function (g, w, h) {
      g.fillStyle = cssHex(hex); g.fillRect(0, 0, w, h);
      for (var i = 0; i < 1600; i++) {
        var x = Math.random() * w;
        g.strokeStyle = Math.random() < 0.5 ? 'rgba(0,0,0,' + (0.1 + Math.random() * 0.25) + ')' : 'rgba(' + light + ',' + (0.05 + Math.random() * 0.16) + ')';
        g.lineWidth = 0.6 + Math.random() * 1.4;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random() - 0.5) * 8, h); g.stroke();
      }
      var sh = g.createLinearGradient(0, 0, 0, h);
      sh.addColorStop(0.25, 'rgba(255,255,255,0)'); sh.addColorStop(0.4, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)');
      g.fillStyle = sh; g.fillRect(0, 0, w, h);
    });
  }
  function faceTexture(o) {
    return makeTex(1024, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, o.skinHi); gr.addColorStop(0.5, o.skinCss); gr.addColorStop(1, o.skinLo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) {
        g.fillStyle = Math.random() < 0.5 ? 'rgba(90,50,30,' + Math.random() * 0.07 + ')' : 'rgba(255,230,210,' + Math.random() * 0.07 + ')';
        g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
      }
      var cx = 512;
      function blobAt(x, y, rx, ry, r, gg, b, a) {
        var R = Math.max(rx, ry);
        var rg = g.createRadialGradient(x, y, 0, x, y, R);
        rg.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')');
        rg.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
        g.save(); g.translate(x, y); g.scale(rx / R, ry / R); g.translate(-x, -y);
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      [-1, 1].forEach(function (sx) {
        blobAt(cx + sx * 74, 306, 56, 44, 205, 92, 82, 0.16);
        blobAt(cx + sx * 57, 240, 34, 16, 110, 62, 62, 0.16);
        blobAt(cx + sx * 57, 214, 36, 18, 90, 50, 40, 0.20);
      });
      blobAt(cx, 262, 22, 34, 255, 235, 220, 0.14);
      blobAt(cx, 405, 90, 40, 70, 40, 30, 0.14);
      blobAt(cx, 347, 44, 18, 80, 35, 30, 0.12);
      [-1, 1].forEach(function (sx) {
        var ex = cx + sx * 57, ey = 228;
        g.fillStyle = '#efe9e0'; g.beginPath(); g.ellipse(ex, ey, 25, 10.5, 0, 0, Math.PI * 2); g.fill();
        g.save(); g.beginPath(); g.ellipse(ex, ey, 25, 10.5, 0, 0, Math.PI * 2); g.clip();
        var ir = g.createRadialGradient(ex, ey, 1, ex, ey, 11);
        ir.addColorStop(0, o.iris[0]); ir.addColorStop(1, o.iris[1]);
        g.fillStyle = ir; g.beginPath(); g.arc(ex, ey, 10.8, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#050403'; g.beginPath(); g.arc(ex, ey, 4.8, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex - 3.5, ey - 3.5, 2.2, 0, Math.PI * 2); g.fill();
        var lg = g.createLinearGradient(0, ey - 11, 0, ey + 3);
        lg.addColorStop(0, 'rgba(40,20,15,0.55)'); lg.addColorStop(1, 'rgba(40,20,15,0)');
        g.fillStyle = lg; g.fillRect(ex - 26, ey - 11, 52, 14);
        g.restore();
        g.strokeStyle = o.lid; g.lineWidth = 3.4; g.lineCap = 'round';
        g.beginPath(); g.ellipse(ex, ey + 1, 25.5, 11, 0, Math.PI * 1.03, Math.PI * 1.97); g.stroke();
        g.strokeStyle = 'rgba(90,50,40,0.45)'; g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(ex, ey - 1, 25, 10.5, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
        if (o.lashes) {
          g.strokeStyle = '#1a100c'; g.lineWidth = 1.6;
          for (var l = 0; l < 9; l++) {
            var an = Math.PI * (1.08 + l * 0.098);
            var x0 = ex + Math.cos(an) * 25.5, y0 = ey + 1 + Math.sin(an) * 11;
            g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(an) * 7 + sx * 3, y0 + Math.sin(an) * 7 - 2); g.stroke();
          }
        }
        g.strokeStyle = o.brow; g.lineCap = 'round';
        for (var bb = 0; bb < 70; bb++) {
          var tt = Math.random();
          var bx = cx + sx * (29 + tt * 58);
          var by = 192 - Math.sin(tt * Math.PI) * 9 + (tt > 0.7 ? (tt - 0.7) * 22 : 0) + (Math.random() - 0.5) * 6;
          g.lineWidth = (1.2 + Math.random() * 1.2) * o.browW; g.globalAlpha = 0.55 + Math.random() * 0.4;
          g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + sx * (6 + Math.random() * 5), by - 3 - Math.random() * 3); g.stroke();
        }
        g.globalAlpha = 1;
      });
      g.fillStyle = 'rgba(70,30,20,0.55)';
      [-1, 1].forEach(function (sx) { g.beginPath(); g.ellipse(cx + sx * 11, 284, 6, 3.4, sx * 0.3, 0, Math.PI * 2); g.fill(); });
      [-1, 1].forEach(function (sx) { blobAt(cx + sx * 20, 262, 10, 30, 110, 62, 50, 0.16); });
      blobAt(cx, 276, 14, 9, 255, 235, 215, 0.18);
      g.fillStyle = o.lipU; g.beginPath(); g.moveTo(cx - 40, 337); g.quadraticCurveTo(cx - 18, 322, cx, 328); g.quadraticCurveTo(cx + 18, 322, cx + 40, 337); g.quadraticCurveTo(cx, 341, cx - 40, 337); g.fill();
      g.fillStyle = o.lipL; g.beginPath(); g.moveTo(cx - 38, 338); g.quadraticCurveTo(cx, 372, cx + 38, 338); g.quadraticCurveTo(cx, 343, cx - 38, 338); g.fill();
      g.strokeStyle = 'rgba(50,18,16,0.9)'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 40, 337); g.quadraticCurveTo(cx, 343, cx + 40, 337); g.stroke();
      blobAt(cx, 360, 26, 8, 255, 235, 225, 0.18);
      if (o.stubble) {
        for (var q = 0; q < 4200; q++) {
          var sx2 = cx + (Math.random() - 0.5) * 230, sy2 = 300 + Math.random() * 130;
          if (sy2 > 322 && sy2 < 378 && Math.abs(sx2 - cx) < 50) continue;
          if (sy2 < 330 && Math.abs(sx2 - cx) < 40) continue;
          g.fillStyle = 'rgba(30,20,14,' + (0.12 + Math.random() * 0.2) + ')';
          g.fillRect(sx2, sy2, 1.4, 1.4);
        }
      }
    });
  }
  function buildPerson(o) {
    var P = new THREE.Group();
    P.position.set(o.x, 0, o.z); P.rotation.y = o.ry || 0; P.scale.setScalar(1.7);
    var skin = new THREE.MeshStandardMaterial({ color: o.skin, roughness: 0.6, emissive: o.skin, emissiveIntensity: 0.06 });
    var hairM = new THREE.MeshStandardMaterial({ map: hairTexture(o.hair, o.hairLight), roughness: 0.62 });
    var shirt = new THREE.MeshStandardMaterial({ map: fabricTex(o.shirt, 5), roughness: 0.95 });
    var pants = new THREE.MeshStandardMaterial({ color: o.pants, roughness: 0.9 });
    var dk = new THREE.MeshStandardMaterial({ color: 0x14181a, roughness: 0.8 });
    var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

    P.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.46), dk, 0, 0.44, 0.02));
    P.add(mesh(new THREE.BoxGeometry(0.46, 0.56, 0.06), dk, 0, 0.76, -0.24));
    P.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10), dk, 0, 0.22, 0));
    P.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), dk, 0, 0.02, 0));

    [-0.1, 0.1].forEach(function (sx) {
      limb(P, V(sx, 0.52, 0.0), V(sx, 0.52, 0.42), 0.078, 0.066, pants);
      limb(P, V(sx, 0.5, 0.42), V(sx, 0.07, 0.46), 0.062, 0.05, pants);
      P.add(mesh(new THREE.BoxGeometry(0.09, 0.05, 0.2), dk, sx, 0.03, 0.54));
    });

    var sw = o.female ? 0.2 : 0.235;
    blob(P, 0.17, 1.0, 0.45, 0.9, 0, 0.54, 0, pants);
    var waist = mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.3, 28), shirt, 0, 0.7, 0); waist.scale.z = 0.7; P.add(waist);
    var chest = mesh(new THREE.CylinderGeometry(sw - 0.015, 0.17, 0.36, 28), shirt, 0, 0.98, 0); chest.scale.z = 0.62; P.add(chest);
    P.add(mesh(new THREE.CylinderGeometry(0.047, 0.056, 0.13, 16), skin, 0, 1.21, 0));
    var collar = mesh(new THREE.TorusGeometry(0.062, 0.02, 10, 28), shirt, 0, 1.175, 0); collar.rotation.x = Math.PI / 2; P.add(collar);
    if (!o.female) {
      var shirtCol = mesh(new THREE.TorusGeometry(0.056, 0.008, 8, 28), new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.8 }), 0, 1.2, 0);
      shirtCol.rotation.x = Math.PI / 2; P.add(shirtCol);
    }
    [-1, 1].forEach(function (sx) {
      blob(P, 0.07, 1, 1, 1, sx * sw, 1.11, 0, shirt);
      limb(P, V(sx * 0.05, 1.18, 0), V(sx * sw, 1.12, 0), 0.05, 0.07, shirt);
    });

    var hands = [];
    [-1, 1].forEach(function (sx) {
      var S = V(sx * sw, 1.1, 0), E = V(sx * (sw + 0.03), 0.86, 0.1), Hd = V(sx * 0.12, 0.78, 0.46);
      var mid = E.clone().lerp(Hd, 0.62);
      limb(P, S, E, 0.046, 0.04, shirt);
      limb(P, E, mid, 0.04, 0.034, shirt);
      limb(P, mid, Hd, 0.03, 0.026, skin);
      var hd = blob(P, 0.04, 1, 0.45, 1.25, Hd.x, Hd.y, Hd.z + 0.01, skin);
      hd.userData.y0 = hd.position.y; hands.push(hd);
    });

    var H = new THREE.Group(); H.position.set(0, 1.34, 0); P.add(H);
    var hg = new THREE.SphereGeometry(1, 48, 36);
    var pos = hg.attributes.position;
    for (var vi = 0; vi < pos.count; vi++) {
      var vx = pos.getX(vi), vy = pos.getY(vi), vz = pos.getZ(vi);
      if (vy < 0.1) {
        var kk = (0.1 - vy) / 1.1;
        var fx = 1 - 0.3 * Math.pow(kk, 1.15), fz = 1 - 0.16 * Math.pow(kk, 1.15);
        pos.setXYZ(vi, vx * fx, vy, vz * fz + (vz > 0 ? 0.05 * kk : 0));
      }
    }
    var headMesh = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ map: faceTexture(o), roughness: 0.55, emissive: o.skin, emissiveIntensity: 0.05 }));
    headMesh.scale.set(0.093, 0.118, 0.102);
    headMesh.rotation.y = -Math.PI / 2;
    H.add(headMesh);
    var nose = mesh(new THREE.ConeGeometry(0.013, 0.035, 12), skin, 0, -0.01, 0.103); nose.rotation.x = Math.PI / 2; H.add(nose);
    [-1, 1].forEach(function (sx) {
      blob(H, 0.02, 0.5, 1, 0.7, sx * 0.093, -0.004, 0, skin);
      if (o.glasses) {
        H.add(mesh(new THREE.TorusGeometry(0.03, 0.0035, 8, 24), dk, sx * 0.037, 0.021, 0.103));
        H.add(mesh(new THREE.BoxGeometry(0.003, 0.003, 0.1), dk, sx * 0.068, 0.021, 0.05));
      }
    });
    if (o.glasses) H.add(mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), dk, 0, 0.026, 0.105));

    var cap = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.34), hairM);
    cap.scale.set(0.1, 0.126, 0.108); cap.position.set(0, 0.008, -0.006); H.add(cap);
    var back = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), hairM);
    back.scale.set(0.098, 0.115, 0.082); back.position.set(0, -0.01, -0.032); H.add(back);
    if (o.female) {
      var long = mesh(new THREE.CylinderGeometry(0.1, 0.072, 0.36, 28, 1, true), hairM, 0, -0.14, -0.045);
      long.material = hairM.clone(); long.material.side = THREE.DoubleSide; H.add(long);
      [-1, 1].forEach(function (sx) { blob(H, 0.07, 0.36, 1.25, 0.6, sx * 0.1, -0.06, 0.0, hairM); });
    } else {
      [-1, 1].forEach(function (sx) { blob(H, 0.02, 0.6, 1.5, 1, sx * 0.087, 0.0, 0.03, hairM); });
    }
    P.traverse(function (m) { if (m.isMesh) m.castShadow = true; });

    P.userData = { head: H, chest: chest, hands: hands, t0: Math.random() * 10 };
    scene.add(P);
    people.push(P);

    var fl = new THREE.PointLight(o.light, 1.0, 2.8, 2);
    fl.position.set(o.x, 1.6, o.z + 0.9);
    scene.add(fl);
    P.userData.fl = fl;
    return P;
  }
  function backDesk(x, z) {
    scene.add(mesh(new THREE.BoxGeometry(2.3, 0.08, 1.0), deskMat, x, 1.235, z));
    var pn = mesh(new THREE.BoxGeometry(2.3, 1.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x0f0b09, roughness: 0.8 }), x, 0.6, z + 0.47);
    pn.castShadow = true; scene.add(pn);
  }
  // masanın ön yüzünde, ana masanın üstünde kalan şeritte pirinç isimlik (bilgisayarı kapatmaz)
  function deskPlate(x, name, role) {
    var tex = makeTex(1536, 192, function (g, w, h) {
      function rr(px, py, pw, ph, r) { g.beginPath(); g.moveTo(px + r, py); g.arcTo(px + pw, py, px + pw, py + ph, r); g.arcTo(px + pw, py + ph, px, py + ph, r); g.arcTo(px, py + ph, px, py, r); g.arcTo(px, py, px + pw, py, r); g.closePath(); }
      function spaced(t, sx, sy, sp) { for (var i = 0; i < t.length; i++) { g.fillText(t[i], sx, sy); sx += g.measureText(t[i]).width + sp; } return sx; }
      function spanW(t, sp) { var s = 0; for (var i = 0; i < t.length; i++) s += g.measureText(t[i]).width + sp; return s - sp; }
      var br = g.createLinearGradient(0, 0, 0, h); br.addColorStop(0, '#d9b872'); br.addColorStop(0.5, '#a98443'); br.addColorStop(1, '#6f5428');
      rr(4, 4, w - 8, h - 8, 26); g.fillStyle = br; g.fill();                      // pirinç çerçeve
      var bd = g.createLinearGradient(0, 0, 0, h); bd.addColorStop(0, '#241c15'); bd.addColorStop(1, '#14100c');
      rr(22, 22, w - 44, h - 44, 14); g.fillStyle = bd; g.fill();                  // koyu ceviz zemin
      g.strokeStyle = 'rgba(217,184,114,0.45)'; g.lineWidth = 2; rr(32, 32, w - 64, h - 64, 10); g.stroke();
      g.fillStyle = '#c9a45c'; [60, w - 60].forEach(function (sx) { g.beginPath(); g.arc(sx, h / 2, 9, 0, 6.283); g.fill(); });   // vidalar
      g.textBaseline = 'middle'; g.textAlign = 'left';
      var n = name.toUpperCase(), r = role.toUpperCase();
      g.font = '700 96px "Barlow Condensed", sans-serif'; var wn = spanW(n, 10);
      g.font = '600 78px "Barlow Condensed", sans-serif'; var wr = spanW(r, 8), gap = 56, sx = (w - (wn + gap + wr)) / 2;
      g.font = '700 96px "Barlow Condensed", sans-serif'; g.fillStyle = '#ecd08e'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
      spaced(n, sx, 100, 10);
      g.shadowBlur = 0; g.shadowOffsetY = 0; g.fillStyle = 'rgba(217,184,114,0.55)'; g.fillRect(sx + wn + gap / 2 - 1, 54, 2, 86);    // ayırıcı çizgi
      g.font = '600 78px "Barlow Condensed", sans-serif'; g.fillStyle = '#cdbf9f';
      spaced(r, sx + wn + gap, 104, 8);
    });
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.16), new THREE.MeshBasicMaterial({ map: tex, color: 0xb8b8b8, toneMapped: false, fog: false }));
    pl.position.set(x, 1.145, -1.895); scene.add(pl);
  }
  function laptop(x, z, glow) {
    var g = new THREE.Group(); g.position.set(x, 1.275, z); g.scale.setScalar(1.25);
    var alu = new THREE.MeshStandardMaterial({ color: 0x2a2f31, roughness: 0.35, metalness: 0.8 });
    g.add(mesh(new THREE.BoxGeometry(0.46, 0.02, 0.32), alu, 0, 0.01, 0));
    var lid = new THREE.Group(); lid.position.set(0, 0.02, 0.16); lid.rotation.x = 0.28; g.add(lid);
    lid.add(mesh(new THREE.BoxGeometry(0.46, 0.3, 0.012), alu, 0, 0.15, 0));
    var scr = mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ color: glow, toneMapped: false, fog: false }), 0, 0.15, -0.0066);
    scr.rotation.y = Math.PI; lid.add(scr);
    var logo = mesh(new THREE.CircleGeometry(0.022, 24), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.55, toneMapped: false }), 0, 0.15, 0.0068);
    lid.add(logo);
    g.traverse(function (m) { if (m.isMesh) m.castShadow = true; });
    scene.add(g);
  }
  // Nuran (gözlüklü)
  backDesk(0.2, -2.4);
  deskPlate(0.2, 'Nuran', 'Meteorolog');
  var nuriProc = buildPerson({ x: 0.2, z: -3.02, ry: -0.06, skin: 0xd2a384, skinCss: '#d2a384', skinHi: '#dcb394', skinLo: '#b98a6c',
    iris: ['#6a4426', '#2a1a0c'], lid: '#2a1a14', brow: '#241810', browW: 1.2, lashes: false, stubble: true, lipU: '#a9615a', lipL: '#b86c64',
    hair: 0x2a1d14, hairLight: '120,90,60', shirt: 0x2f4a5c, pants: 0x1a1d22, female: false, glasses: true, light: 0x7fc8ff });
  laptop(0.2, -2.3, 0x9fd8ff);
  // Fatma (uzun saçlı)
  backDesk(3.7, -2.4);
  deskPlate(3.7, 'Fatma', 'Haritacı');
  var ayseProc = buildPerson({ x: 3.7, z: -3.02, ry: 0.08, skin: 0xe0b494, skinCss: '#e0b494', skinHi: '#e8c2a4', skinLo: '#c99d80',
    iris: ['#4a7a58', '#1a3a2a'], lid: '#1c100c', brow: '#1a110c', browW: 0.85, lashes: true, stubble: false, lipU: '#b04a4a', lipL: '#c25a58',
    hair: 0x1d130e, hairLight: '90,70,60', shirt: 0x6a3b2e, pants: 0x1a1d22, female: true, glasses: false, light: 0xffcf8a });
  laptop(3.7, -2.3, 0xffd9a0);
  var ayseLamp = new THREE.PointLight(0xffb55a, 0.6, 4, 2); ayseLamp.position.set(4.5, 1.95, -2.3); scene.add(ayseLamp);
  scene.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), 4.5, 1.75, -2.3));
  // duvardaki harita: masadaki kabartma haritayla aynı arazi dokusu
  var wallMat = new THREE.MeshStandardMaterial({ color: 0x1b2a30, roughness: 0.85, emissive: 0x000000 });
  if (window.MAP_DATA && window.MAP_DATA.TEX) {
    var wallImg = new Image();
    wallImg.onload = function () {
      var wt = new THREE.Texture(wallImg);
      wt.encoding = THREE.sRGBEncoding; wt.anisotropy = MAXA; wt.needsUpdate = true;
      wallMat.map = wt; wallMat.emissiveMap = wt; wallMat.emissive.setHex(0xffffff); wallMat.emissiveIntensity = 0.28;
      wallMat.color.setHex(0xffffff); wallMat.needsUpdate = true;
    };
    wallImg.src = window.MAP_DATA.TEX;
  }
  scene.add(mesh(new THREE.PlaneGeometry(2.2, 1.115), wallMat, 3.7, 3.1, -3.96));
  scene.add(mesh(new THREE.BoxGeometry(2.32, 1.235, 0.04), new THREE.MeshStandardMaterial({ color: 0x1d1612, roughness: 0.6 }), 3.7, 3.1, -3.985));

  /* ---------- Fatma: gerçek 3D avatar (Avaturn modeli, rig'li) ---------- */
  var avatars = [];
  function b64ToBuf(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function buildChair(P) {
    var dk = new THREE.MeshStandardMaterial({ color: 0x14181a, roughness: 0.8 });
    P.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.46), dk, 0, 0.44, 0.02));
    P.add(mesh(new THREE.BoxGeometry(0.46, 0.56, 0.06), dk, 0, 0.76, -0.24));
    P.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10), dk, 0, 0.22, 0));
    P.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), dk, 0, 0.02, 0));
  }
  function avTex(imgs, i, srgb) {
    if (!imgs[i]) return null;
    var t = new THREE.Texture(imgs[i]);
    t.flipY = false;
    t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = MAXA;
    t.needsUpdate = true;
    return t;
  }
  function avMaterial(name, imgs, opt) {
    var m = new THREE.MeshStandardMaterial({ skinning: true, side: THREE.DoubleSide });
    m.normalScale = new THREE.Vector2(1, -1);
    m.envMapIntensity = 0.7;
    if (name.indexOf('body') >= 0) {
      m.map = avTex(imgs, 1, true); m.normalMap = avTex(imgs, 2, false);
      var orm = avTex(imgs, 0, false); m.roughnessMap = orm; m.metalnessMap = orm; m.roughness = 1; m.metalness = 1;
    } else if (name.indexOf('hair') >= 0) {
      m.map = avTex(imgs, opt.hair, true); m.normalMap = avTex(imgs, 4, false);
      m.roughness = 0.7; m.metalness = 0.05;
      if (name.indexOf('hair_1') >= 0) { m.transparent = true; m.depthWrite = false; } else { m.alphaTest = 0.5; }
    } else if (name.indexOf('shoes') >= 0) {
      m.map = avTex(imgs, 6, true); m.normalMap = avTex(imgs, 7, false);
      var o2 = avTex(imgs, 5, false); m.roughnessMap = o2; m.metalnessMap = o2; m.roughness = 1; m.metalness = 1;
    } else {
      m.map = avTex(imgs, opt.cloth, true); m.normalMap = avTex(imgs, 11, false);
      var o3 = avTex(imgs, 9, false); m.roughnessMap = o3; m.metalnessMap = o3; m.roughness = 1; m.metalness = 1;
      if (opt.matte) { m.roughnessMap = null; m.metalnessMap = null; m.roughness = 0.95; m.metalness = 0; }
    }
    if (!m.normalMap) m.normalScale.set(0, 0);
    m.needsUpdate = true;
    return m;
  }
  function installAvatar(gltf, imgs, opt) {
    var root = gltf.scene;
    var bone = function (n) { return root.getObjectByName(n); };
    if (!bone('Hips')) return;
    root.traverse(function (o) {
      if (o.isMesh) { o.material = avMaterial(o.name || '', imgs, opt); o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; }
    });

    // oturma pozu: T-pose iskeletini dünya eksenlerinde döndür
    var AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
    var pq = new THREE.Quaternion(), rw = new THREE.Quaternion(), dl = new THREE.Quaternion();
    function op(name, axis, ang) {
      var b = bone(name); if (!b) return;
      root.updateMatrixWorld(true);
      b.parent.getWorldQuaternion(pq);
      rw.setFromAxisAngle(axis.clone().normalize(), ang);
      dl.copy(pq).invert().multiply(rw).multiply(pq);
      b.quaternion.premultiply(dl);
    }
    var wp = new THREE.Vector3(), wp2 = new THREE.Vector3();
    [['Left', 1], ['Right', -1]].forEach(function (sd) {
      var s = sd[0], sg = sd[1];
      op(s + 'UpLeg', AX, -Math.PI / 2); op(s + 'UpLeg', AY, sg * 0.05); op(s + 'Leg', AX, Math.PI / 2);
    });
    op('Spine', AX, 0.08); op('Neck', AX, 0.10);
    [['Left', 1], ['Right', -1]].forEach(function (sd) {
      var s = sd[0], sg = sd[1];
      op(s + 'Arm', AZ, -sg * Math.PI / 2); op(s + 'Arm', AZ, sg * -0.02); op(s + 'Arm', AX, -0.52);
      op(s + 'ForeArm', AX, -0.95); op(s + 'ForeArm', AY, -sg * 0.18);
      root.updateMatrixWorld(true);
      bone(s + 'Hand').getWorldPosition(wp); bone(s + 'ForeArm').getWorldPosition(wp2);
      op(s + 'ForeArm', wp.clone().sub(wp2), sg * 0.80);
    });

    // zemine ve sandalyeye oturt
    root.updateMatrixWorld(true);
    var tl = new THREE.Vector3(), tr = new THREE.Vector3(), hp = new THREE.Vector3();
    bone('LeftToeBase').getWorldPosition(tl); bone('RightToeBase').getWorldPosition(tr); bone('Hips').getWorldPosition(hp);
    root.position.set(-hp.x, -(Math.min(tl.y, tr.y) - 0.02), -hp.z);

    var G = new THREE.Group();
    G.position.set(opt.x, 0, opt.z); G.rotation.y = opt.ry; G.scale.setScalar(1.7);
    buildChair(G);
    G.add(root);
    G.traverse(function (o) { if (o.isMesh && !o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(G);

    // ilkel karakteri kaldır
    var pr = opt.proc;
    if (pr) {
      scene.remove(pr);
      if (pr.userData.fl) scene.remove(pr.userData.fl);
      var ix = people.indexOf(pr); if (ix >= 0) people.splice(ix, 1);
    }
    // yüzlerine yalnızca dizüstü ekranından gelen zayıf, mavi bir ışık vurur
    var fl2 = new THREE.PointLight(0x6fa8ff, 0.8, 2.4, 2);
    fl2.position.set(opt.x, 1.7, opt.z + 0.75); scene.add(fl2);

    // canlandırma için kemikler
    var neck = bone('Neck'), nq = new THREE.Quaternion(), vx = new THREE.Vector3(1, 0, 0);
    root.updateMatrixWorld(true);
    neck.getWorldQuaternion(nq); vx.applyQuaternion(nq);
    var av = {
      t0: Math.random() * 10,
      spine2: bone('Spine2'), neck: neck, head: bone('Head'),
      hands: [bone('LeftHand'), bone('RightHand')],
      nodSign: vx.x >= 0 ? 1 : -1
    };
    av.spine2Base = av.spine2.quaternion.clone();
    av.neckBase = av.neck.quaternion.clone();
    av.headBase = av.head.quaternion.clone();
    av.handBase = av.hands.map(function (h) { return h.quaternion.clone(); });
    avatars.push(av);
    window.ODA_AVATAR_N = avatars.length; // React tarafı karakterler yerleşene kadar geçiş karartmasını tutar

    var cr = document.getElementById('credit');
    // model atfı ekranda gösterilmiyor (sunumda ve proje açıklamasında yer alır)
    // cr.hidden = false;
  }
  var _qa = new THREE.Quaternion(), _ax = new THREE.Vector3(1, 0, 0), _ay = new THREE.Vector3(0, 1, 0);
  function updateAvatar(t) {
    avatars.forEach(function (av) {
      var s = t + av.t0;
      av.spine2.quaternion.copy(av.spine2Base).multiply(_qa.setFromAxisAngle(_ax, Math.sin(s * 1.6) * 0.012));
      var up = Math.max(0, Math.sin(s * 0.37) - 0.72) / 0.28;
      av.neck.quaternion.copy(av.neckBase).multiply(_qa.setFromAxisAngle(_ax, -up * 0.25 * av.nodSign));
      av.head.quaternion.copy(av.headBase).multiply(_qa.setFromAxisAngle(_ay, Math.sin(s * 0.5) * 0.08));
      var typing = Math.sin(s * 1.1) > 0 ? 1 : 0;
      av.hands.forEach(function (h, i) {
        h.quaternion.copy(av.handBase[i]).multiply(_qa.setFromAxisAngle(_ax, Math.sin(s * 14 + i * 2) * 0.03 * typing));
      });
    });
  }
  if (window.AVATAR_DATA && THREE.GLTFLoader) {
    (function () {
      var D = window.AVATAR_DATA, keys = Object.keys(D.imgs), left = keys.length, imgs = {};
      function go() {
        var opts = [
          { x: 3.7, z: -3.02, ry: 0.08, hair: 3, cloth: 10, light: 0xffcf8a, proc: ayseProc },
          { x: 0.2, z: -3.02, ry: -0.06, hair: 14, cloth: 13, light: 0x7fc8ff, proc: nuriProc, matte: true }
        ];
        opts.forEach(function (opt) {
          try { new THREE.GLTFLoader().parse(b64ToBuf(D.glb), '', function (g) { installAvatar(g, imgs, opt); }, function (e) { console.warn('avatar', e); }); }
          catch (err) { console.warn('avatar', err); }
        });
      }
      keys.forEach(function (k) {
        var im = new Image();
        im.onload = function () { imgs[k] = im; if (--left === 0) go(); };
        im.onerror = function () { if (--left === 0) go(); };
        im.src = D.imgs[k];
      });
    })();
  }

  /* ---------- ışıklar ---------- */
  scene.add(new THREE.AmbientLight(0x0d1417, 0.12));
  var hemi = new THREE.HemisphereLight(0x3a5560, 0x120c08, 0.14);
  scene.add(hemi);
  var moon = new THREE.PointLight(0x6fa4bd, 0.4, 9, 2);
  moon.position.set(-3.0, 2.6, -3.0);
  scene.add(moon);
  // pencereden sızan soğuk yağmur ışığı (gölgesiz, çok hafif): tungsten lambayla teal/turuncu kontrast
  var winLight = new THREE.DirectionalLight(0x6f9fd8, 0.22);
  winLight.position.set(-3.0, 3.2, -3.9); winLight.target.position.set(1.5, 1.0, 0.5);
  scene.add(winLight); scene.add(winLight.target);

  /* ---------- gerçekçilik: ortam yansıması, parıltı, toz, temas gölgesi, gren ---------- */
  try {
    var pm = new THREE.PMREMGenerator(renderer);
    var envS = new THREE.Scene();
    envS.add(new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), new THREE.MeshBasicMaterial({ color: 0x0a1012, side: THREE.BackSide })));
    var envPanel = function (col, k, w, h, x, y, z, rx, ry) {
      var em = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      em.position.set(x, y, z); em.rotation.set(rx || 0, ry || 0, 0); envS.add(em);
    };
    envPanel(0xffd29a, 5, 3, 3, 1.85, 5.5, 0.2, Math.PI / 2, 0);
    envPanel(0x6fa4bd, 1.6, 5, 3, -3.0, 3, -5.5, 0, 0);
    envPanel(0x8cffc1, 0.7, 2, 1.2, -2.5, 1.7, 3.5, 0, Math.PI);
    envPanel(0xff5a4d, 0.4, 1, 0.6, 5, 2, -4, 0, 0);
    scene.environment = pm.fromScene(envS, 0.03).texture;
    pm.dispose();
  } catch (envErr) { console.warn('env', envErr); }

  var blobTex = makeTex(128, 128, function (g, w, h) {
    var rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.55, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  function contact(x, z, w, d, op, y) {
    var cm = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, color: 0x000000, transparent: true, opacity: op, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    cm.rotation.x = -Math.PI / 2; cm.position.set(x, y || (DY + 0.004), z); cm.renderOrder = 1; scene.add(cm);
  }
  contact(-2.55, 0.1, 2.95, 1.6, 0.55);
  contact(1.85, 0.2, 5.0, 2.7, 0.35);
  contact(-0.8, 1.0, 1.3, 0.95, 0.45);
  contact(-1.95, 1.12, 0.7, 0.7, 0.5);
  contact(0.2, -2.3, 1.0, 0.75, 0.5, 1.279);
  contact(3.7, -2.3, 1.0, 0.75, 0.5, 1.279);

  var glowTex = makeTex(128, 128, function (g, w, h) {
    var rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  function glowSprite(x, y, z, color, sx, sy, op) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.scale.set(sx, sy, 1); sp.position.set(x, y, z); sp.renderOrder = 5; scene.add(sp); return sp;
  }
  var glowBulb = glowSprite(MAP_X, LAMP_Y + 0.02, MAP_Z, 0xffd29a, 1.5, 1.5, 0.55);
  var glowScr = glowSprite(-2.437, 1.661, 1.0, 0x8cffc1, 2.2, 1.45, 0.14);
  glowScr.visible = false;
  var glowAnt = glowSprite(-1.663, 3.6305, -0.248, 0xff3b30, 0.5, 0.5, 0.7);

  var moteN = 140, motePos = new Float32Array(moteN * 3), moteVel = [];
  function resetMote(i, init) {
    var y = init ? DY + 0.15 + Math.random() * (LAMP_Y - DY - 0.4) : DY + 0.1;
    var rad = 0.25 + (LAMP_Y - y) * 0.6;
    var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * rad;
    motePos[i * 3] = MAP_X + Math.cos(a) * r; motePos[i * 3 + 1] = y; motePos[i * 3 + 2] = MAP_Z + Math.sin(a) * r;
    moteVel[i] = [(Math.random() - 0.5) * 0.03, 0.01 + Math.random() * 0.03, (Math.random() - 0.5) * 0.03];
  }
  for (var mi = 0; mi < moteN; mi++) resetMote(mi, true);
  var moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xffe6bf, size: 0.05, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, sizeAttenuation: true }));
  motes.frustumCulled = false; scene.add(motes);

  var gC = document.createElement('canvas'); gC.width = gC.height = 256;
  var gx = gC.getContext('2d'), gi = gx.createImageData(256, 256);
  for (var gk = 0; gk < gi.data.length; gk += 4) { var gv = Math.floor(Math.random() * 255); gi.data[gk] = gi.data[gk + 1] = gi.data[gk + 2] = gv; gi.data[gk + 3] = 255; }
  gx.putImageData(gi, 0, 0);
  document.getElementById('grain').style.backgroundImage = 'url(' + gC.toDataURL('image/png') + ')';

  /* ---------- ek ayrıntılar: telsiz, fincan, kâğıtlar, saat, perde, süpürgelik, kenar ışığı ---------- */
  var screwMat = new THREE.MeshStandardMaterial({ color: 0x8a948f, roughness: 0.35, metalness: 0.9 });
  [[-1.1, 1.1], [1.1, 1.1], [-1.08, 0.06], [1.08, 0.06]].forEach(function (pp) {
    var sc = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12), screwMat, pp[0], pp[1], 0.505);
    sc.rotation.x = Math.PI / 2; radio.add(sc);
  });
  var handleMat = new THREE.MeshStandardMaterial({ color: 0x2a3630, roughness: 0.4, metalness: 0.7 });
  var radioHandle = mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 28, Math.PI), handleMat, 0, 1.175, 0);
  radioHandle.rotation.y = Math.PI / 2; radio.add(radioHandle);
  var brandTex = makeTex(256, 64, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#6a7470'); gr.addColorStop(0.5, '#9aa49f'); gr.addColorStop(1, '#6a7470');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a201d'; g.font = '700 34px "Barlow Condensed", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KS-7 TELSİZ', w / 2, 34);
  });
  radio.add(mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshStandardMaterial({ map: brandTex, roughness: 0.4, metalness: 0.8 }), -0.08, 0.17, 0.507));
  [[-1.03, 0.22, 0x33ff77], [-1.03, 0.1, 0xffaa33]].forEach(function (L) {
    var led = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14), new THREE.MeshStandardMaterial({ color: 0x112211, emissive: L[2], emissiveIntensity: 1.8 }), L[0], L[1], 0.508);
    led.rotation.x = Math.PI / 2; radio.add(led);
  });

  // kupa (büyük, düz duvarlı, parlak seramik, D şeklinde kulp, kremalı kahve) + gerçekçi buhar
  var mug = new THREE.Group(); mug.position.set(3.0, DY, 1.55); scene.add(mug);
  var ceramic = new THREE.MeshPhysicalMaterial({ color: 0xeeeae0, roughness: 0.22, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.07, side: THREE.DoubleSide });
  function lathe(pts, mat, y) {
    var m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 56), mat);
    m.position.y = y; mug.add(m); return m;
  }
  lathe([[0, 0], [0.075, 0], [0.088, 0.006], [0.095, 0.02], [0.0965, 0.05], [0.097, 0.19], [0.0955, 0.205], [0.0935, 0.21], [0.0905, 0.21], [0.0885, 0.205], [0.087, 0.19], [0.0865, 0.04], [0.080, 0.022], [0.06, 0.017], [0, 0.017]], ceramic, 0);
  var hcurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.096, 0.175, 0), new THREE.Vector3(0.138, 0.18, 0), new THREE.Vector3(0.16, 0.135, 0),
    new THREE.Vector3(0.152, 0.078, 0), new THREE.Vector3(0.126, 0.046, 0), new THREE.Vector3(0.095, 0.04, 0)
  ]);
  mug.add(new THREE.Mesh(new THREE.TubeGeometry(hcurve, 32, 0.0115, 14, false), ceramic));
  var band = new THREE.Mesh(new THREE.TorusGeometry(0.0972, 0.0035, 8, 64), new THREE.MeshStandardMaterial({ color: 0xa8322a, roughness: 0.45 }));
  band.rotation.x = Math.PI / 2; band.position.y = 0.15; mug.add(band);
  var coffeeTex = makeTex(128, 128, function (g, w, h) {
    var rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, '#2a150a'); rg.addColorStop(0.6, '#3a1d0e'); rg.addColorStop(0.86, '#86582c'); rg.addColorStop(1, '#cfa468');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(170,120,66,0.28)'; g.lineWidth = 3; g.beginPath();
    for (var a2 = 0; a2 < 9; a2 += 0.1) { var rr = 4 + a2 * 5.4; g.lineTo(w / 2 + Math.cos(a2) * rr * 0.9, h / 2 + Math.sin(a2) * rr * 0.9); }
    g.stroke();
  });
  var coffee = new THREE.Mesh(new THREE.CircleGeometry(0.0866, 56), new THREE.MeshPhysicalMaterial({ map: coffeeTex, roughness: 0.14, clearcoat: 0.8, clearcoatRoughness: 0.05 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.17; mug.add(coffee);
  shadows(mug);
  contact(3.0, 1.55, 0.34, 0.34, 0.5);

  // buhar: kameraya dönük ince şeritler üzerinde gürültü tabanlı, kıvrılan duman telleri
  var STEAM_VS = [
    'uniform float uTime; uniform float uOff; varying vec2 vUv;',
    'void main() {',
    '  vUv = uv; vec3 p = position; float h = uv.y;',
    '  p.x *= 1.0 + h * 1.1;',
    '  p.x += sin(uTime * 0.7 + h * 4.5 + uOff) * 0.035 * h * h + sin(uTime * 1.6 + h * 9.0 + uOff * 2.0) * 0.012 * h;',
    '  p.z += cos(uTime * 0.55 + h * 3.5 + uOff) * 0.03 * h * h;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '}'
  ].join('\n');
  var STEAM_FS = [
    'uniform float uTime; uniform float uSeed; uniform float uGain; varying vec2 vUv;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }',
    'void main() {',
    '  float h = vUv.y; float x = (vUv.x - 0.5) * 2.0;',
    '  vec2 q = vec2(vUv.x * 2.2 + uSeed, h * 1.6 - uTime * 0.16);',
    '  float warp = fbm(q * 1.7 + vec2(0.0, uTime * 0.05));',
    '  float n = fbm(q * vec2(1.5, 1.0) + vec2(warp * 1.3, warp * 0.6));',
    '  float width = mix(0.10, 0.75, h);',
    '  float shape = 1.0 - smoothstep(0.0, width, abs(x + (n - 0.5) * 0.7 * h));',
    '  float fadeIn = smoothstep(0.0, 0.10, h); float fadeOut = 1.0 - smoothstep(0.35, 1.0, h);',
    '  float a = shape * smoothstep(0.46, 0.82, n) * fadeIn * fadeOut * fadeOut * uGain;',
    '  gl_FragColor = vec4(vec3(0.90, 0.93, 0.95), a);',
    '}'
  ].join('\n');
  var steam = [];
  [[0.00, 11.0, 0.55, 0.00], [0.018, 37.0, 0.45, 1.7]].forEach(function (sd, i) {
    var sg = new THREE.PlaneGeometry(0.12, 0.40, 8, 24);
    sg.translate(0, 0.20, 0);
    var sm = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSeed: { value: sd[1] }, uGain: { value: sd[2] }, uOff: { value: sd[3] } },
      vertexShader: STEAM_VS, fragmentShader: STEAM_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    var sp = new THREE.Mesh(sg, sm);
    sp.position.set(3.0 + sd[0], DY + 0.175, 1.55 + (i % 2 ? 0.01 : -0.01));
    sp.renderOrder = 6; scene.add(sp); steam.push(sp);
  });
  function updateSteam(tt) {
    var puff = 0.85 + 0.15 * Math.sin(tt * 0.35);
    steam.forEach(function (sp, i) {
      sp.material.uniforms.uTime.value = tt + i * 3.7;
      sp.material.uniforms.uGain.value = [0.30, 0.24][i] * puff;
      sp.rotation.y = Math.atan2(camera.position.x - sp.position.x, camera.position.z - sp.position.z);
    });
  }

  // kâğıtlar
  var paperTex = makeTex(256, 192, function (g, w, h) {
    g.fillStyle = '#d9d2bc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(40,40,40,0.55)'; g.lineWidth = 1.5;
    for (var y = 30; y < h - 10; y += 14) { g.beginPath(); g.moveTo(16, y); g.lineTo(36 + Math.random() * (w - 70), y); g.stroke(); }
    g.fillStyle = '#7a1f1a'; g.fillRect(16, 10, 70, 8);
  });
  [[-0.1, 1.62, 0.3], [0.05, 1.5, -0.2], [0.25, 1.68, 0.1]].forEach(function (pp, i) {
    var pm2 = mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.95 }), pp[0], DY + 0.003 + i * 0.002, pp[1]);
    pm2.rotation.set(-Math.PI / 2, 0, pp[2]); pm2.receiveShadow = true; scene.add(pm2);
  });

  // perdeler ve süpürgelik
  var curtTex = makeTex(128, 256, function (g, w, h) {
    for (var x = 0; x < w; x += 4) { var v = 20 + Math.sin(x * 0.35) * 10 + Math.random() * 4; g.fillStyle = 'rgb(' + Math.floor(v) + ',' + Math.floor(v + 2) + ',' + Math.floor(v + 4) + ')'; g.fillRect(x, 0, 4, h); }
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  [-4.75, -1.25].forEach(function (cx) {
    var cu = mesh(new THREE.BoxGeometry(0.55, 2.7, 0.12), new THREE.MeshStandardMaterial({ map: curtTex, roughness: 1 }), cx, 2.6, -3.85);
    cu.castShadow = true; scene.add(cu);
  });
  var bbMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 });
  scene.add(mesh(new THREE.BoxGeometry(16, 0.22, 0.07), bbMat, 0, 0.11, -3.965));
  scene.add(mesh(new THREE.BoxGeometry(0.07, 0.22, 10), bbMat, -6.965, 0.11, 0));

  // duvar saati (02:47, saniye ibresi işliyor)
  var clkC = document.createElement('canvas'); clkC.width = clkC.height = 256;
  var cg = clkC.getContext('2d');
  var clkTex = new THREE.CanvasTexture(clkC); clkTex.encoding = THREE.sRGBEncoding;
  var clkLast = -1;
  function updateClock(tt) {
    var sec = Math.floor(tt) % 60;
    if (sec === clkLast) return;
    clkLast = sec;
    cg.clearRect(0, 0, 256, 256);
    cg.fillStyle = '#d8d0b8'; cg.beginPath(); cg.arc(128, 128, 122, 0, 6.2832); cg.fill();
    cg.strokeStyle = '#2a2218'; cg.lineWidth = 8; cg.stroke();
    cg.lineCap = 'round';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6; cg.lineWidth = i % 3 === 0 ? 6 : 3;
      cg.beginPath(); cg.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); cg.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); cg.stroke();
    }
    function hand(an, len, w, col) { cg.strokeStyle = col; cg.lineWidth = w; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 + Math.sin(an) * len, 128 - Math.cos(an) * len); cg.stroke(); }
    hand((2 + 47 / 60) * Math.PI / 6, 62, 9, '#1a140c');
    hand((47 + sec / 60) * Math.PI / 30, 92, 6, '#1a140c');
    hand(sec * Math.PI / 30, 100, 2.5, '#9c2a20');
    clkTex.needsUpdate = true;
  }
  updateClock(0);
  scene.add(mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshStandardMaterial({ map: clkTex, roughness: 0.6 }), 0.9, 3.4, -3.955));
  scene.add(mesh(new THREE.TorusGeometry(0.34, 0.025, 10, 48), new THREE.MeshStandardMaterial({ color: 0x3a2e1c, roughness: 0.4, metalness: 0.6 }), 0.9, 3.4, -3.95));

  /* ---------- dağınıklık: raptiyeler, kâğıt topları, pusula ---------- */
  var pins = [];
  (function () {
    var MD = window.MAP_DATA;
    if (!MD || !MD.G) return;
    function dec(bs) { var st = atob(bs), u = new Uint8Array(st.length); for (var q = 0; q < st.length; q++) u[q] = st.charCodeAt(q); return u; }
    var gG = dec(MD.G), gH = dec(MD.HG), ZK = ['karasal', 'akdeniz', 'karadeniz', 'sert', 'karasal'];
    var red = new THREE.MeshStandardMaterial({ color: 0xc4201a, roughness: 0.35, metalness: 0.1 });
    var steel = new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.3, metalness: 0.9 });
    // Ankara, İstanbul, İzmir, Antalya, Erzurum, Trabzon (levha üzerinde yaklaşık konum)
    [[0.378, 0.616], [0.194, 0.753], [0.108, 0.424], [0.276, 0.230], [0.775, 0.612], [0.702, 0.753]].forEach(function (p) {
      var idx = Math.floor((1 - p[1]) * MD.GH) * MD.GW + Math.floor(p[0] * MD.GW);
      var cv = gG[idx];
      if (cv >= 5 || !zoneInfo[ZK[cv]]) return;
      var g = new THREE.Group();
      g.rotation.x = Math.PI / 2; g.scale.setScalar(1.8);
      var h = gH[idx] / 255 * 0.30;
      g.position.set((p[0] - 0.5) * MD.PW, (p[1] - 0.5) * MD.PH, h);
      g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6), steel, 0, 0.035, 0));
      g.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), red, 0, 0.075, 0));
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      mapG.add(g);
      pins.push({ g: g, h: h, z: zoneInfo[ZK[cv]].meshes[0] });
    });
  })();

  function paperBall(x, z, r, seed) {
    var geo = new THREE.IcosahedronGeometry(r, 1), pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      var k = 1 + (hash2(Math.round(px * 1000), Math.round(py * 1000) + Math.round(pz * 977), seed) - 0.5) * 0.38;
      pos.setXYZ(i, px * k, py * k, pz * k);
    }
    geo.computeVertexNormals();
    var m = mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd9d2bc, roughness: 0.95, flatShading: true }), x, DY + r * 0.85, z);
    m.rotation.set(seed, seed * 2, 0); m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    contact(x, z, r * 4, r * 4, 0.45);
  }
  paperBall(1.4, 1.75, 0.055, 3); paperBall(1.63, 1.66, 0.045, 5); paperBall(-1.3, 1.62, 0.05, 8);

  (function compass() {
    var g = new THREE.Group(); g.position.set(0.85, DY, 1.55); g.rotation.y = 0.4;
    var brass = new THREE.MeshStandardMaterial({ color: 0x9a7a3a, roughness: 0.35, metalness: 0.85 });
    g.add(mesh(new THREE.CylinderGeometry(0.065, 0.068, 0.022, 32), brass, 0, 0.011, 0));
    var face = makeTex(256, 256, function (c, w, h) {
      c.fillStyle = '#e6dcc0'; c.beginPath(); c.arc(128, 128, 126, 0, 6.2832); c.fill();
      c.strokeStyle = '#2a2218'; c.lineWidth = 3;
      for (var i = 0; i < 36; i++) { var a = i * Math.PI / 18, l = i % 9 === 0 ? 30 : 14; c.beginPath(); c.moveTo(128 + Math.sin(a) * (120 - l), 128 - Math.cos(a) * (120 - l)); c.lineTo(128 + Math.sin(a) * 120, 128 - Math.cos(a) * 120); c.stroke(); }
      c.fillStyle = '#2a2218'; c.font = '700 40px "Barlow Condensed", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('K', 128, 52);
      c.fillStyle = '#b0261e'; c.beginPath(); c.moveTo(128, 70); c.lineTo(118, 128); c.lineTo(138, 128); c.fill();
      c.fillStyle = '#d8d8d0'; c.beginPath(); c.moveTo(128, 186); c.lineTo(118, 128); c.lineTo(138, 128); c.fill();
    });
    var f = mesh(new THREE.CircleGeometry(0.058, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.5 }), 0, 0.0225, 0);
    f.rotation.x = -Math.PI / 2; g.add(f);
    shadows(g); scene.add(g);
    contact(0.85, 1.55, 0.2, 0.2, 0.5);
  })();

  // referans odadaki ek ayrıntılar (mantar pano, dolap, raf, mikrofon, Büyük Arama klasörü...): dekor.js
  var dekor = window.ODA_DEKOR ? window.ODA_DEKOR({ THREE: THREE, scene: scene, mesh: mesh, makeTex: makeTex, contact: contact, DY: DY, hash2: hash2 }) : null;
  var aramaMeshes = (dekor && dekor.arama) || [];

  // karakterlerin arkasından soğuk kenar ışığı
  [[-0.9, 2.4, -3.7], [4.9, 2.4, -3.7]].forEach(function (pp) {
    var rl = new THREE.PointLight(0x7fa8c8, 0.3, 3.5, 2);
    rl.position.set(pp[0], pp[1], pp[2]); scene.add(rl);
  });

  scene.traverse(function (o) {
    var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    ms.forEach(function (m) { if (m.isMeshStandardMaterial && m.envMapIntensity !== undefined) m.envMapIntensity = Math.min(m.envMapIntensity, 0.45); });
  });

  /* ---------- kamera ---------- */
  var presets = {
    oda:    { pos: new THREE.Vector3(0.5, 3.0, 6.3),  look: new THREE.Vector3(0.4, 2.2, 0.0) },
    telsiz: { pos: new THREE.Vector3(-2.45, 1.9, 2.35), look: new THREE.Vector3(-2.5, 1.6, 0.2) },
    harita: { pos: new THREE.Vector3(1.9, 3.0, 3.1), look: new THREE.Vector3(1.9, 1.1, 0.2) },
    nuri:   { pos: new THREE.Vector3(0.2, 2.3, 0.6), look: new THREE.Vector3(0.2, 1.95, -3.0) },
    ayse:   { pos: new THREE.Vector3(3.7, 2.3, 0.6), look: new THREE.Vector3(3.7, 1.95, -3.0) }
  };
  var camName = 'oda';
  var camPos = presets.oda.pos.clone(), camLook = presets.oda.look.clone();
  var yawT = 0, pitchT = 0, yaw = 0, pitch = 0;
  var fit = 1;
  var camBtns = document.querySelectorAll('[data-cam]');
  function setCam(n) {
    camName = n; yawT = 0; pitchT = 0;
    camBtns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-cam') === n); });
  }
  camBtns.forEach(function (b) { b.addEventListener('click', function () { setCam(b.getAttribute('data-cam')); }); });

  var ssaoP = null, ssaoLast = new THREE.Vector3(), ssaoSlow = 0;
  var composer = null, composerOn = false, bloomPass = null, bokehPass = null, compFrames = 0;
  function onResize() {
    var w = stage.clientWidth || window.innerWidth, h = stage.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fit = Math.max(1, 1.5 / camera.aspect);
    camera.updateProjectionMatrix();
    if (composerOn) { composer.setPixelRatio(qRatio); composer.setSize(w, h); }
  }
  window.addEventListener('resize', onResize);
  onResize();

  /* ---------- efekt katmanı: gerçek parlama + film tonlaması (boş çıkarsa kendini kapatır) ---------- */
  var FINAL_SHADER = {
    uniforms: { tDiffuse: { value: null }, exposure: { value: 1.15 }, vig: { value: 0.55 }, ca: { value: 0.004 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float exposure; uniform float vig; uniform float ca; varying vec2 vUv;',
      'const mat3 ACESIn = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));',
      'const mat3 ACESOut = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));',
      'vec3 rrt(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }',
      'vec3 aces(vec3 c) { c *= exposure / 0.6; c = ACESIn * c; c = rrt(c); c = ACESOut * c; return clamp(c, 0.0, 1.0); }',
      'vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }',
      'void main() {',
      '  vec2 d = vUv - 0.5; float r2 = dot(d, d); vec2 off = d * r2 * ca * 8.0;',
      '  vec3 hdr; hdr.r = texture2D(tDiffuse, vUv + off).r; hdr.g = texture2D(tDiffuse, vUv).g; hdr.b = texture2D(tDiffuse, vUv - off).b;',
      '  vec3 col = aces(max(hdr, vec3(0.0)));',
      '  float v = smoothstep(0.95, 0.30, length(d * vec2(1.0, 0.85)));',
      '  col *= mix(1.0, v, vig);',
      '  gl_FragColor = vec4(toSRGB(col), 1.0);',
      '}'
    ].join('\n')
  };
  function disableComposer() {
    composerOn = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene.traverse(function (o) {
      var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(function (m) { m.needsUpdate = true; });
    });
    try { renderer.setRenderTarget(null); } catch (e) {}
  }
  function composerLooksOK() {
    try {
      var gl = renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, buf = new Uint8Array(4), bright = 0;
      for (var i = 1; i < 12; i++) for (var j = 1; j < 8; j++) {
        gl.readPixels(Math.floor(W * i / 12), Math.floor(H * j / 8), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        if (buf[0] + buf[1] + buf[2] > 30) bright++;
      }
      return bright >= 3;
    } catch (e) { return false; }
  }
  function enableComposer() {
    try {
      if (!(renderer.capabilities.isWebGL2 && THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass && THREE.WebGLMultisampleRenderTarget)) return;
      var w = stage.clientWidth || window.innerWidth, h = stage.clientHeight || window.innerHeight;
      var rt = new THREE.WebGLMultisampleRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, encoding: THREE.LinearEncoding });
      rt.samples = 4;
      composer = new THREE.EffectComposer(renderer, rt);
      composer.addPass(new THREE.RenderPass(scene, camera));
      if (THREE.SSAOPass && window.location.search.indexOf('ssao=1') >= 0) {
        // temas gölgesi: dolap çekmeceleri, masa üstü eşyaları, köşeler
        var ssaoPass = new THREE.SSAOPass(scene, camera, w, h);
        ssaoP = ssaoPass;
        ssaoPass.kernelRadius = 0.25; ssaoPass.minDistance = 0.002; ssaoPass.maxDistance = 0.08;
        ssaoPass.normalMaterial.skinning = true;
        var ssaoRender = ssaoPass.render.bind(ssaoPass), ssaoHidden = [];
        ssaoPass.render = function (r, wb, rb, d, m) {
          scene.traverse(function (o) {
            var mt = o.material;
            if (o.visible && mt && !Array.isArray(mt) && mt.transparent && (mt.depthWrite === false || mt.opacity < 1)) { o.visible = false; ssaoHidden.push(o); }
          });
          ssaoRender(r, wb, rb, d, m);
          for (var i = 0; i < ssaoHidden.length; i++) ssaoHidden[i].visible = true;
          ssaoHidden.length = 0;
        };
        composer.addPass(ssaoPass);
      }
      if (THREE.BokehPass && window.location.search.indexOf('dof=0') < 0) {
        // alan derinliği: odak masada; arkadaki karakterler ve pencere hafif flulaşır
        bokehPass = new THREE.BokehPass(scene, camera, { focus: 6.5, aperture: 0.0035, maxblur: 0.007, width: w, height: h });
        bokehPass.materialDepth.skinning = true; // kemikli karakterler derinlikte doğru pozda olsun
        var bokehRender = bokehPass.render.bind(bokehPass), hidden = [];
        bokehPass.render = function (r, wb, rb, d, m) {
          // yarı saydam ışık hüzmeleri, parıltılar ve buhar derinlik haritasına girmesin
          scene.traverse(function (o) {
            var mt = o.material;
            if (o.visible && mt && !Array.isArray(mt) && mt.transparent && mt.depthWrite === false) { o.visible = false; hidden.push(o); }
          });
          bokehRender(r, wb, rb, d, m);
          for (var i = 0; i < hidden.length; i++) hidden[i].visible = true;
          hidden.length = 0;
        };
        composer.addPass(bokehPass);
      }
      bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.7, 1.05);
      composer.addPass(bloomPass);
      composer.addPass(new THREE.ShaderPass(FINAL_SHADER));
      renderer.toneMapping = THREE.NoToneMapping;
      composerOn = true;
      composer.setPixelRatio(qRatio); composer.setSize(w, h);
    } catch (err) {
      console.warn('composer', err);
      composerOn = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }
  }
  enableComposer();


  /* ---------- etkileşim ---------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  var nbMeshes = pickables.filter(function (o) { return o.userData.nb; });
  var rdMeshes = pickables.filter(function (o) { return o.userData.rd; });
  var gridG = null, gridH = null, GW = 0, GH = 0, PWm = 1, PHm = 1;
  (function () {
    var MD = window.MAP_DATA;
    if (!MD || !MD.G) return;
    function dec(bs) { var st = atob(bs), u = new Uint8Array(st.length); for (var q = 0; q < st.length; q++) u[q] = st.charCodeAt(q); return u; }
    gridG = dec(MD.G); gridH = dec(MD.HG); GW = MD.GW; GH = MD.GH; PWm = MD.PW; PHm = MD.PH;
  })();
  var ZKEY = ['karasal', 'akdeniz', 'karadeniz', 'sert', 'karasal'];
  var rayHit = new THREE.Vector3(), pickUV = null;
  function pick(ev) {
    var r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var best = null, bestD = 1e9;
    var hits = ray.intersectObjects(nbMeshes, false);
    if (hits.length) { best = 'notebook'; bestD = hits[0].distance; }
    var rh = ray.intersectObjects(rdMeshes, false);
    if (rh.length && rh[0].distance < bestD) { best = 'radio'; bestD = rh[0].distance; }
    var ah = aramaMeshes.length ? ray.intersectObjects(aramaMeshes, false) : [];
    if (ah.length && ah[0].distance < bestD) { best = 'arama'; bestD = ah[0].distance; }
    if (gridG && ray.ray.direction.y < -1e-4) {
      var o = ray.ray.origin, d = ray.ray.direction;
      var tTop = (DY + 0.30 - o.y) / d.y, tBot = (DY + 0.02 - o.y) / d.y, cv = 255, tHit = 0;
      for (var si = 0; si <= 56; si++) {
        var tt = tTop + (tBot - tTop) * si / 56;
        var wx = o.x + d.x * tt - MAP_X, wz = o.z + d.z * tt - MAP_Z;
        var u = wx / PWm + 0.5, v = -wz / PHm + 0.5;
        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
        var idx = Math.floor((1 - v) * GH) * GW + Math.floor(u * GW);
        if (o.y + d.y * tt <= DY + gridH[idx] / 255 * 0.30 + 0.012) { cv = gridG[idx]; tHit = tt; break; }
      }
      if (cv < 5 && tHit > 0 && tHit < bestD) { best = ZKEY[cv]; bestD = tHit; pickUV = [u, v]; }
    }
    return best;
  }
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, y: e.clientY, yaw0: yawT, pitch0: pitchT, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', function (e) {
    if (drag) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      if (drag.moved) {
        yawT = Math.max(-0.7, Math.min(0.7, drag.yaw0 - dx * 0.004));
        pitchT = Math.max(-0.3, Math.min(0.35, drag.pitch0 - dy * 0.003));
      }
    } else {
      state.hover = pick(e);
      canvas.style.cursor = state.hover ? 'pointer' : 'grab';
    }
  });
  var KPS = { mode: 'climate', pickCb: null, markers: null, okPulse: 0, q: [], qTimer: 0 }; // soru sistemi köprüsünün durumu (KPScene aşağıda)
  canvas.addEventListener('pointerup', function (e) {
    var wasClick = drag && !drag.moved;
    drag = null;
    if (wasClick) {
      var z = pick(e);
      if (KPS.pickCb && z && z !== 'notebook' && z !== 'radio' && z !== 'arama' && pickUV) {
        // soru sistemi: seçimi enlem/boylama çevirip motora ver (eski seçim mantığı atlanır)
        var ll = window.KP.geo.localToLatLon((pickUV[0] - 0.5) * PWm, (pickUV[1] - 0.5) * PHm);
        KPS.pickCb({ lat: ll.lat, lon: ll.lon, x: (pickUV[0] - 0.5) * PWm, y: (pickUV[1] - 0.5) * PHm, zone: z });
      }
      else if (z === 'notebook') { if (api.onDefter) api.onDefter(); }
      else if (z === 'radio') { if (api.onTelsiz) api.onTelsiz(); }
      else if (z === 'arama') { if (api.onArama) api.onArama(); }
      else if (z && pickUV && api.onHarita) api.onHarita(z, pickUV[0], pickUV[1]);
    }
  });
  canvas.addEventListener('pointerleave', function () { state.hover = null; });

  /* ---------- oyun köprüsü: React tarafı window.ODA üzerinden sürer ---------- */
  var jetonN = 3;
  function drawJeton(n) {
    jetonN = n;
    var c = jetonTex.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#e8dec2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a7a52'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#2b2214'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 ' + (String(n).length > 2 ? 112 : 140) + 'px "Barlow Condensed", sans-serif';
    g.fillText(n + ' jeton', w / 2, h / 2 + 8);
    jetonTex.needsUpdate = true;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawJeton(jetonN); });
  var api = window.ODA = {
    onHarita: null, // function (bolge, u, v): bolge 'karasal' | 'akdeniz' | 'karadeniz' | 'sert'; u, v levha üzerinde 0..1 (v = 1 kuzey)
    onDefter: null, // function ()
    onTelsiz: null, // function (): masadaki telsize tıklandı
    onArama: null, // function (): masadaki "Büyük Arama Modu" klasörüne tıklandı
    // React'teki karakter kartından ipucu iste: who 'nuri' | 'ayse' (açık vaka yoksa bir şey yapmaz)
    kpIpucu: function (who) { var E = window.KP && window.KP.engine; if (E && E.cur) E.hint(who); },
    // telsiz ekranında gösterilecek Deniz mesajları (açık vaka varsa onun telsiz metni)
    telsizMetni: function () { var E = window.KP && window.KP.engine; return E && E.cur && E.cur.radio ? E.cur.radio.slice() : []; },
    setCam: function (n) { if (presets[n]) setCam(n); },
    snapCam: function (n) { if (presets[n]) { setCam(n); camPos.copy(presets[n].pos); camLook.copy(presets[n].look); } }, // yumuşatmasız anında konum (sinematikten geçişte masa yakın planı)
    setText: function (text, bitti) { LINES = text ? wrapText(text, 36) : []; scrDone = !!bitti; },
    setPil: function (p, sessiz) {
      p = Math.max(0, Math.min(100, Math.round(p)));
      if (p === state.pil) return;
      var dustu = p < state.pil;
      state.pil = p; updateBattery();
      if (dustu && !sessiz && !reduce) triggerFlash();
    },
    setJeton: function (n) { if (n !== jetonN) drawJeton(n); },
    setDefter: function (n) {
      if (n === defterN) return;
      defterN = n;
      var c = pageTex.image; drawPage(c.getContext('2d'), c.width, c.height); pageTex.needsUpdate = true;
    },
    // oyun ilerlemesi 0..1: pencerede şafak, ışıkta ısınma, telsiz ekranında sinyal çubukları
    setIlerleme: function (f) {
      f = Math.max(0, Math.min(1, f || 0)); state.ilerleme = f;
      if (typeof winLight !== 'undefined') { winLight.color.setHex(0x6f9fd8).lerp(new THREE.Color(0xffc48a), f * 0.55); winLight.intensity = 0.22 + f * 0.1; }
    },
    // çözülen vakaların bölgelere göre sayısı: {karasal, akdeniz, karadeniz, sert}
    setIz: function (o) { state.iz = o || {}; },
    // yanlış cevapta telsiz ekranında cızırtı patlaması
    parazit: function () { state.parazit = 1; },
    // Deniz'in kilometre taşı satırı: sıradaki telsiz mesajı olarak daktilo ile yazılır
    hikaye: function (satir) { if (!satir) return; KPS.q.push(satir); }, // doğru cevaptan hemen sonra çağrılır: motorun yazdığı mesajın ardından sıraya girer
    setSecili: function (arr) { var o = {}; (arr || []).forEach(function (k) { o[k] = true; }); state.secili = o; }
  };

  /* ---------- soru sistemi köprüsü (KPScene): src/questions/engine.js bununla konuşur ----------
     Yalnızca ?kp=1 ile başlatılır; React oyunu bu modda kullanılmaz (pil/jeton/metni kendisi sürer). */
  var KP_ZONES = ['karasal', 'akdeniz', 'karadeniz', 'sert'];
  function kpMarkerPos(lat, lon) {
    var p = window.KP.geo.latLonToLocal(lat, lon), h = 0;
    if (gridH) {
      var u = p.x / PWm + 0.5, v = p.y / PHm + 0.5;
      var gx = Math.max(0, Math.min(GW - 1, Math.floor(u * GW))), gy = Math.max(0, Math.min(GH - 1, Math.floor((1 - v) * GH)));
      h = gridH[gy * GW + gx] / 255 * 0.30;
    }
    return new THREE.Vector3(MAP_X + p.x, DY + h + 0.02, MAP_Z - p.y);
  }
  function kpTypeNext() { // telsiz kuyruğu: mesajı daktilo gibi yaz, bekle, sıradakine geç; sonuncusu ekranda kalır
    clearTimeout(KPS.qTimer);
    var msg = KPS.q.shift();
    if (msg == null) return;
    var i = 0, before = KPS.prev ? KPS.prev + ' ' : ''; // önceki mesajlar ekranda kalır: veri (saat, açı...) kaybolmasın
    (function step() {
      i = reduce ? msg.length : Math.min(msg.length, i + 2);
      api.setText(before + msg.slice(0, i), i >= msg.length);
      if (i < msg.length) KPS.qTimer = setTimeout(step, 28);
      else { KPS.prev = before + msg; if (KPS.q.length) KPS.qTimer = setTimeout(kpTypeNext, 1500); }
    })();
  }
  window.KPScene = {
    setBattery: function (p) { api.setPil(p, true); },
    setCoins: function (n) { api.setJeton(n); },
    setCamera: function (n) { api.setCam(n); },
    getCamera: function () { return camName; },
    radioShow: function (lines) { KPS.q = (lines || []).slice(); KPS.prev = ''; kpTypeNext(); },
    flash: function (kind) { if (kind === 'right') KPS.okPulse = 1; else if (!reduce) triggerFlash(); },
    setMapMode: function (mode) {
      // 'climate': renkli bölgeler + etiket + vurgu. 'hidden': harita gizli. 'neutral': renksiz harita, etiket ve vurgu yok.
      KPS.mode = mode; mapG.visible = mode !== 'hidden';
      if (mode === 'hidden') { KPScene_clear(); window.KPScene.clearRoute(); }
    },
    enableMapPick: function (cb) { KPS.pickCb = cb; },
    disableMapPick: function () { KPS.pickCb = null; },
    addMarker: function (lat, lon) {
      if (!KPS.markers) { KPS.markers = new THREE.Group(); scene.add(KPS.markers); }
      var g = new THREE.Group(), red = new THREE.MeshStandardMaterial({ color: 0xd8382c, emissive: 0xff3a2e, emissiveIntensity: 0.6, roughness: 0.4 });
      var stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.4 }));
      stick.position.y = 0.06;
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), red);
      head.position.y = 0.13; head.castShadow = true;
      g.add(stick); g.add(head);
      g.position.copy(kpMarkerPos(lat, lon));
      KPS.markers.add(g);
    },
    // doğru cevap bir defter sayfası açınca masadaki defterin sayfası güncellenir; tamamı deftere tıklayınca açılır
    openNotebookPage: function (n) {
      if (KPS.bridge) return; // gömülü modda defter sayfasını React çizer (setDefter)
      var pg = window.KP.defter && window.KP.defter.page(n);
      defterTxt = pg ? pg.metin : ''; defterN = n;
      var c = pageTex.image; drawPage(c.getContext('2d'), c.width, c.height); pageTex.needsUpdate = true;
    },
    clearMarkers: function () { if (KPS.markers) while (KPS.markers.children.length) KPS.markers.remove(KPS.markers.children[0]); },
    // rota (harita modu): amber tüp + nokta topları; uçlar ve yasak daireler ayrı grupta
    drawRoute: function (pts) {
      kpRouteGroups();
      kpDispose(KPS.routeLine);
      if (!pts || !pts.length) return;
      var amber = new THREE.MeshStandardMaterial({ color: 0xffc47a, emissive: 0xffa23a, emissiveIntensity: 0.7, roughness: 0.4 });
      pts.forEach(function (p) {
        var s = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), amber);
        s.position.copy(kpMarkerPos(p.lat, p.lon)); s.position.y += 0.012; KPS.routeLine.add(s);
      });
      if (pts.length < 2) return;
      var path = [];
      for (var i = 1; i < pts.length; i++) for (var k = (i === 1 ? 0 : 1); k <= 16; k++) {
        var f = k / 16, v = kpMarkerPos(pts[i - 1].lat + (pts[i].lat - pts[i - 1].lat) * f, pts[i - 1].lon + (pts[i].lon - pts[i - 1].lon) * f);
        v.y += 0.012; path.push(v);
      }
      var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), path.length * 2, 0.006, 6, false), amber);
      KPS.routeLine.add(tube);
    },
    clearRoute: function () { kpRouteGroups(); kpDispose(KPS.routeLine); kpDispose(KPS.routeEnds); },
    showEndpoints: function (b) {
      kpRouteGroups(); kpDispose(KPS.routeEnds);
      if (!b || b.mode === 'contour' || !b.start || b.start.lat == null) return;
      var KPg = window.KP.geo, mPerKm = 1 / (KPg.KX * KPg.KM_LON);
      function ball(p, color, label, ring) {
        var pos = kpMarkerPos(p.lat, p.lon), g = new THREE.Group();
        if (ring) {
          var r = new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.03, p.radiusKm * mPerKm * 0.5), 0.004, 6, 28), new THREE.MeshBasicMaterial({ color: color }));
          r.rotation.x = -Math.PI / 2; r.position.copy(pos); r.position.y += 0.015; g.add(r);
        } else {
          var s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 }));
          s.position.copy(pos); s.position.y += 0.04; g.add(s);
        }
        if (label) {
          var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(label, '#e6eee8'), transparent: true, depthTest: false, fog: false }));
          sp.scale.set(0.36, 0.09, 1); sp.renderOrder = 10; sp.position.copy(pos); sp.position.y += 0.14; g.add(sp);
        }
        KPS.routeEnds.add(g);
      }
      ball(b.start, 0x3ddc84, 'A · ' + (b.start.name || 'Başlangıç'));
      (b.waypoints || []).forEach(function (w) { ball(w, 0xffffff, w.name || '', true); });
      ball(b.end, 0xff5a4d, 'B · ' + (b.end.name || 'Varış'));
      (b.forbidden || []).forEach(function (f) {
        var pos = kpMarkerPos(f.lat, f.lon), rr = f.radiusKm * mPerKm;
        var cyl = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.05, 32), new THREE.MeshBasicMaterial({ color: 0xff3a2e, transparent: true, opacity: 0.35, depthWrite: false }));
        cyl.position.copy(pos); cyl.position.y += 0.03; KPS.routeEnds.add(cyl);
      });
    }
  };
  function kpRouteGroups() {
    if (KPS.routeLine) return;
    KPS.routeLine = new THREE.Group(); KPS.routeEnds = new THREE.Group(); scene.add(KPS.routeLine); scene.add(KPS.routeEnds);
  }
  function kpDispose(g) {
    if (!g) return;
    while (g.children.length) {
      var ch = g.children[0]; g.remove(ch);
      ch.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    }
  }
  function KPScene_clear() { window.KPScene.clearMarkers(); }
  // ?kp=1: soru sistemini tek başına başlat (?vaka=<id> ile belirli vaka)
  // ?kp=bridge: React oyunu içinde gömülü; kayıt, menü ve defter React'te kalır, vakayı React ister (api.kpBaslat), olaylar api.onKp ile döner.
  var kpBridge = /[?&]kp=bridge/.test(location.search);
  if ((kpBridge || /[?&]kp=1/.test(location.search)) && window.KP && window.KP.engine) {
    var KPE = window.KP.engine, kpVaka = (location.search.match(/[?&]vaka=([\w-]+)/) || [])[1];
    KPS.bridge = kpBridge;
    document.body.classList.add('kp-on');
    var kpMapOk = false;
    try { if (window.MAP_DATA && gridG) { KP.geo.setMapData(window.MAP_DATA); kpMapOk = true; } } catch (kpErr) { console.warn('KP harita verisi', kpErr); }
    KP.scene = window.KPScene;
    if (!kpBridge) KPE.load();
    var kpCases = (window.KP_CASES || []).filter(function (c) { // harita yüklenmediyse haritayla çözülen vakalar sunulmaz
      var T = KP.types[c.type], need = T && (typeof T.mapNeeded === 'function' ? T.mapNeeded(c) : !!T.mapNeeded);
      return kpMapOk || !need;
    });
    KPE.addCases(kpCases);
    var kpMsgs = [];
    if (!kpMapOk) kpMsgs.push('Harita yüklenemedi: haritayla çözülen vakalar gizlendi.');
    if (!kpBridge) { try { localStorage.setItem('kp_t', '1'); localStorage.removeItem('kp_t'); } catch (kpErr2) { kpMsgs.push('Kayıt kapalı: ilerlemen yalnızca bu oturumda kalır.'); } }
    if (kpMsgs.length) KP.ui.note(kpMsgs.join(' '));
    if (!kpBridge) {
      api.onDefter = function () { KP.defter.open(); };
      var kpOpened = KP.defter.unlocked(); // kayıttan: en son açılan sayfa defterde görünsün
      if (kpOpened.length) window.KPScene.openNotebookPage(kpOpened[kpOpened.length - 1]);
      window.KPScene.setBattery(KPE.state.battery); window.KPScene.setCoins(KPE.state.jeton);
      if (!(kpVaka && KPE.startCase(kpVaka)) && !KPE.start()) KP.ui.note('Çözülmemiş vaka kalmadı. Telsiz sessiz...');
    } else {
      var kpSnap = function () { return { pil: KPE.state.battery, jeton: KPE.state.jeton }; };
      var kpEmit = function (o) { if (api.onKp) try { api.onKp(o); } catch (e) { console.warn('onKp', e); } };
      var kpCamNow = function () { return camName; };
      KPE.save = function () { kpEmit(Object.assign({ tur: 'durum' }, kpSnap())); }; // her ipucu/cevap/pil dolumundan sonra React'e bildir
      KP.on('correct', function (d) { kpEmit(Object.assign({ tur: 'dogru', kpId: d.case.id, kazanc: d.gain, ipucu: d.hints, deneme: d.attempts }, kpSnap())); });
      KP.on('wrong', function (d) { kpEmit(Object.assign({ tur: 'yanlis', kpId: d.case.id, deneme: d.attempts }, kpSnap())); });
      KPE.next = function () { api.kpDur(); kpEmit({ tur: 'bitti' }); }; // doğru cevaptan sonra "Vakalara dön"
      // konu: KP konu kodu, zorluk: 1-3, durum: {pil, jeton}, tekrar: bu hücre daha önce çözüldü mü
      api.kpBaslat = function (konu, zorluk, durum, tekrar) {
        var id = null, ids = KPE.order.filter(function (i) { return KPE.cases[i].topic === konu && KPE.cases[i].difficulty === zorluk; });
        if (!ids.length) { kpEmit({ tur: 'yok', konu: konu, zorluk: zorluk }); return null; }
        id = ids[0];
        if (durum) { KPE.state.battery = durum.pil; KPE.state.jeton = durum.jeton; }
        KPE.state.solved = {}; if (tekrar) KPE.state.solved[id] = 1; // tekrar çözümde ödül düşer
        KPE.state.wrong = [];
        KPE.startCase(id);
        if (KP.ui.refs) KP.ui.refs.bNext.textContent = 'Vakalara dön';
        kpEmit({ tur: 'basla', kpId: id, kamera: kpCamNow() });
        return id;
      };
      api.kpDur = function () {
        clearTimeout(KPS.qTimer); KPS.q = []; KPS.prev = ''; api.setText('', false); // telsiz ekranı boşa dönsün
        KPE.stop(); window.KPScene.setMapMode('climate'); window.KPScene.clearMarkers(); window.KPScene.clearRoute();
      };
      kpEmit({ tur: 'hazir', vakalar: KPE.order.length });
    }
  }

  /* ---------- animasyon döngüsü ---------- */
  var clock = new THREE.Clock();
  var slowF = 0;
  var t = 0, scrAcc = 0, nextFlash = 5 + Math.random() * 5, flashPhase = 0;
  var tmpOff = new THREE.Vector3(), sph = new THREE.Spherical(), tmpFocus = new THREE.Vector3();
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ?warm=1: ana ekranda gizlice ısınma yüklemesi. Betikler/veriler önbelleğe girer, shader'lar derlenir;
  // ilk ~40 kareden sonra çizim durur (GPU/CPU harcamasın).
  var WARM = window.location.search.indexOf('warm=1') >= 0, warmN = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (WARM && ++warmN > 40) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    if (dt > 0.042) slowF++; else slowF = Math.max(0, slowF - 1);
    if (slowF > 45 && qRatio > 1) { qRatio = Math.max(1, qRatio - 0.25); renderer.setPixelRatio(qRatio); onResize(); slowF = 0; }

    // kamera
    var P = presets[camName];
    camPos.lerp(P.pos, 0.06); camLook.lerp(P.look, 0.06);
    yaw += (yawT - yaw) * 0.12; pitch += (pitchT - pitch) * 0.12;
    tmpOff.copy(camPos).sub(camLook).multiplyScalar(fit);
    sph.setFromVector3(tmpOff);
    sph.theta += yaw;
    sph.phi = Math.max(0.35, Math.min(1.5, sph.phi + pitch));
    tmpOff.setFromSpherical(sph);
    camera.position.copy(camLook).add(tmpOff);
    if (!reduce && !drag) { camera.position.x += Math.sin(t * 0.45) * 0.006; camera.position.y += Math.sin(t * 0.31) * 0.004; }
    camera.lookAt(camLook);

    // SSAO ekstra bir tam sahne geçişi: kamera sahneden sahneye giderken kapat (takılmayı önler),
    // durunca aç. Kasma sürerse kalıcı kapat.
    if (ssaoP) {
      var moving = camera.position.distanceToSquared(ssaoLast) > 1e-7;
      ssaoLast.copy(camera.position);
      if (dt > 0.042) ssaoSlow++; else ssaoSlow = Math.max(0, ssaoSlow - 1);
      if (ssaoSlow > 90) { ssaoP.enabled = false; ssaoP = null; }
      else ssaoP.enabled = !moving;
    }

    // bölgeler
    Object.keys(zoneInfo).forEach(function (k) {
      var zi = zoneInfo[k];
      var climate = KPS.mode === 'climate'; // nötr/gizli modda bölge yükselmesi, vurgu ve etiket yok
      var sel = climate && !!state.secili[k];
      var hov = climate && state.hover === k && !sel;
      zi.sprite.visible = climate;
      var tgt = sel ? 1.7 : (hov ? 1.2 : 1);
      var emi = sel ? 0.4 : (hov ? 0.14 : (climate && state.iz[k] ? 0.05 + 0.03 * Math.min(state.iz[k], 6) : 0)); // çözülen vakalar bölgede kalıcı sıcak iz bırakır
      zi.meshes.forEach(function (m) {
        m.scale.z += (tgt - m.scale.z) * 0.12;
        m.material.emissiveIntensity += (emi - m.material.emissiveIntensity) * 0.15;
        m.userData.edges.visible = sel;
      });
      var main = zi.meshes[zi.meshes.length - 1];
      zi.sprite.material.map = sel ? zi.texS : zi.texN;
      zi.sprite.scale.set(sel ? 0.9 : 0.72, sel ? 0.225 : 0.18, 1);
      zi.sprite.position.y = DY + 0.04 + zi.depth * main.scale.z + 0.24 + (reduce ? 0 : Math.sin(t * 2 + zi.wx) * 0.012);
    });

    // raptiyeler bölgeyle birlikte yükselir
    pins.forEach(function (pn) { pn.g.position.z = pn.h * pn.z.scale.z; pn.g.visible = KPS.mode === 'climate'; }); // nötr modda bölge merkezini sızdırmasın
    // odak noktası: bakılan yerin masa seviyesi
    if (bokehPass) {
      bokehPass.uniforms.focus.value = camera.position.distanceTo(tmpFocus.set(camLook.x, Math.min(camLook.y, 1.4), camLook.z));
    }

    if (dekor) dekor.hoverArama(state.hover === 'arama');
    var nbTarget = state.hover === 'notebook' ? 0.3 : 0;
    pageTop.material.emissive.setHex(0xffc47a);
    pageTop.material.emissiveIntensity += (nbTarget - pageTop.material.emissiveIntensity) * 0.15;

    // lamba titremesi
    var base = 0.55, fl = 1;
    if (!reduce) {
      fl = 1 + Math.sin(t * 31) * 0.015;
      if (Math.sin(t * 0.7) > 0.992 || Math.random() < 0.0015) fl = 0.45 + Math.random() * 0.3;
    }
    spot.intensity = base * fl;
    cones.forEach(function (c) { c.material.opacity = 0.03 * fl; });

    updateAvatar(t);
    // insanlar: nefes, bakış, yazma
    people.forEach(function (p) {
      var u = p.userData, ss = t + u.t0;
      u.chest.scale.y = 1 + Math.sin(ss * 1.6) * 0.012;
      var up = Math.max(0, Math.sin(ss * 0.37) - 0.72) / 0.28;
      u.head.rotation.x = 0.16 - up * 0.22;
      u.head.rotation.y = Math.sin(ss * 0.5) * 0.08;
      var typing = Math.sin(ss * 1.1) > 0 ? 1 : 0;
      u.hands.forEach(function (h, i) { h.position.y = h.userData.y0 + Math.sin(ss * 14 + i * 2) * 0.004 * typing; });
    });

    // anten ışığı
    var blink = (Math.floor(t * 1.4) % 2 === 0) ? 1 : 0.15;
    tipLight.intensity = 0.6 * blink;
    tip.material.color.setRGB(blink > 0.5 ? 1 : 0.35, blink > 0.5 ? 0.35 : 0.1, blink > 0.5 ? 0.3 : 0.08);

    glowAnt.material.opacity = 0.7 * blink;
    glowBulb.material.opacity = 0.55 * fl;
    glowScr.material.opacity = 0.14 + Math.sin(t * 9) * 0.015 + (1 - state.pil / 100) * 0.05 * Math.random();
    motes.material.opacity = 0.55 * fl;
    for (var mj = 0; mj < moteN; mj++) {
      var vv = moteVel[mj];
      motePos[mj * 3] += vv[0] * dt + Math.sin(t * 0.6 + mj) * 0.0004;
      motePos[mj * 3 + 1] += vv[1] * dt;
      motePos[mj * 3 + 2] += vv[2] * dt + Math.cos(t * 0.5 + mj) * 0.0004;
      if (motePos[mj * 3 + 1] > LAMP_Y - 0.25) resetMote(mj, false);
    }
    moteGeo.attributes.position.needsUpdate = true;
    updateSteam(t); updateClock(t);

    // şimşek
    nextFlash -= dt;
    if (!reduce && nextFlash <= 0) { triggerFlash(); nextFlash = 8 + Math.random() * 7; }
    if (flash > 0) {
      flash -= dt * 3.2;
      if (flashPhase === 1 && flash < 0.35) { flash = 0.9; flashPhase = 2; }
      if (flash < 0) flash = 0;
    }
    moon.intensity = 0.4 + flash * 6;
    hemi.intensity = 0.14 + flash * 0.6;

    // telsiz ekranı (≈20 fps)
    scrAcc += dt;
    if (scrAcc > 0.05) {
      scrAcc = 0;
      drawScreen(t);
      drawWindow();
    }
    KP_NEUTRAL.value += ((KPS.mode === 'neutral' ? 1 : 0) - KP_NEUTRAL.value) * 0.12;
    KPS.okPulse = Math.max(0, KPS.okPulse - dt * 1.6);
    screenLight.intensity = 0.85 + Math.sin(t * 40) * 0.05 * (1 - state.pil / 100 + 0.2) + KPS.okPulse * 1.2;

    if (composerOn) {
      try { composer.render(dt); }
      catch (cerr) { console.warn('composer', cerr); disableComposer(); renderer.render(scene, camera); }
      compFrames++;
      if (compFrames === 20 && composerOn && !composerLooksOK()) disableComposer();
    } else {
      renderer.render(scene, camera);
    }
  }
  drawScreen(0);
  frame();
})();