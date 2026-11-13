/* Çalıştır: node tests/run.js   (hepsi yeşil olmadan commit yok) */
var H = require('./helpers.js'), assert = require('assert');
var pass = 0, fail = 0, names = [];
function t(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('  KALDI  ' + name + '\n         ' + (e && e.message)); } }
var L = H.loadKP(), KP = L.KP, cases = H.loadCases();

console.log('Yardımcılar');
t('parseNumber: virgül ve nokta', function () { assert.strictEqual(KP.util.parseNumber('42,5'), 42.5); assert.strictEqual(KP.util.parseNumber('1.000'), 1000); assert.strictEqual(KP.util.parseNumber('2.400 m'), 2400); assert.strictEqual(KP.util.parseNumber('20 km'), 20); assert.ok(isNaN(KP.util.parseNumber('abc'))); });
t('parseDegrees: 71°27′ ve 42', function () { assert.ok(Math.abs(KP.util.parseDegrees('71°27′') - 71.45) < 1e-9); assert.strictEqual(KP.util.parseDegrees('42°'), 42); assert.strictEqual(KP.util.parseDegrees('42 K'), 42); assert.ok(Math.abs(KP.util.parseDegrees('42,5') - 42.5) < 1e-9); });

console.log('Coğrafya katmanı');
t('yerel <-> enlem/boylam gidiş dönüş', function () { var p = KP.geo.localToLatLon(0.3, -0.2), q = KP.geo.latLonToLocal(p.lat, p.lon); assert.ok(Math.abs(q.x - 0.3) < 1e-9 && Math.abs(q.y + 0.2) < 1e-9); });
t('mesafe: İstanbul-Ankara yaklaşık 350 km', function () { var d = KP.geo.distanceKm({ lat: 41.01, lon: 28.98 }, { lat: 39.93, lon: 32.86 }); assert.ok(d > 320 && d < 380, d); });
var CITY = [['Ankara', 39.93, 32.86, 'karasal'], ['Konya', 37.87, 32.48, 'karasal'], ['Sivas', 39.75, 37.02, 'karasal'], ['İzmir', 38.42, 27.14, 'akdeniz'], ['Mersin', 36.8, 34.64, 'akdeniz'], ['Erzurum', 39.9, 41.27, 'sert'], ['Kars', 40.6, 43.09, 'sert'],
  ['Antalya (kıyı)', 36.9, 30.7, 'akdeniz'], ['Trabzon (kıyı)', 41.0, 39.72, 'karadeniz'], ['Samsun (kıyı)', 41.29, 36.33, 'karadeniz'], ['Sinop (kıyı)', 42.03, 35.15, 'karadeniz']];
CITY.forEach(function (c) { t('bölge: ' + c[0] + ' -> ' + c[3], function () { assert.strictEqual(KP.geo.zoneNear(c[1], c[2], 45), c[3]); }); });
t('iç şehirler doğrudan hücreden doğru çıkar', function () { assert.strictEqual(KP.geo.zoneAt(39.93, 32.86), 'karasal'); assert.strictEqual(KP.geo.zoneAt(37.87, 32.48), 'karasal'); });

console.log('Eş yükselti');
t('düz rota tepeyi aşar, dolaşım aşmaz', function () {
  var c = cases.filter(function (x) { return x.id === 'harita-02-esyukselti-rota'; })[0], b = c.board;
  var d = KP.contour.routeStats(b.terrain, [[0.1, 0.85], [0.9, 0.15]], b.widthKm), g = KP.contour.routeStats(b.terrain, [[0.1, 0.85], [0.5, 0.93], [0.9, 0.85], [0.9, 0.15]], b.widthKm);
  assert.ok(d.ascentM > 600 && g.ascentM < 100, d.ascentM + ' / ' + g.ascentM);
});
t('kontur çizgileri üretilir', function () { var c = cases.filter(function (x) { return x.id === 'harita-02-esyukselti-rota'; })[0]; assert.ok(KP.contour.contourSegments(c.board.terrain, [150, 300, 450], 40).length > 50); });

