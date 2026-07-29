// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Ray Astrology mapping
//  Each zodiac sign aligns with a Ray, Code, and color.
//  Aries → Red / 1A, Taurus → Orange / 2A, … Pisces → ALL / 12A
// ─────────────────────────────────────────────────────────────

import { RAY_DATA } from './constants'

export const ZODIAC_RAY_ORDER = [
  'Aries',      // 1A Red
  'Taurus',     // 2A Orange
  'Gemini',     // 3A Yellow
  'Cancer',     // 4A Green
  'Leo',        // 5A Turquoise
  'Virgo',      // 6A Blue
  'Libra',      // 7A Indigo
  'Scorpio',    // 8A Violet
  'Sagittarius',// 9A Magenta
  'Capricorn',  // 10A Omni
  'Aquarius',   // 11A Elemental (Crystalline-Carbon)
  'Pisces',     // 12A ALL
] as const

export interface RayAstrologyInfo {
  sign: string
  ray: string
  code: string
  color: string
  number: number
}

export function getRayAstrologyForSign(sign: string): RayAstrologyInfo | undefined {
  const normalized = sign.trim()
  const index = ZODIAC_RAY_ORDER.findIndex((s) => s === normalized)
  if (index === -1) return undefined

  const ray = RAY_DATA[index]
  return {
    sign: normalized,
    ray: ray.label.split(' — ')[0],
    code: ray.code,
    color: ray.color,
    number: index + 1,
  }
}

export function getRayAstrologyForAll(signs: (string | undefined)[]): RayAstrologyInfo[] {
  return signs
    .filter(Boolean)
    .map((sign) => getRayAstrologyForSign(sign as string))
    .filter((info): info is RayAstrologyInfo => !!info)
}
