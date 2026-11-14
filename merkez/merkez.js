(function () {
  var liste = document.getElementById('kartlar');
  var gecis = document.getElementById('gecis');

  function oge(tag, sinif, metin) {
    var e = document.createElement(tag);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }

  (window.OYUNLAR || []).forEach(function (o, i) {
    var li = oge('li');
    li.style.setProperty('--i', i);
    var kart = o.yakinda ? oge('div', 'kart yakinda') : oge('a', 'kart');
    if (o.yakinda) {
      kart.setAttribute('aria-disabled', 'true');
      if (o.renk) kart.style.setProperty('--renk', o.renk);
    } else {
      kart.href = o.yol;
      kart.setAttribute('aria-label', o.ad + ' oyununu aç');
    }

    var kapak = oge('div', 'kapak');
    if (o.gorsel) {
      var img = oge('img');
      img.src = o.gorsel; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      kapak.appendChild(img);
    } else {
      kapak.appendChild(oge('b', null, String(i + 1)));
    }
    if (o.yakinda) kapak.appendChild(oge('span', 'rozet', 'Yakında'));
    kart.appendChild(kapak);

    var govde = oge('div', 'govde');
    govde.appendChild(oge('h2', null, o.ad));
    if (o.kisa && !o.yakinda) govde.appendChild(oge('p', 'kisa', o.kisa));
    govde.appendChild(oge('p', 'aciklama', o.aciklama || ''));
    if (o.etiketler && o.etiketler.length) {
      var ul = oge('ul', 'etiketler');
      o.etiketler.forEach(function (t) { ul.appendChild(oge('li', null, t)); });
      govde.appendChild(ul);
    }
    if (!o.yakinda) {
      var alt = oge('div', 'alt-satir');
      alt.appendChild(oge('span', 'yapimci', o.yapimci ? 'Yapımcı: ' + o.yapimci : ''));
      alt.appendChild(oge('span', 'oyna', 'Oyna →'));
      govde.appendChild(alt);
    }
    kart.appendChild(govde);
    li.appendChild(kart);
    liste.appendChild(li);
  });

  // Oyuna geçerken kısa bir karartma
  liste.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.kart');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault();
    gecis.classList.add('ac');
    setTimeout(function () { location.href = a.href; }, 380);
  });
  // Geri tuşuyla dönünce karartmayı kaldır
  window.addEventListener('pageshow', function () { gecis.classList.remove('ac'); });

  // Yağmur
  var cv = document.getElementById('yagmur');
  if (!cv || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var cx = cv.getContext('2d'), w = 0, h = 0, damla = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  function boyut() {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(160, w * h / 9000));
    damla = [];
    for (var i = 0; i < n; i++) damla.push({ x: Math.random() * w, y: Math.random() * h, u: 10 + Math.random() * 18, v: 9 + Math.random() * 9, a: 0.08 + Math.random() * 0.16 });
  }
  boyut();
  window.addEventListener('resize', boyut);
  var son = 0;
  function ciz(t) {
    requestAnimationFrame(ciz);
    if (document.hidden || t - son < 30) return;
    son = t;
    cx.clearRect(0, 0, w, h);
    cx.lineWidth = 1; cx.lineCap = 'round';
    for (var i = 0; i < damla.length; i++) {
      var d = damla[i];
      cx.strokeStyle = 'rgba(170,205,225,' + d.a + ')';
      cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x - d.u * 0.28, d.y + d.u); cx.stroke();
      d.y += d.v; d.x -= d.v * 0.28;
      if (d.y > h) { d.y = -d.u; d.x = Math.random() * (w + 80); }
    }
  }
  requestAnimationFrame(ciz);
})();