console.log('Vaka doğrulama ve kendi kendini sınama (tüm örnek vakalar)');
cases.forEach(function (c) {
  t(c.id + ': şema', function () { var e = KP.validateCase(c); assert.deepStrictEqual(e, []); });
  t(c.id + ': selfTest', function () { assert.deepStrictEqual(KP.runSelfTest(c), []); });
});
t('tür-konu tablosu: her tür için en az bir örnek var', function () { var seen = {}; cases.forEach(function (c) { seen[c.type] = 1; }); ['pin', 'number', 'cards', 'route', 'decision', 'graph'].forEach(function (k) { assert.ok(seen[k], k + ' örneği yok'); }); });
t('geçersiz tür-konu eşleşmesi reddedilir', function () { var c = JSON.parse(JSON.stringify(cases[0])); c.topic = 'goc'; assert.ok(KP.validateCase(c).some(function (x) { return /uymuyor/.test(x); })); });
t('yanlış kartın why alanı zorunlu', function () { var c = JSON.parse(JSON.stringify(cases.filter(function (x) { return x.type === 'cards'; })[0])); delete c.board.cards[1].why; assert.ok(KP.validateCase(c).some(function (x) { return /why/.test(x); })); });
t('eksik selfTest reddedilir', function () { var c = JSON.parse(JSON.stringify(cases[0])); c.selfTest.wrong = []; assert.ok(KP.validateCase(c).length > 0); });

console.log('Doğrulayıcı ayrıntıları');
t('pin noktası: yakın ama dışarıda "near" verir', function () { var c = cases[0], r = KP.types.pin.validate(c, { lat: 37.0, lon: 36.8 }); assert.ok(!r.ok && r.detail.near, JSON.stringify(r)); });
t('sayı: yön yanlışsa dirOk=false', function () { var c = cases.filter(function (x) { return x.id === 'dunya-01-gunes-acisi-enlem'; })[0], r = KP.types.number.validate(c, { raw: '42', dir: 'G' }); assert.ok(!r.ok && r.detail.dirOk === false); });
t('sayı: derece-dakika girişi kabul edilir', function () { var c = cases.filter(function (x) { return x.id === 'dunya-01-gunes-acisi-enlem'; })[0]; assert.ok(KP.types.number.validate(c, { raw: '42°', dir: 'K' }).ok); assert.ok(KP.types.number.validate(c, { raw: '41°50′', dir: 'K' }).ok); assert.ok(!KP.types.number.validate(c, { raw: '41°20′', dir: 'K' }).ok); });
t('rota (harita): sırayla uğranmazsa kaçırılan ara nokta bildirilir', function () { var c = cases.filter(function (x) { return x.id === 'ulasim-01-dogu-koridoru-rota'; })[0]; var r = KP.types.route.validate(c, { points: [{ lat: 39.93, lon: 32.86 }, { lat: 40.6, lon: 43.09 }] }); assert.ok(!r.ok && r.detail.missed.length > 0); });
t('rota (harita): yasak daire kesilirse ihlal bildirilir', function () {
  var c = JSON.parse(JSON.stringify(cases.filter(function (x) { return x.id === 'ulasim-01-dogu-koridoru-rota'; })[0]));
  c.board.waypoints = []; c.board.forbidden = [{ lat: 40.4, lon: 36, radiusKm: 60, name: 'Fırtına hücresi' }];
  var r = KP.types.route.validate(c, { points: [{ lat: 39.93, lon: 32.86 }, { lat: 40.6, lon: 43.09 }] });
  assert.ok(r.detail.hit.indexOf('Fırtına hücresi') >= 0, JSON.stringify(r.detail));
});
t('karar: geçersiz yol reddedilir', function () { var c = cases.filter(function (x) { return x.id === 'afet-01-deprem-karar'; })[0]; assert.ok(!KP.types.decision.validate(c, ['s2b']).ok); assert.ok(KP.types.decision.validate(c, ['s1b']).detail.incomplete); });

