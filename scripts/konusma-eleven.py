"""DENİZ'in telsiz satırlarını ElevenLabs sesiyle üretir; MERKEZ satırlarına dokunmaz (konusma-uret.py ile gelenler kalır).
Kullanım (anahtar repoya yazılmaz, ortam değişkeniyle verilir):
  PowerShell:  $env:ELEVENLABS_API_KEY = "..."; python scripts/konusma-eleven.py
  İsteğe bağlı: ELEVENLABS_VOICE_ID (varsayılan aşağıdaki), TUM=1 → MERKEZ satırlarını da bu sesle üretir.
Çıktı: public/ses/konusma/k{n}.mp3 (sıra, src/cinematic/timeline.ts ALTYAZILAR ile aynı)."""
import json, os, pathlib, sys, urllib.request

SES = os.environ.get('ELEVENLABS_VOICE_ID', 'N2lVS1w4EtoT3dr4eOWO')
ANAHTAR = os.environ.get('ELEVENLABS_API_KEY')
CIKTI = pathlib.Path(__file__).resolve().parent.parent / 'public/ses/konusma'
TUM = os.environ.get('TUM') == '1'
# (indeks, kim, metin) — timeline.ts ile aynı; "..." duraklama için bırakıldı
SATIRLAR = [
    (0, 'MERKEZ', 'TC-KRT, burası Merkez. Tıbbi malzeme uçuşunuz radarda, rota normal.'),
    (1, 'DENİZ', 'Mayday, mayday! ... Sol motor yangını!'),
    (2, 'DENİZ', 'Yangın büyüyor, kuyruk kontrolünü kaybediyorum!'),
    (3, 'MERKEZ', 'Deniz! ... Deniz, duyuyor musun?'),
    (4, 'DENİZ', 'Ağaçlara çarpacağım, tutun!'),
    (5, 'DENİZ', '...Merkez... beni duyan var mı?'),
    (6, 'MERKEZ', "Tüm birimler: helikopter düşmüş olabilir. Deniz'i bulmamız lazım."),
]

if not ANAHTAR:
    sys.exit('ELEVENLABS_API_KEY ortam değişkeni yok.')

CIKTI.mkdir(parents=True, exist_ok=True)
for i, kim, metin in SATIRLAR:
    if kim == 'MERKEZ' and not TUM:
        continue
    istek = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{SES}?output_format=mp3_44100_64',
        data=json.dumps({
            'text': metin,
            'model_id': 'eleven_multilingual_v2',
            'language_code': 'tr',
            'voice_settings': {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.4},
        }).encode(),
        headers={'xi-api-key': ANAHTAR, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'},
    )
    with urllib.request.urlopen(istek) as r:
        (CIKTI / f'k{i}.mp3').write_bytes(r.read())
    print('ok', i, kim)
