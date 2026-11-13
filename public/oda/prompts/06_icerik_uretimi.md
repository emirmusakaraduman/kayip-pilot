# Adım 6: içerik (konu başına 3 vaka)

Aşağıdaki şablonu **her konu için ayrı ayrı** kullan. `[KONU]` yerine konu kodunu yaz.

---
`[KONU]` konusu için **3 vaka** yaz (1 kolay, 1 orta, 1 zor), `data/vakalar/[KONU].json` dosyasına, `docs/VAKA_SEMASI.md` biçiminde.

Kurallar:
- Cevap türü yalnızca bu konuya izin verilenlerden (`KP.TYPE_TOPICS`). Konuda birden çok tür izinliyse çeşitlendir.
- `docs/ICERIK_KURALLARI.md`'ye tam uy: Deniz cevabı söylemez, ipucu merdiveni, `explain` en çok 2 cümle, yanlış kartlarda `why`.
- Vakalar birbirinden farklı kavramları ölçsün, aynı sorunun üç versiyonu olmasın.
- Her vakaya `selfTest` (en az 1 doğru, 1 yanlış) ve `source` yaz. **Emin olmadığın bilgiyi uydurma**, `dogrulanacak` yaz.
- Zor vakada çok adımlı çıkarım ya da yanıltıcı bir ipucu olsun.
- Haritadaki iklim bölgeleri yalnızca: ılıman karasal (`karasal`), Akdeniz, Karadeniz, sert karasal (`sert`).
- Yükselti/eğim gerektiriyorsa eş yükselti panosu (sentetik arazi) kullan.

Bitince sırayla çalıştır ve çıktıları göster:
`node tools/build_vakalar.js && node tests/run.js && node tests/coverage.js`

Sonra bana şunları ver: yazdığın 3 vakanın id ve başlığı, `dogrulanacak` olanların listesi ve neyin kontrol edilmesi gerektiği.
---

Konu sırası önerisi (kapsama tablosundaki boş hücrelere göre): kayaclar-topraklar, turkiye-yer-sekilleri-iklimi, ekonomik-faaliyetler, ic-kuvvetler, dis-kuvvetler, su-kaynaklari, nufus-yerlesme, iklim-elemanlari, dunya-sekli-hareketleri, cografi-konum, harita-bilgisi, goc, ulasim, dogal-afetler, iklim-tipleri. `data/vakalar/ornek_vakalar.json` içindeki 19 vaka korunur, dosyaya dokunma; yenileri ayrı dosyaya yazılır (id çakışmasın).
