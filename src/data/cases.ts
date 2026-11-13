import type { Vaka } from '../game/types'
import { VAKALAR_1 } from './cases/part1'
import { VAKALAR_2 } from './cases/part2'
import { VAKALAR_3 } from './cases/part3'

// 15 konu × 3 zorluk = 45 vaka. Tutarlılık testi: src/data/cases.test.ts
export const VAKALAR: Vaka[] = [...VAKALAR_1, ...VAKALAR_2, ...VAKALAR_3]