console.log('Arayüz akışları (sahte DOM)');
var A = { calls: [], setMapMode: function (m) { A.calls.push('mode:' + m); }, enableMapPick: function (cb) { A.pick = cb; }, disableMapPick: function () { A.pick = null; }, addMarker: function () {}, clearMarkers: function () {}, drawRoute: function (p) { A.route = p; }, clearRoute: function () {}, showEndpoints: function () {},
  setCamera: function () {}, radioShow: function (l) { A.radio = l; }, flash: function (k) { A.flashed = k; }, setBattery: function (b) { A.battery = b; }, setCoins: function (j) { A.coins = j; }, openNotebookPage: function (n) { A.page = n; } };
KP.scene = A;
function hintOk() { KP.engine.hint(); if (KP.ui.speakEnd) KP.ui.speakEnd(); }
function start(id) { KP.engine.reset(); KP.engine.cases = {}; KP.engine.order = []; KP.engine.addCases(cases); assert.ok(KP.engine.startCase(id)); return KP.ui.refs; }
function inputs() { return H.find(KP.ui.P, function (n) { return n.tag === 'input'; }); }
t('sayı vakası: yanlış cevap pili düşürür, doğru jeton verir', function () {
  var r = start('harita-01-olcek-km'), inp = inputs()[0];
  assert.strictEqual(r.bSub.disabled, true);
  inp.value = '5'; inp.fire('input'); assert.strictEqual(r.bSub.disabled, false);
  KP.engine.submit(); assert.strictEqual(KP.engine.state.battery, 95); assert.strictEqual(A.flashed, 'wrong');
  inp.value = '20 km'; inp.fire('input'); KP.engine.submit();
  assert.strictEqual(KP.engine.finished, true); assert.strictEqual(A.flashed, 'right');
  assert.strictEqual(KP.engine.state.jeton, 3 + 2 - 1, 'ikinci denemede ödül 1 azalır: ' + KP.engine.state.jeton);
});
t('ipucu jeton harcar ve bitince uyarır', function () { start('harita-01-olcek-km'); hintOk(); assert.strictEqual(KP.engine.state.jeton, 2); hintOk(); hintOk(); assert.strictEqual(KP.engine.state.jeton, 1); });
t('ilk denemede ipucusuz doğru bonus verir', function () { start('harita-01-olcek-km'); inputs()[0].value = '20'; inputs()[0].fire('input'); KP.engine.submit(); assert.strictEqual(KP.engine.state.jeton, 3 + 2 + 1); });
t('pil bitince gönderme kilitlenir, yedek pil verir', function () {
  start('harita-01-olcek-km'); var inp = inputs()[0]; inp.value = '1'; inp.fire('input');
  for (var i = 0; i < 20; i++) KP.engine.submit();
  assert.strictEqual(KP.engine.state.battery, 0); assert.strictEqual(KP.ui.refs.bRef.hidden, false);
  KP.engine.state.jeton = 0; KP.engine.refill(); assert.strictEqual(KP.engine.state.battery, 20);
});
t('seçenek kartı: kart seçilir, eleme ipucu kartı kapatır', function () {
  var r = start('ic-01-sarsinti-kart'), cards = H.find(KP.ui.P, function (n) { return n.tag === 'button' && H.hasClass(n, 'kp-card'); });
  assert.strictEqual(cards.length, 4); hintOk(); hintOk();
  var gone = cards.filter(function (c) { return /kp-gone/.test(c.attrs['class']); }); assert.strictEqual(gone.length, 1);
  cards[0].fire('click'); assert.strictEqual(KP.ui.refs.bSub.disabled, false); KP.engine.submit(); assert.strictEqual(KP.engine.finished, true);
});
t('grafik (aylar): sütunlara dokunarak seçim yapılır', function () {
  start('iklim-03-kurak-aylar-grafik');
  [6, 7, 8].forEach(function (m) { var hit = H.find(KP.ui.P, function (n) { return n.tag === 'rect' && n.attrs['aria-label'] === KP.MONTHS[m - 1]; })[0]; hit.fire('click'); });
  assert.deepStrictEqual(KP.engine.ctrl.getAnswer().months.slice().sort(), [6, 7, 8]); KP.engine.submit(); assert.strictEqual(KP.engine.finished, true);
});
t('grafik (seçim): piramit ve seçenekler çizilir', function () { start('goc-02-piramit-grafik'); assert.ok(H.find(KP.ui.P, function (n) { return n.tag === 'rect' && H.hasClass(n, 'kp-pbar'); }).length >= 10); });
t('pin: haritaya dokunma cevabı doldurur', function () {
  start('iklim-01-akdeniz-pin'); assert.ok(A.pick); A.pick({ lat: 36.9, lon: 30.7, zone: 'akdeniz' }); assert.strictEqual(KP.ui.refs.bSub.disabled, false); KP.engine.submit(); assert.strictEqual(KP.engine.finished, true);
});
t('rota (harita): noktalar eklenir ve çizilir', function () {
  start('ulasim-01-dogu-koridoru-rota');
  [[39.93, 32.86], [38.73, 35.49], [39.75, 37.02], [39.9, 41.27], [40.6, 43.09]].forEach(function (p) { A.pick({ lat: p[0], lon: p[1], zone: 'karasal' }); });
  assert.strictEqual(A.route.length, 5); KP.engine.submit(); assert.strictEqual(KP.engine.finished, true);
});
t('rota (kontur): panoya tıklayarak rota çizilir', function () {
  start('harita-02-esyukselti-rota'); var svg = H.find(KP.ui.P, function (n) { return n.tag === 'svg'; })[0];
  [[0.1, 0.85], [0.5, 0.93], [0.9, 0.85], [0.9, 0.15]].forEach(function (p) { svg.fire('click', { clientX: p[0] * 360, clientY: p[1] * 360 }); });
  KP.engine.submit(); assert.strictEqual(KP.engine.finished, true);
});
t('karar: iki adımlı yol tıklanır, son seçenek otomatik gönderir', function () {
  KP.config.stepDelayMs = 0; start('afet-01-deprem-karar');
  function click(id) { H.find(KP.ui.P, function (n) { return n.tag === 'button' && n.attrs['data-id'] === id; })[0].fire('click'); }
  click('s1b'); click('s2b');
  assert.deepStrictEqual(KP.engine.ctrl.getAnswer(), ['s1b', 's2b']); assert.strictEqual(KP.engine.finished, true); assert.strictEqual(A.flashed, 'right');
  KP.config.stepDelayMs = 0; start('afet-01-deprem-karar'); click('s1a');
  assert.strictEqual(KP.engine.finished, false); assert.strictEqual(KP.engine.state.battery, 95); assert.strictEqual(KP.engine.ctrl.getAnswer().length, 0, 'yanlış karardan sonra baştan başlar');
  KP.config.stepDelayMs = 600;
});
t('doğru çözülen vaka çözülmüş olarak kaydedilir ve sonraki vaka seçilir', function () {
  start('harita-01-olcek-km'); inputs()[0].value = '20'; inputs()[0].fire('input'); KP.engine.submit();
  assert.ok(KP.engine.state.solved['harita-01-olcek-km']); var n = KP.engine.pickNext(KP.engine.cur); assert.ok(n && n.id !== 'harita-01-olcek-km');
});

