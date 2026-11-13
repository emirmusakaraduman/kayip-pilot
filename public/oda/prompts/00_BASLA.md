# İlk prompt (Claude Code'a yapıştır)

Bu klasör "Kayıp Pilot" telsiz odası projesi (tek sayfalık three.js sahnesi). Bir **soru sistemi** ekliyoruz: masadaki iklim haritası artık tek soruya ait değil. Soru tipleri **konu konu, vaka vaka değişecek** ve şu altı yöntemle çözülecek: haritaya pin, sayı girişi, seçenek kartı, rota çizme, karar verme, grafik okuma. Haritayla çözülmeyen türlerde masadaki harita gizlenecek.

Önce şunları oku (bu sırayla), sonra bana kısaca özetle:
1. `CLAUDE.md` (özellikle "SORU SİSTEMİ" bölümü ve `data/` klasörünü açma kuralı)
2. `docs/PLAN.md` (mimari, KPScene sözleşmesi, adımlar, kurallar)
3. `docs/VAKA_SEMASI.md` ve `docs/ICERIK_KURALLARI.md`
4. `src/questions/engine.js` ve `src/questions/types/*.js` (hazır, çalışan kod)
5. `main.js` içinde yalnızca şu bölümler: "telsiz" (~445-580), "Türkiye iklim haritası" (~251-415), "etkileşim" (~1392-1455), "HUD" (~1455-1504), "animasyon döngüsü" (~1596+).

Sonra:
- `node tests/run.js` çalıştır, sonucu bildir (79 test yeşil olmalı).
- Sahneyi `npx serve` ile aç ve çalıştığını doğrula. **Hiçbir şeyi değiştirmeden.**

Çalışma şekli:
- `docs/PLAN.md`'deki adımları **sırayla** yap. Her adımdan önce ne yapacağını bir paragrafla söyle, bitince nasıl test ettiğini ve sonucu bildir.
- Her adımın sonunda `node tests/run.js` yeşil olmalı. Yeşil değilse devam etme.
- Motor, doğrulayıcılar ve vaka şeması hazır ve test edilmiş: **davranışlarını değiştirme**. Eksik ya da hatalı bulursan önce bana söyle, neden gerektiğini yaz.
- Sahnenin mevcut görünümünü (oda, ışık, karakterler, harita dokusu, kamera, defter) bozma.
- Coğrafya bilgisi uydurma. Emin olmadığın vakaya `source.status: "dogrulanacak"` yaz.
- Yeni kütüphane ekleme, framework'e geçme.

İlk görev: **Adım 0 ve Adım 1** (köprü ve pin türü). Bitince dur ve rapor ver.
