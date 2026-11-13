# Adım 5: jeton, yanlış defteri, defter sayfaları, kalıcılık

Görev: oyunun ekonomisini sahneye bağla.

Yapılacaklar:
1. `setCoins(n)`: jeton kavanozunun camındaki "N jeton" etiketini canlı güncelle (canvas dokusu yeniden çiz).
2. Defter: doğru çözülen vakanın `reward.notebookPage` sayfası açılsın (`openNotebookPage`). Sayfa metinleri `data/defter/sayfalar.json` dosyasından (`{ "5": "Deniz'in not defteri metni" }`), `docs/ICERIK_KURALLARI.md` diline uygun, sayfa başına en çok 280 karakter. İlk 4 sayfa mevcut metinlerle kalsın.
3. Yanlış defteri: `KP.engine.state.wrong` listesinden, defterde "Yanlış defteri" bölümü (vaka başlığı + `feedback.explain`). Aynı vaka tekrar doğru çözülünce listeden düşsün.
4. Pil bitince ekranda belirgin uyarı ve "Pili doldur" akışı (`KP.config`: 2 jeton, jeton yoksa %20 yedek).

Kabul: [ ] jeton etiketi güncelleniyor, [ ] sayfa yenilenince her şey korunuyor, [ ] defterde yeni sayfa ve yanlış defteri görünüyor, [ ] testler yeşil.