console.log('Duyarlılık (bozulursa test yakalamalı)');
t('cevap anahtarı bozulursa selfTest yakalar', function () {
  ['dunya-01-gunes-acisi-enlem', 'ic-01-sarsinti-kart', 'afet-01-deprem-karar', 'iklim-03-kurak-aylar-grafik', 'ulasim-01-dogu-koridoru-rota', 'harita-02-esyukselti-rota', 'iklim-01-akdeniz-pin'].forEach(function (id) {
    var c = JSON.parse(JSON.stringify(cases.filter(function (x) { return x.id === id; })[0]));
    if (c.type === 'number') c.answer.value += 10; else if (c.type === 'cards') c.answer.correct = ['c']; else if (c.type === 'decision') c.answer.okEndings = ['bad'];
    else if (c.type === 'graph') c.answer.months = [1, 2]; else if (c.type === 'pin') c.answer.zone = 'sert';
    else if (c.board.mode === 'map') c.board.maxLengthKm = 100; else c.board.maxAscentM = 5;
    assert.ok(KP.runSelfTest(c).length > 0, id + ' bozulduğu hâlde testler geçti');
  });
});

console.log('İpucu: kime sorulur, kamera');
t('ipucu: uzmana sorulursa verir, kamera ona döner, Okudum ile geri gelir; okunmadan ikinci ipucu alınamaz', function () {
  var cams = [], oldSet = A.setCamera, oldGet = A.getCamera; A.getCamera = function () { return 'telsiz'; }; A.setCamera = function (n) { cams.push(n); };
  start('harita-01-olcek-km'); cams.length = 0; assert.strictEqual(KP.engine.helperOf(KP.engine.cur), 'ayse');
  var j0 = KP.engine.state.jeton; KP.engine.hint('ayse'); assert.strictEqual(cams[0], 'ayse'); assert.strictEqual(KP.engine.state.jeton, j0 - 1); assert.ok(KP.ui.speakEnd, 'altyazı yok');
  KP.engine.hint('nuri'); assert.strictEqual(KP.engine.state.jeton, j0 - 1, 'okunmadan ikinci istek işlendi');
  KP.ui.speakEnd(); assert.strictEqual(cams[cams.length - 1], 'telsiz'); assert.ok(!KP.engine.hintBusy);
  A.setCamera = oldSet; A.getCamera = oldGet;
});
t('ipucu: uzman olmayana sorulursa ücretsiz yönlendirir, ipucu harcanmaz', function () {
  start('harita-01-olcek-km'); var j = KP.engine.state.jeton; KP.engine.hint('nuri'); assert.strictEqual(KP.engine.state.jeton, j); assert.strictEqual(KP.engine.hintsUsed, 0); KP.ui.speakEnd();
  start('ic-01-sarsinti-kart'); assert.strictEqual(KP.engine.helperOf(KP.engine.cur), 'nuri'); KP.engine.hint('ayse'); assert.strictEqual(KP.engine.hintsUsed, 0); KP.ui.speakEnd();
  KP.engine.hint('nuri'); assert.strictEqual(KP.engine.hintsUsed, 1); KP.ui.speakEnd();
});
console.log('Plan uyumu');
t('pin: alternatif hedeflerden biri doğru sayılır (karst)', function () {
  var c = cases.filter(function (x) { return x.id === 'dis-02-karst-pin'; })[0];
  assert.ok(c.answer.alts.length >= 2);
  assert.ok(KP.types.pin.validate(c, { lat: 37.8, lon: 30.7 }).ok); assert.ok(KP.types.pin.validate(c, { lat: 36.7, lon: 33 }).ok); assert.ok(!KP.types.pin.validate(c, { lat: 41, lon: 40.5 }).ok);
});
t('plan: 45 plan vakasının hepsi yazılmış, id, konu, tür ve zorluk planla aynı', function () {
  var plan = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'vaka_plani.json'), 'utf8')), list = plan.vakalar || plan.plan || [], bad = [];
  assert.strictEqual(list.length, 45);
  list.forEach(function (p) { var c = cases.filter(function (x) { return x.id === p.id; })[0]; if (!c) bad.push(p.id + ' yok'); else if (c.topic !== p.konu || c.type !== p.tur || c.difficulty !== p.zorluk) bad.push(p.id + ' konu/tür/zorluk farklı'); });
  assert.deepStrictEqual(bad, []);
});
setTimeout(function () {
  console.log('\n' + pass + ' geçti, ' + fail + ' kaldı');
  process.exit(fail ? 1 : 0);
}, 50);
