import type { Ortam } from '../game/types'

export interface OrtamAyar {
  gokUst: string
  gokUfuk: string
  gunes: string
  sis: string
  sisYogunluk: number
  tarla: string[]
  agacRenk: string
  /** ibre: katmanlı çam; geniş: yuvarlak tepeli yapraklı ağaç. */
  agacTuru: 'ibre' | 'genis'
  agacAdet: number
  agacOlcek: [number, number]
  bulut: number
}

/** Bölümün iklim ortamına göre gökyüzü, sis, zemin ve orman ayarı. */
export const ORTAMLAR: Record<Ortam, OrtamAyar> = {
  akdeniz: {
    gokUst: '#2f5d9c', gokUfuk: '#ffb070', gunes: '#ffd9a0', sis: '#e8b080', sisYogunluk: 0.0014,
    tarla: ['#8c8a4a', '#a39a58', '#6f7c3c', '#b6a15c', '#7a6a3a'], agacRenk: '#6f8a3a', agacTuru: 'genis',
    agacAdet: 900, agacOlcek: [1.4, 2.2], bulut: 0.3,
  },
  karadeniz: {
    gokUst: '#3b4a6b', gokUfuk: '#e89a6a', gunes: '#ffc08a', sis: '#a0919a', sisYogunluk: 0.0024,
    tarla: ['#2f5a2e', '#3d6a33', '#27502a', '#456f36', '#33582f'], agacRenk: '#1f5a32', agacTuru: 'ibre',
    agacAdet: 2200, agacOlcek: [1.6, 2.8], bulut: 0.8,
  },
  karasal: {
    gokUst: '#3a5f96', gokUfuk: '#ffa860', gunes: '#ffd49a', sis: '#e0b080', sisYogunluk: 0.0012,
    tarla: ['#a39058', '#b8a468', '#8e8048', '#c2b078', '#9c8a50'], agacRenk: '#7a8a3c', agacTuru: 'genis',
    agacAdet: 350, agacOlcek: [1.2, 1.8], bulut: 0.25,
  },
  'sert-karasal': {
    gokUst: '#2b3f66', gokUfuk: '#f2a888', gunes: '#ffd0b0', sis: '#b8c4dc', sisYogunluk: 0.0018,
    tarla: ['#e8edf3', '#d6dfea', '#c9d4e2', '#f0f3f7'], agacRenk: '#1e4a3a', agacTuru: 'ibre',
    agacAdet: 700, agacOlcek: [1.6, 2.6], bulut: 0.5,
  },
}
