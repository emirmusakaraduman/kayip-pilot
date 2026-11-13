/* Telsiz odası dekoru: referans görseldeki ayrıntılar (mantar pano, dolap, raf, çerçeve, mikrofon, kalemlik, Büyük Arama klasörü).
   main.js içinden window.ODA_DEKOR(bağlam) ile çağrılır; sahne nesnelerine yalnızca verilen bağlam üzerinden erişir. */
(function () {
  window.ODA_DEKOR = function (c) {
    var THREE = c.THREE, scene = c.scene, mesh = c.mesh, makeTex = c.makeTex, contact = c.contact, DY = c.DY, hash2 = c.hash2;
    var arama = []; // tıklanabilir Büyük Arama klasörü ağları

    function M(o) { return new THREE.MeshStandardMaterial(o); }
    // canvas dokusu; yazı tipleri sonradan yüklenirse yeniden çizilir
    function T(w, h, draw, rep) {
      var t = makeTex(w, h, draw, rep);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          var cv = t.image, g = cv.getContext('2d');
          g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true;
        });
      }
      return t;
    }
    function gölge(g) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 4; }
    function kapat(o, cast, recv) { o.traverse(function (m) { if (m.isMesh) { m.castShadow = cast !== false; m.receiveShadow = recv !== false; } }); }
    var FONT = '"Barlow Condensed", "Arial Narrow", sans-serif', EL = '"Caveat", "Segoe Script", cursive';

    /* ---------- mantar pano (arka duvar, pencerenin solu) ---------- */
    (function () {
      var tex = T(1024, 820, function (g, w, h) {
        g.fillStyle = '#a07242'; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 6500; i++) {
          g.fillStyle = Math.random() < 0.5 ? 'rgba(60,35,15,' + (0.05 + Math.random() * 0.14) + ')' : 'rgba(225,175,110,' + (0.04 + Math.random() * 0.1) + ')';
          g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
        function kağıt(x, y, pw, ph, rot, col, satır) {
          g.save(); g.translate(x, y); g.rotate(rot); gölge(g); g.fillStyle = col; g.fillRect(-pw / 2, -ph / 2, pw, ph);
          g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(35,35,35,.5)'; g.lineWidth = 2;
          for (var k = 0; k < satır; k++) { var yy = -ph / 2 + 26 + k * ((ph - 40) / satır); g.beginPath(); g.moveTo(-pw / 2 + 14, yy); g.lineTo(pw / 2 - 14 - Math.random() * 46, yy); g.stroke(); }
          g.restore();
        }
        function not(x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); gölge(g); g.fillStyle = '#f3df6a'; g.fillRect(-s / 2, -s / 2, s, s); g.shadowColor = 'transparent'; g.fillStyle = 'rgba(40,30,10,.55)'; g.font = '700 22px ' + EL; g.fillText('rüzgâr?', -s / 2 + 10, -s / 2 + 30); g.fillRect(-s / 2 + 10, -s / 2 + 44, s - 30, 3); g.fillRect(-s / 2 + 10, -s / 2 + 58, s - 46, 3); g.restore(); }
        kağıt(190, 190, 210, 270, -0.04, '#efe8d8', 7);
        g.fillStyle = '#7fb2d8'; g.fillRect(120, 130, 150, 90); g.fillStyle = '#7fae6a'; g.beginPath(); g.ellipse(190, 175, 52, 26, 0.3, 0, 6.3); g.fill();
        kağıt(470, 380, 330, 290, 0.03, '#e9e1cf', 0);
        g.strokeStyle = 'rgba(110,70,30,.6)'; g.lineWidth = 3;
        for (var q = 0; q < 6; q++) { g.beginPath(); g.ellipse(470 + q * 6, 380 - q * 3, 150 - q * 22, 105 - q * 14, 0.2, 0, 6.3); g.stroke(); }
        g.strokeStyle = '#c0281f'; g.lineWidth = 4; g.beginPath(); g.moveTo(350, 460); g.lineTo(430, 400); g.lineTo(500, 360); g.lineTo(590, 330); g.stroke();
        kağıt(690, 190, 190, 240, 0.05, '#ece4d2', 6);
        kağıt(880, 210, 190, 260, -0.03, '#efe8d6', 0);
        g.fillStyle = '#b3261e'; g.font = '700 64px ' + FONT; g.textAlign = 'center'; g.fillText('KAYIP', 880, 190); g.fillText('PİLOT', 880, 252);
        g.fillStyle = '#2a2a2a'; g.fillRect(826, 270, 108, 98);
        g.fillStyle = '#5b5b5b'; g.beginPath(); g.arc(880, 308, 20, 0, 6.3); g.fill(); g.fillRect(852, 330, 56, 34);
        kağıt(150, 560, 190, 230, -0.06, '#dcd5c4', 0);
        g.fillStyle = '#2a2a2a'; g.fillRect(90, 490, 120, 130); g.fillStyle = '#767676'; g.beginPath(); g.arc(150, 540, 24, 0, 6.3); g.fill(); g.fillRect(120, 568, 60, 44);
        g.fillStyle = '#b3261e'; g.font = '700 34px ' + FONT; g.textAlign = 'center'; g.fillText('KAYIP PİLOT', 150, 650);
        kağıt(760, 600, 180, 220, 0.04, '#ece6d6', 8);
        not(330, 90, 96, 0.07); not(600, 560, 100, -0.09); not(960, 480, 92, 0.05); not(60, 400, 90, -0.04); not(860, 700, 90, 0.08);
        // kırmızı iplikler ve raptiyeler
        var pimler = [[190, 150], [470, 330], [690, 150], [880, 160], [150, 520], [600, 520], [760, 560], [330, 62], [960, 440]];
        var iplik = [[0, 1], [1, 2], [2, 3], [1, 4], [1, 5], [5, 6], [3, 8], [0, 7], [7, 2], [4, 5]];
        g.strokeStyle = 'rgba(190,35,30,.85)'; g.lineWidth = 3.2;
        iplik.forEach(function (p) { g.beginPath(); g.moveTo(pimler[p[0]][0], pimler[p[0]][1]); g.lineTo(pimler[p[1]][0], pimler[p[1]][1]); g.stroke(); });
        pimler.forEach(function (p) {
          g.save(); gölge(g); var gr = g.createRadialGradient(p[0] - 3, p[1] - 3, 1, p[0], p[1], 11);
          gr.addColorStop(0, '#ff8a7c'); gr.addColorStop(1, '#a11d17'); g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], 10, 0, 6.3); g.fill(); g.restore();
        });
      });
      var g = new THREE.Group(); g.position.set(-5.75, 3.0, -3.96);
      g.add(mesh(new THREE.BoxGeometry(1.5, 1.2, 0.05), M({ color: 0x4a3322, roughness: 0.7 }), 0, 0, 0));
      g.add(mesh(new THREE.PlaneGeometry(1.4, 1.12), M({ map: tex, roughness: 0.95 }), 0, 0, 0.028));
      kapat(g); scene.add(g);
      var l = new THREE.PointLight(0xffd9a0, 0.45, 4.2, 2); l.position.set(-5.4, 3.3, -2.7); scene.add(l);
    })();

    /* ---------- sağ arka: dosya dolapları, raf, koliler ---------- */
    (function () {
      var gri = M({ color: 0x6b7078, roughness: 0.4, metalness: 0.7 }), acık = M({ color: 0x7c828a, roughness: 0.4, metalness: 0.7 }), kol = M({ color: 0x2b2e32, roughness: 0.4, metalness: 0.7 });
      [5.8, 6.78].forEach(function (x) {
        var d = new THREE.Group(); d.position.set(x, 0, -3.55);
        d.add(mesh(new THREE.BoxGeometry(0.92, 1.64, 0.7), gri, 0, 0.82, 0));
        for (var i = 0; i < 4; i++) {
          var y = 0.2 + i * 0.4;
          d.add(mesh(new THREE.BoxGeometry(0.82, 0.34, 0.02), acık, 0, y + 0.1, 0.36));
          d.add(mesh(new THREE.BoxGeometry(0.24, 0.03, 0.035), kol, 0, y + 0.19, 0.385));
          d.add(mesh(new THREE.BoxGeometry(0.16, 0.06, 0.012), M({ color: 0xcfd2cc, roughness: 0.8 }), 0, y + 0.1, 0.375));
        }
        kapat(d); scene.add(d);
      });
      // koliler
      var koli = M({ color: 0x9a7448, roughness: 0.95 });
      var k1 = mesh(new THREE.BoxGeometry(0.85, 0.62, 0.7), koli, 7.55, 0.31, -3.3); k1.rotation.y = 0.08;
      var k2 = mesh(new THREE.BoxGeometry(0.62, 0.45, 0.5), M({ color: 0x8a6840, roughness: 0.95 }), 7.5, 0.85, -3.28); k2.rotation.y = -0.14;
      kapat(k1); kapat(k2); scene.add(k1); scene.add(k2);
      // raf: tahta, braketler, eski radyo, klasörler
      var raf = new THREE.Group(); raf.position.set(6.3, 3.2, -3.78);
      raf.add(mesh(new THREE.BoxGeometry(2.0, 0.05, 0.36), M({ color: 0x3a2a1e, roughness: 0.7 }), 0, 0, 0));
      [-0.8, 0.8].forEach(function (x) { raf.add(mesh(new THREE.BoxGeometry(0.04, 0.22, 0.3), kol, x, -0.13, 0)); });
      var radyoTex = T(256, 160, function (g, w, h) {
        g.fillStyle = '#6a4a2c'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#2a1e14'; g.fillRect(14, 16, 118, 128);
        g.strokeStyle = 'rgba(190,150,90,.5)'; g.lineWidth = 2; for (var i = 0; i < 12; i++) { g.beginPath(); g.moveTo(18, 24 + i * 10); g.lineTo(128, 24 + i * 10); g.stroke(); }
        g.fillStyle = '#d8c79a'; g.fillRect(146, 22, 96, 44); g.strokeStyle = '#2a1e14'; g.lineWidth = 2; g.beginPath(); g.moveTo(160, 60); g.lineTo(230, 60); g.stroke();
        g.fillStyle = '#c0281f'; g.fillRect(190, 26, 3, 36);
        g.fillStyle = '#1c1410'; g.beginPath(); g.arc(166, 108, 16, 0, 6.3); g.arc(218, 108, 16, 0, 6.3); g.fill();
      });
      var rad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.26), [M({ color: 0x4a3420 }), M({ color: 0x4a3420 }), M({ color: 0x4a3420 }), M({ color: 0x4a3420 }), M({ map: radyoTex, roughness: 0.6 }), M({ color: 0x4a3420 })]);
      rad.position.set(-0.55, 0.215, 0); raf.add(rad);
      var renkler = [0xd8dad6, 0x40454c, 0xcfd2cc, 0x30343a];
      renkler.forEach(function (col, i) { raf.add(mesh(new THREE.BoxGeometry(0.11, 0.34, 0.27), M({ color: col, roughness: 0.8 }), 0.25 + i * 0.13, 0.195, 0)); });
      kapat(raf); scene.add(raf);
      var l = new THREE.PointLight(0x8fb4d0, 0.5, 5, 2); l.position.set(6.3, 2.7, -2.7); scene.add(l);
    })();

    /* ---------- arka duvar: sertifika çerçevesi, yazı tahtası ---------- */
    (function () {
      var sert = T(256, 200, function (g, w, h) {
        g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5a2a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
        g.fillStyle = '#3a2c18'; g.font = '700 26px ' + FONT; g.textAlign = 'center'; g.fillText('BELGE', w / 2, 56);
        g.fillStyle = 'rgba(50,40,25,.55)'; for (var i = 0; i < 5; i++) g.fillRect(40, 78 + i * 16, w - 80 - (i % 2) * 30, 3);
        g.fillStyle = '#a11d17'; g.beginPath(); g.arc(w - 52, h - 44, 16, 0, 6.3); g.fill();
      });
      var f = new THREE.Group(); f.position.set(-0.6, 3.55, -3.965);
      f.add(mesh(new THREE.BoxGeometry(0.56, 0.44, 0.03), M({ color: 0x2c2118, roughness: 0.6 }), 0, 0, 0));
      f.add(mesh(new THREE.PlaneGeometry(0.46, 0.34), M({ map: sert, roughness: 0.8 }), 0, 0, 0.017));
      kapat(f); scene.add(f);
      var tahta = T(256, 360, function (g, w, h) {
        g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(30,30,30,.55)'; g.lineWidth = 2;
        for (var r = 0; r < 12; r++) { g.beginPath(); g.moveTo(16, 50 + r * 24); g.lineTo(w - 16, 50 + r * 24); g.stroke(); }
        g.beginPath(); g.moveTo(90, 40); g.lineTo(90, h - 20); g.stroke(); g.beginPath(); g.moveTo(170, 40); g.lineTo(170, h - 20); g.stroke();
        g.fillStyle = '#2a2a2a'; g.font = '700 22px ' + FONT; g.textAlign = 'left'; g.fillText('VARDİYA', 20, 32);
      });
      var t = new THREE.Group(); t.position.set(-0.6, 2.75, -3.965); t.rotation.z = 0.02;
      t.add(mesh(new THREE.BoxGeometry(0.42, 0.58, 0.02), M({ color: 0x5a4028, roughness: 0.7 }), 0, 0, 0));
      t.add(mesh(new THREE.PlaneGeometry(0.34, 0.48), M({ map: tahta, roughness: 0.85 }), 0, -0.02, 0.012));
      t.add(mesh(new THREE.BoxGeometry(0.16, 0.05, 0.03), M({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 }), 0, 0.28, 0.018));
      kapat(t); scene.add(t);
    })();

    /* ---------- masa üstü: mikrofon, kablo, kalemlik + büyüteç ---------- */
    (function () {
      var siyah = M({ color: 0x15171a, roughness: 0.4, metalness: 0.7 }), gümüş = M({ color: 0xa9aeb3, roughness: 0.3, metalness: 0.9 });
      var mic = new THREE.Group(); mic.position.set(-1.05, DY, -0.5);
      mic.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.022, 28), siyah, 0, 0.011, 0));
      mic.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.3, 10), gümüş, 0, 0.17, 0));
      var baş = new THREE.Group(); baş.position.set(0, 0.34, 0); baş.rotation.x = -0.55;
      baş.add(mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.11, 20), siyah, 0, 0, 0));
      baş.add(mesh(new THREE.SphereGeometry(0.04, 20, 14), M({ color: 0x8e9398, roughness: 0.35, metalness: 0.85 }), 0, 0.075, 0));
      baş.add(mesh(new THREE.TorusGeometry(0.037, 0.005, 6, 20), gümüş, 0, 0.03, 0).rotateX(Math.PI / 2));
      mic.add(baş); kapat(mic); scene.add(mic);
      contact(-1.05, -0.5, 0.3, 0.3, 0.5);
      var kablo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.05, DY + 0.012, -0.5), new THREE.Vector3(-1.18, DY + 0.01, -0.3), new THREE.Vector3(-1.3, DY + 0.012, -0.12), new THREE.Vector3(-1.42, DY + 0.03, 0.02)
      ]), 24, 0.006, 6, false), M({ color: 0x0e0f10, roughness: 0.6 }));
      kablo.castShadow = true; scene.add(kablo);

      var cup = new THREE.Group(); cup.position.set(-0.72, DY, -0.55);
      cup.add(mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.13, 18, 1, true), M({ color: 0x5a5f66, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide }), 0, 0.065, 0));
      cup.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.006, 18), M({ color: 0x3a3e44, metalness: 0.8, roughness: 0.5 }), 0, 0.003, 0));
      var kalemRenk = [0xe0b82a, 0x2a5fa8, 0xb3261e, 0x2e8a4a, 0xe0b82a, 0x222222, 0xb3261e];
      kalemRenk.forEach(function (col, i) {
        var a = i * 0.9, ra = 0.012 + (i % 3) * 0.01;
        var p = new THREE.Group(); p.position.set(Math.cos(a) * ra, 0.07, Math.sin(a) * ra);
        p.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22);
        p.add(mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.2 + (i % 2) * 0.03, 6), M({ color: col, roughness: 0.6 }), 0, 0.09, 0));
        p.add(mesh(new THREE.ConeGeometry(0.0045, 0.016, 6), M({ color: 0x2a2a2a, roughness: 0.7 }), 0, 0.2 + (i % 2) * 0.03, 0));
        cup.add(p);
      });
      var büy = new THREE.Group(); büy.position.set(0.1, 0.08, 0.02); büy.rotation.set(-0.95, 0.25, 0.4);
      büy.add(mesh(new THREE.TorusGeometry(0.052, 0.006, 8, 28), M({ color: 0xb08a3a, roughness: 0.3, metalness: 0.9 }), 0, 0.14, 0));
      büy.add(mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshStandardMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, 0.14, 0));
      büy.add(mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.12, 8), M({ color: 0x1a1a1c, roughness: 0.5 }), 0, 0.04, 0));
      cup.add(büy); kapat(cup); scene.add(cup);
      contact(-0.72, -0.55, 0.26, 0.26, 0.45);
    })();

    /* ---------- sarı "BÜYÜK ARAMA MODU · GİZLİ" klasörü (tıklanır) ---------- */
    var üstMat = null, hedefParla = 0;
    (function () {
      var yüz = T(512, 640, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e6b93a'); gr.addColorStop(1, '#cf9d24');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 1800; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '90,60,10' : '255,230,150') + ',' + Math.random() * 0.08 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        g.fillStyle = 'rgba(70,45,5,.35)'; g.fillRect(0, 0, 14, h);
        g.fillStyle = '#f1e9cf'; g.fillRect(50, 70, 412, 150); g.strokeStyle = 'rgba(60,40,10,.55)'; g.lineWidth = 3; g.strokeRect(50, 70, 412, 150);
        g.fillStyle = '#2a2013'; g.textAlign = 'center'; g.font = '700 74px ' + FONT; g.fillText('BÜYÜK', w / 2, 140); g.fillText('ARAMA MODU', w / 2, 206);
        g.save(); g.translate(256, 430); g.rotate(-0.05); g.strokeStyle = '#b3261e'; g.lineWidth = 9; g.strokeRect(-130, -48, 260, 96);
        g.fillStyle = '#b3261e'; g.font = '700 86px ' + FONT; g.fillText('GİZLİ', 0, 30); g.restore();
        g.fillStyle = 'rgba(60,40,10,.55)'; for (var k = 0; k < 3; k++) g.fillRect(70, 540 + k * 22, 300 - k * 60, 4);
      });
      var yanMat = M({ color: 0xcfa02a, roughness: 0.8 });
      üstMat = M({ map: yüz, roughness: 0.75, emissive: 0xffc47a, emissiveMap: yüz, emissiveIntensity: 0 });
      var dosya = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.026, 0.72), [yanMat, yanMat, üstMat, yanMat, yanMat, yanMat]);
      dosya.position.set(2.3, DY + 0.016, 1.68); dosya.rotation.y = 0.14; dosya.castShadow = true; dosya.receiveShadow = true;
      scene.add(dosya); arama.push(dosya);
      var kâğıtlar = mesh(new THREE.BoxGeometry(0.53, 0.012, 0.69), M({ color: 0xe6dcc0, roughness: 0.9 }), 2.31, DY + 0.006, 1.67); kâğıtlar.rotation.y = 0.12; scene.add(kâğıtlar);
      contact(2.3, 1.68, 0.8, 0.95, 0.5);
    })();

    return {
      arama: arama,
      // üzerine gelinince klasör hafifçe parlar (her karede çağrılır)
      hoverArama: function (on) {
        if (!üstMat) return;
        hedefParla = on ? 0.32 : 0;
        üstMat.emissiveIntensity += (hedefParla - üstMat.emissiveIntensity) * 0.15;
      }
    };
  };
})();
