import type { PetSpecies } from "./generator"

export type CellTag =
  | "empty"
  | "body"
  | "accent"
  | "eye"
  | "mouth"
  | "cheek"
  | "accessory-slot"
  | "outline"
  | "ear-inner"

export type PixelTemplate = CellTag[][]

// Compact string notation for 16x16 grids
// . = empty, B = body, A = accent, E = eye, M = mouth
// C = cheek, S = accessory-slot, O = outline, I = ear-inner
const CHAR_MAP: Record<string, CellTag> = {
  ".": "empty",
  "B": "body",
  "A": "accent",
  "E": "eye",
  "M": "mouth",
  "C": "cheek",
  "S": "accessory-slot",
  "O": "outline",
  "I": "ear-inner",
}

function parseTemplate(rows: string[]): PixelTemplate {
  return rows.map(row =>
    row.split("").map(char => CHAR_MAP[char] ?? "empty")
  )
}

// Cat: Pointed ears, round head, whisker cheeks, curled tail
const catTemplate = parseTemplate([
  "....OO......OO..",  // row 0:  ear tips
  "...OIBO....OIBO.",  // row 1:  ears with inner color
  "..OIBBO..OIBBO..",  // row 2:  wider ears
  "..OBBBBOOBBBBBO.",  // row 3:  ears meet head
  "..OBBBBBBBBBBBO.",  // row 4:  head top
  ".OBBBBEBBEBBBBO.",  // row 5:  eyes row
  ".OBBCBBMBBCBBBO.",  // row 6:  cheeks and mouth
  ".OBBCBMMMBBCBBO.",  // row 7:  lower face with mouth
  "..OBBBBBBBBBBBO.",  // row 8:  chin
  "..SOBBBBBBBBO.S.",  // row 9:  neck with accessory slots
  "..OBBBBBBBBBBBO.",  // row 10: body top
  ".OBBBBBBBBBBBBO.",  // row 11: body wide
  ".OBBBBBBBBBBBBOO",  // row 12: body with tail start
  ".OBBBBBBBBBBBOAO",  // row 13: lower body, tail
  "..OOBBOOOBBOO.OO",  // row 14: feet
  "................",  // row 15: empty
])

// Dog: Floppy ears, happy tongue, sturdy body
const dogTemplate = parseTemplate([
  "................",  // row 0:  empty
  "...OOOOOOOOO....",  // row 1:  head top
  "..OBBBBBBBBBO...",  // row 2:  head
  ".OBBBBBBBBBBBOS.",  // row 3:  head wide, accessory
  "OAOBBBBEBBEBBBOO",  // row 4:  floppy ear left, eyes
  "OAABBCBBBBCBBAO.",  // row 5:  ears down, cheeks
  "OAABBBBMMBBBBAO.",  // row 6:  mouth
  ".OOBBBMMMMBBOOO.",  // row 7:  tongue out (M = tongue)
  "...OBBBBBBBBOO..",  // row 8:  chin
  "..SOBBBBBBBBO.S.",  // row 9:  neck with accessory slots
  "..OBBBBBBBBBBOO.",  // row 10: body
  ".OBBBBBBBBBBBBO.",  // row 11: body wide
  ".OBBBBBBBBBBBBO.",  // row 12: body
  ".OBBBBBBBBBBBO..",  // row 13: lower body
  "..OOBBOOOBBOO...",  // row 14: feet
  "..OAO.....OAO...",  // row 15: paws with accent
])

// Bunny: Tall ears with inner color, round fluffy body
const bunnyTemplate = parseTemplate([
  "....OO...OO.....",  // row 0:  ear tips
  "...OIBO.OIBO....",  // row 1:  ears with inner
  "...OIBO.OIBO....",  // row 2:  tall ears
  "...OIBO.OIBO....",  // row 3:  tall ears continued
  "..OOBBOOOBBOO...",  // row 4:  ears meet head
  "..OBBBBBBBBBO...",  // row 5:  head
  ".OBBBEBBBEBBBO..",  // row 6:  eyes
  ".OBBCBBBBBCBBO..",  // row 7:  cheeks
  ".SOBBBBBMBBBBOS.",  // row 8:  mouth, accessory slots
  "..OBBBBMBBBBO...",  // row 9:  lower face
  "..OBBBBBBBBBO...",  // row 10: neck
  ".OBBBBBBBBBBBBO.",  // row 11: body wide
  ".OBBBBBBBBBBBBOO",  // row 12: body with tail
  ".OBBBBBBBBBBBAO.",  // row 13: body, fluffy tail (accent)
  "..OOBBOOOBBOOO..",  // row 14: feet
  "................",  // row 15: empty
])

