// Cuts the worlds sheet (public/images/worlds-sheet.webp) into the hero, map and world tiles.
// Each crop stops above the filename label printed at the bottom-left of every tile.
import fs from 'node:fs'
import sharp from 'sharp'

const SRC = 'public/images/worlds-sheet.webp'
fs.mkdirSync('public/images/worlds', { recursive: true })

const crops = {
  'welcome-hero': [0, 0, 701, 292],
  'map-bg': [707, 0, 1535, 292],
  'worlds/spelling-island': [7, 360, 256, 612],
  'worlds/reading-forest': [260, 360, 516, 612],
  'worlds/vocabulary-kingdom': [519, 360, 770, 612],
  'worlds/grammar-galaxy': [773, 360, 1023, 612],
  'worlds/speaking-studio': [1027, 360, 1283, 612],
  'worlds/writing-workshop': [1286, 360, 1528, 612],
  'worlds/letter-land': [7, 686, 256, 962],
  'worlds/two-letter-town': [259, 686, 520, 962],
  'worlds/three-letter-forest': [522, 686, 766, 962],
  'worlds/word-builder-castle': [768, 686, 1028, 962],
  'worlds/first-reading': [1031, 686, 1285, 962],
  'worlds/my-first-stories': [1288, 686, 1528, 962],
}

for (const [name, [x0, y0, x1, y1]] of Object.entries(crops)) {
  await sharp(SRC)
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .webp({ quality: 92 })
    .toFile(`public/images/${name}.webp`)
}
console.log(Object.keys(crops).length, 'crops written')
