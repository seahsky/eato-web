export type PetSpecies = "cat" | "dog" | "bunny" | "hamster" | "bird" | "frog"
export type EyeStyle = "round" | "sleepy" | "sparkle" | "dot"
export type PatternType = "none" | "spots" | "stripes" | "heart"
export type AccessoryType = "none" | "bow" | "hat" | "scarf" | "glasses" | "flower"

export interface PetTraits {
  species: PetSpecies
  bodyHue: number
  bodySaturation: number
  bodyLightness: number
  accentHueShift: number
  eyeStyle: EyeStyle
  pattern: PatternType
  accessory: AccessoryType
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function objectIdToSeed(objectId: string): number {
  let hash = 0
  for (let i = 0; i < objectId.length; i++) {
    const char = objectId.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash >>> 0
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}

export function generatePetTraits(userId: string): PetTraits {
  const seed = objectIdToSeed(userId)
  const rng = mulberry32(seed)

  const species = pick(rng, ["cat", "dog", "bunny", "hamster", "bird", "frog"] as const)
  const bodyHue = Math.floor(range(rng, 0, 360))
  const bodySaturation = Math.floor(range(rng, 50, 80))
  const bodyLightness = Math.floor(range(rng, 45, 65))
  const accentHueShift = Math.floor(range(rng, 30, 60))
  const eyeStyle = pick(rng, ["round", "sleepy", "sparkle", "dot"] as const)
  const pattern = pick(rng, ["none", "spots", "stripes", "heart"] as const)
  const accessory = pick(rng, ["none", "bow", "hat", "scarf", "glasses", "flower"] as const)

  return {
    species,
    bodyHue,
    bodySaturation,
    bodyLightness,
    accentHueShift,
    eyeStyle,
    pattern,
    accessory,
  }
}
