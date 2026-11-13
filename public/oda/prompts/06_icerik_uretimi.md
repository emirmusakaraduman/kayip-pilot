# Adım 6: içerik (45 vakalık plana göre)

Yazılacak vakaların listesi ve her birinin çözüm yöntemi hazır: `docs/VAKA_PLANI.md` (okunur) ve `data/vaka_plani.json` (makine okunur). **Konu, zorluk, cevap türü, vaka kodu, Deniz'in gözlemi, çözüm yolu ve doğru cevap planda belirlenmiştir. Planı değiştirme.** Planı değiştirmek gerekirse önce bana sor.

`node tests/coverage.js` hangi plan vakalarının henüz yazılmadığını listeler (27 vaka).

## Şablon (her konu için ayrı ayrı çalıştır; `[KONU]` yerine konu kodu)

`data/vaka_plani.json` içinde `konu: "[KONU]"` olan ve `durum: "planli"` olan vakaları `data/vakalar/[KONU].json` dosyasına yaz (`docs/VAKA_SEMASI.md` biçimi, dosya: `{ "surum": 1, "vakalar": [ ... ] }`).

Kurallar:
- Planın `id`, `konu`, `tur`, `zorluk`, `baslik` alanlarını aynen kullan. `gozlem` Deniz'in `radio` mesajlarının içeriğidir (1-4 mesaj, her biri en çok 240 karakter, Deniz'in ağzından). `parametre` alanı türe özel verilerin başlangıcıdır, eksik alanları şemaya göre tamamla.
- `docs/ICERIK_KURALLARI.md`'ye tam uy: Deniz cevabı söylemez, ipucu merdiveni (2-3 ipucu), `feedback.explain` en çok 2 cümle, yanlış kartlarda `why`, karar seçeneklerinde `note`.
- Sayı vakalarında `answer.value` planın `hesap.sonuc` değeriyle tutarlı olsun (test bunu denetler).
- Her vakaya `selfTest` (en az 1 doğru, 1 yanlış) ve `source` yaz. Planda `dogrula` alanı doluysa `source.status: "dogrulanacak"` yaz ve `note`'a o maddeyi aynen koy.
- Coğrafya bilgisi uydurma. `docs/VAKA_PLANI.md` sonundaki **Doğrulama günlüğünü** oku: `Doğrulandı` ve `Düzeltildi` bilgileri aynen kullan, `Kontrol edilmedi` bilgilerin geçtiği vakalara `source.status: "dogrulanacak"` yaz. Plan dışına çıkıp yeni bir coğrafya bilgisi eklersen onu da `dogrulanacak` işaretle.
- Grafik verisi gerçek değilse başlığında "(yaklaşık değerler)" yaz.

Bitince sırayla çalıştır ve çıktıları göster:
`node tools/build_vakalar.js && node tests/run.js && node tests/coverage.js`

Sonra bana şunları ver: yazdığın vakaların id ve başlığı, `dogrulanacak` olanların listesi ve neyin kontrol edilmesi gerektiği, plandan sapman gerekirse nedeni.

## Önerilen konu sırası
kayaclar-topraklar, turkiye-yer-sekilleri-iklimi, ekonomik-faaliyetler, dis-kuvvetler, ic-kuvvetler, su-kaynaklari, nufus-yerlesme, iklim-elemanlari, dunya-sekli-hareketleri, cografi-konum, harita-bilgisi, goc, ulasim, dogal-afetler.

`data/vakalar/ornek_vakalar.json` içindeki 19 vaka korunur, o dosyaya dokunma.