// Hamster: Very round body, tiny ears, huge cheeks
const hamsterTemplate = parseTemplate([
  "................",  // row 0:  empty
  "....OO...OO.....",  // row 1:  tiny ears
  "...OIBOOIBBO....",  // row 2:  ears with inner
  "..OBBBBBBBBBO...",  // row 3:  head top
  ".OBBBBBBBBBBBBO.",  // row 4:  head
  ".OBBBEBBBBEBBO..",  // row 5:  eyes
  "OCCBBBBBBBBBCCO.",  // row 6:  BIG cheeks
  "OCCBBBBMMBBCCCO.",  // row 7:  cheeks and mouth
  ".OBBBBMMMMBBBOS.",  // row 8:  mouth, accessory
  ".SOBBBBBBBBBBO..",  // row 9:  accessory slot
  ".OBBBBBBBBBBBBO.",  // row 10: round body
  "OBBBBBBBBBBBBBO.",  // row 11: wide round body
  "OBBBBBBBBBBBBBO.",  // row 12: wide round body
  ".OBBBBBBBBBBBO..",  // row 13: lower body
  "..OOBBOOOBBOO...",  // row 14: tiny feet
  "................",  // row 15: empty
])

// Bird: Small round body, beak (accent), wings, tail feathers
const birdTemplate = parseTemplate([
  "................",  // row 0:  empty
  "................",  // row 1:  empty
  ".....SOOOOO.....",  // row 2:  crest/accessory
  "....OBBBBBBOO...",  // row 3:  head top
  "...OBBBBBBBBBO..",  // row 4:  head
  "...OBBEBBBEBBAO.",  // row 5:  eyes, beak start
  "...OBBCBBCBBAAO.",  // row 6:  cheeks, beak
  "...OBBBMMBBBO...",  // row 7:  beak tip, mouth
  "..OOBBBBBBBBOO..",  // row 8:  neck
  ".OAAOBBBBBBOAAO.",  // row 9:  wings spread
  "OAAAOBBBBBBAAAO.",  // row 10: wings wide
  ".OAOOBBBBBBOOAO.",  // row 11: wings tuck
  "..OOBBBBBBBBOO..",  // row 12: body
  "...OBBBBBBBO.OO.",  // row 13: lower body, tail
  "...OOOBOOBOOOAO.",  // row 14: feet, tail feather
  "................",  // row 15: empty
])

// Frog: Wide flat head, very big round eyes, squat body
const frogTemplate = parseTemplate([
  "................",  // row 0:  empty
  "..OOO......OOO..",  // row 1:  eye bumps
  ".OEEOO....OEEOO.",  // row 2:  big protruding eyes
  ".OEEEO....OEEEO.",  // row 3:  eyes continued
  "..OOO......OOO..",  // row 4:  below eyes
  "..OOBBBBBBBBOO..",  // row 5:  head top
  ".OBBBBBBBBBBBBOS",  // row 6:  wide head, accessory
  ".OBBCBBMMBBCBBO.",  // row 7:  cheeks, wide mouth
  ".SBBCBMMMMBCBBO.",  // row 8:  accessory, big grin
  "..OBBBBBBBBBBOO.",  // row 9:  chin
  "..OBBBBBBBBBBOO.",  // row 10: body
  ".OAAOBBBBBBOAAO.",  // row 11: accent legs/arms
  ".OAAOBBBBBBAOAO.",  // row 12: limbs
  "..OOBBBBBBBBOO..",  // row 13: body
  ".OAO.OOOOOO.OAO.",  // row 14: splayed feet
  "................",  // row 15: empty
])

export const SPECIES_TEMPLATES: Record<PetSpecies, PixelTemplate> = {
  cat: catTemplate,
  dog: dogTemplate,
  bunny: bunnyTemplate,
  hamster: hamsterTemplate,
  bird: birdTemplate,
  frog: frogTemplate,
}
