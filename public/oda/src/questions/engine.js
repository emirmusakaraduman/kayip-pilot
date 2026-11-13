/* Soru motoru: vakayı yükler, türe göre arayüzü kurar, cevabı doğrular, pil/jeton/ipucu/yanlış defteri ekonomisini yürütür. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  var CFG = KP.config = { wrongCost: 5, hintCost: 1, refillCost: 2, baseJeton: 2, noHintBonus: 1, repeatJeton: 1, startBattery: 100, startJeton: 3, emergencyBattery: 20, stepDelayMs: 600, saveKey: 'kp_save_v1' };
  var E = KP.engine = { active: false, cases: {}, order: [], cur: null, ctrl: null, attempts: 0, hintsUsed: 0, finished: false,
    state: { battery: CFG.startBattery, jeton: CFG.startJeton, solved: {}, wrong: [], pages: {} } };

  function S(name) { var s = KP.scene || root.KPScene; if (s && typeof s[name] === 'function') return s[name].apply(s, Array.prototype.slice.call(arguments, 1)); }
  function adapter() { return KP.scene || root.KPScene || {}; }

  /* ---------- vaka doğrulama (yeni vaka yazarken zorunlu) ---------- */
  KP.validateCase = function (c) {
    var e = [], t = KP.types[c && c.type];
    if (!c) return ['vaka boş'];
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id || '')) e.push('id: küçük harf ve tire (kebab-case) olmalı');
    if (!KP.TOPIC_NAMES[c.topic]) e.push('topic geçersiz: ' + c.topic);
    if ([1, 2, 3].indexOf(c.difficulty) < 0) e.push('difficulty 1, 2 ya da 3 olmalı');
    if (!t) { e.push('type geçersiz: ' + c.type); return e; }
    if (KP.TYPE_TOPICS[c.type].indexOf(c.topic) < 0) e.push('"' + c.type + '" cevap türü "' + c.topic + '" konusuna uymuyor (tasarım tablosuna bak)');
    if (!c.title || c.title.length > 60) e.push('title gerekli (en çok 60 karakter)');
    if (!Array.isArray(c.radio) || !c.radio.length || c.radio.length > 4) e.push('radio: 1-4 telsiz mesajı');
    else c.radio.forEach(function (m) { if (typeof m !== 'string' || !m.trim()) e.push('radio mesajı boş'); else if (m.length > 240) e.push('radio mesajı çok uzun (en çok 240 karakter): ' + m.slice(0, 30)); });
    if (!c.question || c.question.length > 140) e.push('question gerekli (en çok 140 karakter)');
    if (!Array.isArray(c.hints) || c.hints.length < 2 || c.hints.length > 3) e.push('hints: 2-3 ipucu (Nuran ya da Fatma)');
    else c.hints.forEach(function (h, i) { if (['nuri', 'ayse'].indexOf(h.from) < 0) e.push('hints[' + i + '].from nuri|ayse'); if (!h.text || h.text.length > 200) e.push('hints[' + i + '].text gerekli (en çok 200 karakter)'); });
    var f = c.feedback || {};
    ['correct', 'wrong', 'explain'].forEach(function (k) { if (!f[k]) e.push('feedback.' + k + ' gerekli'); });
    if (f.explain && f.explain.length > 280) e.push('feedback.explain en çok 280 karakter (2 cümle)');
    if (!c.reward || typeof c.reward.jeton !== 'number' || c.reward.jeton < 1 || c.reward.jeton > 4) e.push('reward.jeton 1-4 arası olmalı');
    if (!c.source || ['dogrulandi', 'dogrulanacak'].indexOf(c.source.status) < 0) e.push('source.status dogrulandi|dogrulanacak');
    if (!c.selfTest || !c.selfTest.correct || !c.selfTest.correct.length || !c.selfTest.wrong || !c.selfTest.wrong.length) e.push('selfTest.correct ve selfTest.wrong dolu olmalı');
    if (e.length === 0 || t.checkCase) e = e.concat(t.checkCase ? t.checkCase(c) : []);
    return e;
  };
  // Vakanın kendi örnek cevaplarıyla doğrulayıcıyı sınar (doğru örnekler geçmeli, yanlışlar kalmalı).
  KP.runSelfTest = function (c) {
    var e = [], t = KP.types[c.type];
    (c.selfTest.correct || []).forEach(function (a, i) { var r = t.validate(c, a); if (!r.ok) e.push('selfTest.correct[' + i + '] doğru sayılmadı'); });
    (c.selfTest.wrong || []).forEach(function (a, i) { var r = t.validate(c, a); if (r.ok) e.push('selfTest.wrong[' + i + '] yanlış olmalıydı ama doğru sayıldı'); });
    return e;
  };

  /* ---------- kayıt ---------- */
  E.save = function () { try { root.localStorage && root.localStorage.setItem(CFG.saveKey, JSON.stringify(E.state)); } catch (x) {} };
  E.load = function () {
    try { var s = root.localStorage && root.localStorage.getItem(CFG.saveKey); if (s) { var o = JSON.parse(s); if (o && typeof o.battery === 'number') E.state = Object.assign(E.state, o); } } catch (x) {}
  };
  E.reset = function () { E.state = { battery: CFG.startBattery, jeton: CFG.startJeton, solved: {}, wrong: [], pages: {} }; E.save(); };

  E.addCases = function (arr) { arr.forEach(function (c) { E.cases[c.id] = c; if (E.order.indexOf(c.id) < 0) E.order.push(c.id); }); };

  E.pickNext = function (after) {
    var ids = E.order.filter(function (id) { return !E.state.solved[id] && (!after || id !== after.id); });
    var same = ids.filter(function (id) { return after && E.cases[id].topic === after.topic; });
    var pool = same.length ? same : ids;
    pool.sort(function (a, b) { return E.cases[a].difficulty - E.cases[b].difficulty; });
    return pool.length ? E.cases[pool[0]] : null;
  };

  /* ---------- akış ---------- */
  E.startCase = function (id) {
    var c = E.cases[id]; if (!c) return false;
    E.stop(true);
    E.cur = c; E.attempts = 0; E.hintsUsed = 0; E.finished = false; E.active = true;
    var T = KP.types[c.type], needsMap = typeof T.mapNeeded === 'function' ? T.mapNeeded(c) : !!T.mapNeeded;
    S('setMapMode', needsMap ? 'neutral' : 'hidden', c.board || {});
    S('setCamera', needsMap ? 'harita' : 'telsiz');
    S('radioShow', c.radio);
    var refs = KP.ui.open(c, { onHint: E.hint, onSubmit: E.submit, onNext: E.next, onRefill: E.refill });
    E.ctrl = T.mount({ host: refs.body, case: c, adapter: adapter(), changed: E.refresh, submit: E.submit });
    S('setBattery', E.state.battery); S('setCoins', E.state.jeton);
    E.refresh(); KP.emit('start', c);
    return true;
  };
  E.refresh = function () {
    var r = KP.ui.refs; if (!E.cur || !r) return;
    r.bSub.disabled = E.finished || !E.ctrl || !E.ctrl.isReady() || E.state.battery <= 0;
    r.bHint.disabled = r.bHint2.disabled = E.finished || !!E.hintBusy;
    r.bRef.hidden = !(E.state.battery <= 0 && !E.finished);
    KP.ui.setStatus(E.state.battery, E.state.jeton);
  };
  function describe(c, res) {
    var d = res.detail || {}, m = [];
    if (c.type === 'pin' && c.answer.mode === 'point') m.push(d.near ? 'Yakınsın ama biraz uzak.' : 'Seçtiğin yer Deniz’den epey uzak.');
    if (c.type === 'pin' && c.answer.mode === 'zone') m.push('Seçtiğin bölge bu ipuçlarına uymuyor.');
    if (c.type === 'number') { if (d.dirOk === false) m.push('Yönü (K/G ya da D/B) kontrol et.'); else if (d.near) m.push('Yaklaştın, hesabı bir daha kontrol et.'); }
    if (c.type === 'route') {
      if (d.startOk === false) m.push('Rota başlangıç noktasından başlamıyor.');
      if (d.endOk === false) m.push('Rota Deniz’in olduğu yere varmıyor.');
      if (d.hit && d.hit.length) m.push('Rota şu bölgeye giriyor: ' + d.hit.join(', ') + '.');
      if (d.missed && d.missed.length) m.push('Şu noktadan geçmedin: ' + d.missed.join(', ') + '.');
      if (d.lengthOk === false) m.push('Rota çok uzun (' + d.lengthKm + ' km).');
      if (d.ascentOk === false) m.push('Rota çok fazla tırmanıyor (' + d.stats.ascentM + ' m, sınır ' + c.board.maxAscentM + ' m).');
      if (d.gradeOk === false) m.push('Rota yer yer çok dik.');
      if (d.tooMany) m.push('Çok fazla nokta kullandın.');
    }
    if (d.why && d.why.length) m = m.concat(d.why);
    if (c.type === 'decision' && d.notes && d.notes.length) m.push(d.notes[d.notes.length - 1]);
    return m.join(' ');
  }
  E.submit = function () {
    var c = E.cur, r = KP.ui.refs;
    if (!c || E.finished || !E.ctrl || !r) return null;
    if (E.state.battery <= 0) { KP.ui.setFeedback('wrong', 'Telsizin pili bitti. Pili doldurmadan cevap gönderemezsin.'); E.refresh(); return null; }
    if (!E.ctrl.isReady()) return null;
    var ans = E.ctrl.getAnswer(), res = KP.types[c.type].validate(c, ans);
    E.attempts++;
    if (res.ok) {
      var again = !!E.state.solved[c.id], gain = again ? CFG.repeatJeton : c.reward.jeton;
      if (!again) { if (E.attempts > 1) gain = Math.max(1, gain - (E.attempts - 1)); else if (E.hintsUsed === 0) gain += CFG.noHintBonus; }
      E.state.jeton += gain; E.state.solved[c.id] = (E.state.solved[c.id] || 0) + 1;
      if (c.reward.notebookPage) E.state.pages[c.reward.notebookPage] = 1;
      E.finished = true; E.ctrl.lock(true);
      KP.ui.setFeedback('right', c.feedback.correct + ' ' + c.feedback.explain + ' (+' + gain + ' jeton)');
      r.bNext.hidden = false; r.bSub.hidden = true; r.bHint.disabled = r.bHint2.disabled = true;
      S('flash', 'right'); S('radioShow', [c.feedback.correct]); S('setCoins', E.state.jeton);
      if (c.reward.notebookPage) S('openNotebookPage', c.reward.notebookPage);
      E.save(); E.refresh(); KP.emit('correct', { case: c, attempts: E.attempts, hints: E.hintsUsed, gain: gain });
    } else {
      E.state.battery = Math.max(0, E.state.battery - CFG.wrongCost);
      E.state.wrong.push({ id: c.id, at: Date.now() }); if (E.state.wrong.length > 100) E.state.wrong.shift();
      var msg = c.feedback.wrong, more = describe(c, res);
      if (more) msg += ' ' + more;
      if (E.attempts >= 2) msg += ' ' + c.feedback.explain;
      if (E.state.battery <= 0) msg += ' Telsizin pili bitti.';
      KP.ui.setFeedback('wrong', msg);
      S('flash', 'wrong'); S('setBattery', E.state.battery);
      if (E.ctrl.reset && c.type === 'decision') E.ctrl.reset();
      E.save(); E.refresh(); KP.emit('wrong', { case: c, attempts: E.attempts, detail: res.detail });
    }
    return res;
  };
  // Hangi karakter hangi konuda iyi: Fatma haritacı (harita, konum, rota), Nuran diğer konular. Vakada helper:'nuri'|'ayse' ile ezilebilir.
  E.helperOf = function (c) {
    if (c.helper === 'nuri' || c.helper === 'ayse') return c.helper;
    return (c.type === 'pin' || c.type === 'route' || c.topic === 'cografi-konum' || c.topic === 'harita-bilgisi') ? 'ayse' : 'nuri';
  };
  var NAME = { nuri: 'Nuran', ayse: 'Fatma' };
  // who: ipucu istenen karakter. Alanı onunsa ipucu verir (jeton düşer); değilse "benim alanım değil" der (ücretsiz, ipucu harcanmaz).
  E.hint = function (who) {
    var c = E.cur; if (!c || E.finished || E.hintBusy) return;
    if (who !== 'nuri' && who !== 'ayse') who = E.helperOf(c);
    var h = c.hints[E.hintsUsed], expert = E.helperOf(c), prevCam = S('getCamera'), text, paid = false;
    if (who !== expert) {
      text = who === 'ayse' ? 'Bu harita sorusu değil, benim alanım değil. Nuran’a sor, o bu konuda daha iyi.' : 'Bu bir harita sorusu, o Fatma’nın alanı. Fatma’ya sor.';
    } else {
      if (!h) { KP.ui.setFeedback('info', 'Başka ipucu kalmadı.'); return; }
      var cost = h.cost != null ? h.cost : CFG.hintCost;
      if (E.state.jeton < cost) { KP.ui.setFeedback('info', 'İpucu için yeterli jetonun yok.'); return; }
      E.state.jeton -= cost; E.hintsUsed++; paid = true; text = h.text;
      KP.ui.addHint(who, text); if (E.ctrl && E.ctrl.applyHint) E.ctrl.applyHint(h);
      S('setCoins', E.state.jeton); E.save();
    }
    // kamera konuşana döner, altyazı çıkar, "Okudum" ile kamera geri döner
    if (prevCam) S('setCamera', who);
    E.hintBusy = true;
    KP.ui.speak(who, text, function () { E.hintBusy = false; if (prevCam) S('setCamera', prevCam); if (E.cur) E.refresh(); });
    E.refresh();
  };
  E.refill = function () {
    if (E.state.battery > 0) return;
    if (E.state.jeton >= CFG.refillCost) { E.state.jeton -= CFG.refillCost; E.state.battery = CFG.startBattery; KP.ui.setFeedback('info', 'Pil dolduruldu (-' + CFG.refillCost + ' jeton).'); }
    else { E.state.battery = CFG.emergencyBattery; KP.ui.setFeedback('info', 'Yeterli jeton yok. Yedek jeneratör pili %' + CFG.emergencyBattery + ' seviyesine çıkardı.'); }
    S('setBattery', E.state.battery); S('setCoins', E.state.jeton); E.save(); E.refresh();
  };
  E.next = function () {
    var n = E.pickNext(E.cur);
    if (n) E.startCase(n.id);
    else { if (KP.ui.refs) KP.ui.setFeedback('info', 'Çözülmemiş vaka kalmadı. Telsiz sessiz...'); KP.emit('allDone', {}); }
  };
  E.stop = function (keepActive) {
    if (E.ctrl && E.ctrl.destroy) E.ctrl.destroy();
    E.ctrl = null; KP.ui.close(); if (!keepActive) { E.active = false; E.cur = null; }
  };
  E.start = function (topic) {
    var ids = E.order.filter(function (id) { return !E.state.solved[id] && (!topic || E.cases[id].topic === topic); });
    ids.sort(function (a, b) { return E.cases[a].difficulty - E.cases[b].difficulty; });
    return ids.length ? E.startCase(ids[0]) : false;
  };
})(typeof window !== 'undefined' ? window : globalThis);
