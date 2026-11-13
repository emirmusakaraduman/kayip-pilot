"""Sinematik telsiz konuşmalarını Microsoft Edge nöral Türkçe seslerle üretir (edge-tts).
Kullanım: pip install edge-tts && python scripts/konusma-uret.py
Çıktı: public/ses/konusma/k0..k6.mp3 (sıra, src/cinematic/timeline.ts ALTYAZILAR ile aynı)."""
import asyncio, pathlib, edge_tts

CIKTI = pathlib.Path(__file__).resolve().parent.parent / 'public/ses/konusma'
SATIRLAR = [
    ('tr-TR-EmelNeural', '+12%', '-2Hz', 'TC-KRT, burası Merkez. Tıbbi malzeme uçuşunuz radarda, rota normal.'),
    ('tr-TR-AhmetNeural', '+25%', '+4Hz', 'Mayday, mayday! ... Sol motor yangını!'),
    ('tr-TR-AhmetNeural', '+35%', '+5Hz', 'Yangın büyüyor, kuyruk kontrolünü kaybediyorum!'),
    ('tr-TR-EmelNeural', '+22%', '+2Hz', 'Deniz! ... Deniz, duyuyor musun?'),
    ('tr-TR-AhmetNeural', '+18%', '+5Hz', 'Ağaçlara çarpacağım, tutun!'),
    ('tr-TR-AhmetNeural', '-12%', '-4Hz', '...Merkez... beni duyan var mı?'),
    ('tr-TR-EmelNeural', '+20%', '-3Hz', "Tüm birimler: helikopter düşmüş olabilir. Deniz'i bulmamız lazım."),
]

async def main():
    CIKTI.mkdir(parents=True, exist_ok=True)
    for i, (ses, hiz, perde, metin) in enumerate(SATIRLAR):
        await edge_tts.Communicate(metin, ses, rate=hiz, pitch=perde).save(str(CIKTI / f'k{i}.mp3'))
        print('ok', i)

asyncio.run(main())
