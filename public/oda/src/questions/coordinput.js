/* Klavyeyle koordinat girişi: haritaya dokunamayan oyuncu şehir seçerek ya da enlem/boylam yazarak nokta verir.
   pin ve harita rotası türleri kullanır. Şehir koordinatları yaklaşık (haritadaki işaret için yeterli). */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  KP.CITIES = [
    ['Adana', 37.00, 35.32], ['Afyonkarahisar', 38.76, 30.54], ['Ağrı', 39.72, 43.05], ['Aksaray', 38.37, 34.03], ['Ankara', 39.93, 32.86],
    ['Antalya', 36.90, 30.70], ['Artvin', 41.18, 41.82], ['Bursa', 40.19, 29.06], ['Çanakkale', 40.15, 26.41], ['Denizli', 37.78, 29.09],
    ['Diyarbakır', 37.91, 40.24], ['Edirne', 41.68, 26.56], ['Erzurum', 39.90, 41.27], ['Eskişehir', 39.77, 30.52], ['Gaziantep', 37.07, 37.38],
    ['Giresun', 40.91, 38.39], ['Hakkari', 37.57, 43.74], ['İstanbul', 41.01, 28.98], ['İzmir', 38.42, 27.14], ['Kars', 40.60, 43.09],
    ['Kayseri', 38.72, 35.49], ['Konya', 37.87, 32.48], ['Malatya', 38.35, 38.31], ['Mersin', 36.80, 34.64], ['Muğla', 37.22, 28.36],
    ['Nevşehir', 38.62, 34.71], ['Ordu', 40.98, 37.88], ['Rize', 41.02, 40.52], ['Samsun', 41.29, 36.33], ['Sinop', 42.03, 35.15],
    ['Sivas', 39.75, 37.02], ['Şanlıurfa', 37.16, 38.80], ['Trabzon', 41.00, 39.72], ['Van', 38.49, 43.38], ['Zonguldak', 41.45, 31.79]
  ];
  // Her iklim bölgesinin içinde kalan bir nokta (vakaların selfTest verisiyle aynı bölgeler)
  KP.ZONE_POINTS = { akdeniz: [37.2, 30.5, 'Akdeniz'], karadeniz: [40.9, 40, 'Karadeniz'], karasal: [39.9, 32.8, 'Ilıman karasal'], sert: [40, 42, 'Sert karasal'] };

  // opts: {button: 'Haritada işaretle', onSubmit: function(lat, lon), cities: false} -> kutu elemanı
  // cities:false: şehir listesi gösterilmez (koordinat okunarak bulunan vakalarda şehir adı cevabı verir)
  KP.coordForm = function (opts) {
    var city = U.el('select', { class: 'kp-input kp-sm', 'aria-label': 'Şehir seç (isteğe bağlı)' }), msg = U.el('div', { class: 'kp-sel', role: 'status', 'aria-live': 'polite' });
    var useCities = opts.cities !== false;
    city.appendChild(U.el('option', { value: '', text: 'Şehir seç…' }));
    KP.CITIES.forEach(function (c, i) { city.appendChild(U.el('option', { value: String(i), text: c[0] })); });
    var lat = U.el('input', { class: 'kp-input kp-sm', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Enlem (°K)', placeholder: 'Enlem °K' }),
      lon = U.el('input', { class: 'kp-input kp-sm', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Boylam (°D)', placeholder: 'Boylam °D' });
    function go() {
      var a = U.parseNumber(lat.value), o = U.parseNumber(lon.value);
      if (!isFinite(a) || !isFinite(o)) { msg.textContent = 'Enlem ve boylamı sayı olarak yaz (örn. 39,9 ve 32,8).'; return; }
      if (a < 35 || a > 43 || o < 25 || o > 45) { msg.textContent = 'Bu değerler haritanın dışında kalıyor. Enlem 35–43, boylam 25–45 arası olmalı.'; return; }
      msg.textContent = ''; opts.onSubmit(a, o);
    }
    city.addEventListener('change', function () {
      var c = KP.CITIES[parseInt(city.value, 10)];
      if (c) { lat.value = String(c[1]); lon.value = String(c[2]); }
    });
    [lat, lon].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); }); });
    return U.el('div', { class: 'kp-coord', role: 'group', 'aria-label': 'Koordinatla gir' }, [
      U.el('div', { class: 'kp-info', text: useCities ? 'Haritaya dokunamıyorsan: şehir seç ya da enlem ve boylam yaz.' : 'Haritaya dokunamıyorsan: enlem ve boylamı yazarak işaretle.' }),
      U.el('div', { class: 'kp-row' }, (useCities ? [city] : []).concat([lat, lon, U.el('button', { type: 'button', class: 'kp-btn kp-sm', text: opts.button || 'İşaretle', onclick: go })])), msg
    ]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
