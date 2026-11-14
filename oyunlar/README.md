# Diğer oyunlar buraya

Oyun merkezi, bu klasörün içindeki her alt klasörü bir oyun olarak yayınlar.

```
oyunlar/
  oyun-2/        →  https://<site>/oyun-2/
    index.html
    assets/...
  oyun-3/        →  https://<site>/oyun-3/
```

## Arkadaşlar için adımlar

1. **Oyununu derle.** Çıktı, `index.html` içeren hazır bir klasör olmalı (Vite/React için `dist`, Unity WebGL için `Build` klasörünün dışa aktarımı, düz HTML/JS ise kendi klasörün).
2. **Dosya yollarını göreli yap.** Oyun `https://<site>/oyun-2/` altında çalışır, sitenin kökünde değil. Bu yüzden dosya yolları `/assets/x.png` yerine `./assets/x.png` olmalı.
   - Vite: `vite.config` içine `base: './'` ekle.
   - Create React App: `package.json` içine `"homepage": "."` ekle.
   - Düz HTML: `src="/resim.png"` yerine `src="resim.png"` yaz.
3. **Klasörü buraya kopyala:** `oyunlar/oyun-2/` (adını istediğin gibi seçebilirsin, küçük harf ve tire kullan).
4. **Listeye ekle:** `merkez/oyunlar.js` dosyasında kendi oyununun kutusundaki `yakinda: true` satırını sil, `ad`, `aciklama`, `etiketler`, `yapimci` alanlarını doldur, kapak görselini `merkez/gorseller/` altına koy ve `gorsel` alanına yaz.
5. **Dene:** `npm run site` ile siteyi kur, sonra `npx serve site` ile aç.
6. Değişiklikleri GitHub'a gönder. Vercel siteyi yeniden kurar.

## Oyundan merkeze dönüş

Oyununun bir köşesine şu bağlantıyı koyman yeter:

```html
<a href="/">← Oyun Merkezi</a>
```

## İpuçları

- Her oyun kendi adresinde çalıştığı için `localStorage` kayıtları birbirine karışmaz. Yine de anahtar adına oyunun adını ekle (`oyun2-kayit` gibi).
- Dosyalar büyükse (modeller, sesler) toplam site boyutuna dikkat et; tek dosya 100 MB'ı geçmemeli.
- Üçüncü taraf görsel, ses ve modellerin lisansını ve yazarını oyununun içinde ya da `CREDITS` dosyasında belirt.
