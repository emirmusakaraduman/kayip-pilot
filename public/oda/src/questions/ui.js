/* Vaka paneli (HTML). Telsiz odasındaki 3D sahnenin üstünde, masaya yakın açılır. Haritasız türlerde sahnedeki harita gizlenir. */
(function (root) {
  'use strict';
  var KP = root.KP, U = KP.util;
  KP.ui = {
    P: null, refs: null,
    open: function (c, h) {
      var doc = root.document, host = (doc.getElementById && doc.getElementById('stage')) || doc.body, self = this;
      self.close();
      var P;
      var head = U.el('div', { class: 'kp-head' }, [
        U.el('span', { class: 'kp-topic', text: KP.TOPIC_NAMES[c.topic] }),
        U.el('span', { class: 'kp-diff', 'data-d': String(c.difficulty), text: ['', 'Kolay', 'Orta', 'Zor'][c.difficulty] }),
        U.el('button', { type: 'button', class: 'kp-x', 'aria-label': 'Paneli küçült ya da büyüt', text: '–', onclick: function () { P.classList.toggle('kp-min'); } })
      ]);
      var refs = {
        body: U.el('div', { class: 'kp-body' }), hints: U.el('ul', { class: 'kp-hints' }),
        fb: U.el('div', { class: 'kp-fb', role: 'status', 'aria-live': 'polite' }), status: U.el('div', { class: 'kp-status' }),
        bHint: U.el('button', { type: 'button', class: 'kp-btn', text: 'İpucu (1 jeton)', onclick: h.onHint }),
        bRef: U.el('button', { type: 'button', class: 'kp-btn', text: 'Pili doldur', onclick: h.onRefill, hidden: true }),
        bSub: U.el('button', { type: 'button', class: 'kp-btn kp-primary', text: 'Gönder', onclick: h.onSubmit, disabled: true }),
        bNext: U.el('button', { type: 'button', class: 'kp-btn kp-primary', text: 'Sonraki vaka', onclick: h.onNext, hidden: true })
      };
      P = U.el('section', { class: 'kp-panel', 'data-type': c.type, role: 'region', 'aria-label': 'Vaka paneli' }, [
        head, U.el('div', { class: 'kp-title', text: c.title }), U.el('div', { class: 'kp-q', text: c.question }),
        // telsiz kaydı: ekrandaki mesajlar kaybolsa da verilen bilgiler (saat, açı, ölçek...) panelde kalır
        U.el('details', { class: 'kp-radio', open: true }, [U.el('summary', { text: 'Telsiz kaydı' })].concat((c.radio || []).map(function (t) { return U.el('p', { text: t }); }))),
        refs.body, refs.hints, refs.fb, refs.status,
        U.el('div', { class: 'kp-row' }, [refs.bHint, refs.bRef, refs.bSub, refs.bNext])
      ]);
      host.appendChild(P); self.P = P; self.refs = refs;
      return refs;
    },
    setStatus: function (battery, jeton) { if (this.refs) this.refs.status.textContent = 'Telsiz pili %' + battery + ' · ' + jeton + ' jeton'; },
    setFeedback: function (kind, text) { if (!this.refs) return; this.refs.fb.setAttribute('class', 'kp-fb kp-' + kind); this.refs.fb.textContent = text; },
    addHint: function (from, text) { if (this.refs) this.refs.hints.appendChild(U.el('li', {}, [U.el('strong', { text: (from === 'nuri' ? 'Nuri: ' : 'Ayşe: ') }), text])); },
    // sahne üstünde kısa bilgi/uyarı şeridi (harita yüklenmedi, kayıt kapalı, vaka kalmadı...). Tıklayınca ya da 9 sn sonra kapanır.
    note: function (text) {
      var doc = root.document, host = (doc.getElementById && doc.getElementById('stage')) || doc.body, n;
      n = U.el('div', { class: 'kp-note', role: 'status', 'aria-live': 'polite', tabindex: '0', text: text, onclick: function () { if (n.parentNode) n.parentNode.removeChild(n); } });
      host.appendChild(n); if (root.setTimeout) root.setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 9000);
      return n;
    },
    close: function () { if (this.P && this.P.parentNode) this.P.parentNode.removeChild(this.P); this.P = null; this.refs = null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
