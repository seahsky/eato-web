import type { PetTraits } from "./generator"
import type { PetHealthState } from "./health"

export interface PetPalette {
  body: string
  accent: string
  eye: string
  mouth: string
  cheek: string
  outline: string
  earInner: string
}

const HEALTH_MODIFIERS: Record<PetHealthState, { saturation: number; lightness: number }> = {
  thriving: { saturation: 10, lightness: 5 },
  healthy: { saturation: 0, lightness: 0 },
  okay: { saturation: -10, lightness: 0 },
  struggling: { saturation: -25, lightness: -5 },
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))}%)`
}

export function generatePalette(traits: PetTraits, healthState: PetHealthState = "healthy"): PetPalette {
  const mod = HEALTH_MODIFIERS[healthState]
  const h = traits.bodyHue
  const s = traits.bodySaturation + mod.saturation
  const l = traits.bodyLightness + mod.lightness
  const accentH = (h + traits.accentHueShift) % 360

  return {
    body: hsl(h, s, l),
    accent: hsl(accentH, s + 5, l + 5),
    eye: hsl(0, 0, 15),
    mouth: hsl(350, 60, 55),
    cheek: hsl(10, 70, 80),
    outline: hsl(h, s - 10, l - 20),
    earInner: hsl(accentH, s - 5, l + 15),
  }
}
