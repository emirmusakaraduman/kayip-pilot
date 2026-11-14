(function () {
  var liste = document.getElementById('kartlar');
  var dersListe = document.getElementById('dersler');
  var gecis = document.getElementById('gecis');

  function oge(tag, sinif, metin) {
    var e = document.createElement(tag);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }
  function ikon(sinif) {
    var i = oge('i', 'ti ' + sinif);
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  var dersler = window.DERSLER || [];
  var acik = dersler.filter(function (d) { return d.oyun; }).sort(function (a, b) { return (a.sira || 99) - (b.sira || 99); });
  var yakinda = dersler.filter(function (d) { return !d.oyun; });
  document.getElementById('oynanabilir-sayi').textContent = acik.length ? '(' + acik.length + ')' : '';
  document.getElementById('yakinda-sayi').textContent = yakinda.length ? '(' + yakinda.length + ')' : '';

  // Oyunu olan dersler: büyük, renkli kartlar
  acik.forEach(function (d, i) {
    var o = d.oyun;
    var hazir = !!o.yol;
    var li = oge('li');
    li.style.setProperty('--i', i);
    var kart = hazir ? oge('a', 'kart') : oge('div', 'kart hazirlaniyor');
    kart.style.setProperty('--renk', d.renk);
    if (hazir) {
      kart.href = o.yol;
      kart.setAttribute('aria-label', d.ad + ': ' + o.ad + ' oyununu aç');
    } else {
      kart.setAttribute('aria-disabled', 'true');
    }

    var kapak = oge('div', 'kapak');
    if (o.gorsel) {
      var img = oge('img');
      img.src = o.gorsel; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      kapak.appendChild(img);
    } else {
      kapak.classList.add('kapak-bos');
      kapak.appendChild(ikon(d.ikon));
    }
    var rozet = oge('span', 'ders-rozet');
    rozet.appendChild(ikon(d.ikon));
    rozet.appendChild(document.createTextNode(' ' + d.ad));
    kapak.appendChild(rozet);
    kart.appendChild(kapak);

    var govde = oge('div', 'govde');
    govde.appendChild(oge('h3', null, o.ad));
    if (o.kisa) govde.appendChild(oge('p', 'kisa', o.kisa));
    govde.appendChild(oge('p', 'aciklama', o.aciklama || ''));
    if (o.etiketler && o.etiketler.length) {
      var ul = oge('ul', 'etiketler');
      o.etiketler.forEach(function (t) { ul.appendChild(oge('li', null, t)); });
      govde.appendChild(ul);
    }
    var alt = oge('div', 'alt-satir');
    alt.appendChild(oge('span', 'yapimci', o.yapimci ? 'Yapımcı: ' + o.yapimci : ''));
    alt.appendChild(oge('span', 'oyna', hazir ? 'Oyna →' : 'Hazırlanıyor'));
    govde.appendChild(alt);
    kart.appendChild(govde);
    li.appendChild(kart);
    liste.appendChild(li);
  });

  // Oyunu olmayan dersler: siyah beyaz, üstünde YAKINDA
  yakinda.forEach(function (d, i) {
    var li = oge('li');
    li.style.setProperty('--i', i + acik.length);
    var k = oge('div', 'ders');
    k.setAttribute('aria-label', d.ad + ': yakında');
    k.appendChild(ikon(d.ikon));
    k.appendChild(oge('span', 'ders-ad', d.ad));
    k.appendChild(oge('span', 'damga', 'Yakında'));
    li.appendChild(k);
    dersListe.appendChild(li);
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
