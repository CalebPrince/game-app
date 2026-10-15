// Cuts the shared asset sheet (public/images/asset-sheet.webp) into individual transparent PNGs
// under public/images/sheet/<group>/<name>.png. Run: node scripts/slice-sheet.mjs
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { loadRGBA, backgroundMask, cutout, components } from './sheet-lib.mjs'

const SRC = 'public/images/asset-sheet.webp'
const OUT = 'public/images/sheet'

// rect = [x0, y0, x1, y1] in sheet pixels. `split` = names spread left to right, cut at the emptiest columns.
const plan = [
  { group: 'kids', rect: [10, 38, 792, 280], split: ['boy-blue', 'girl-pink', 'boy-cap', 'girl-long', 'boy-glasses', 'girl-puffs'] },
  { group: 'mascots', rect: [797, 45, 1528, 258], split: ['owl', 'husky', 'turtle', 'cat', 'robot', 'star'] },
  { group: 'worlds', rect: [670, 317, 1528, 526], split: ['letter-land', 'word-town', 'reading-forest', 'grammar-galaxy', 'vocabulary-kingdom', 'writing-island'], keepBg: true },
  // early-learning objects: explicit rects (rows overlap, so no auto split)
  { group: 'objects', items: {
    cat: [16, 322, 119, 445], dog: [116, 322, 219, 445], frog: [229, 322, 309, 445], bee: [309, 322, 380, 410],
    sun: [380, 318, 468, 412], apple: [468, 318, 540, 412], bird: [544, 315, 645, 412],
    bus: [16, 440, 182, 550], house: [182, 440, 320, 550], tree: [320, 405, 446, 550],
    ball: [450, 420, 548, 520], car: [548, 418, 648, 500],
  } },
  { group: 'icons', y: [584, 646], xs: [20, 91, 162, 232, 300, 372, 442, 510, 589, 648, 715, 789, 849, 923, 992, 1066, 1140, 1208, 1283, 1365, 1435],
    names: ['home', 'activities', 'progress', 'rewards', 'learning', 'settings', 'profile', 'calendar', 'notifications', 'back', 'next', 'sound', 'locked', 'correct', 'incorrect', 'star', 'coin', 'gift-small', 'gift', 'help', 'hint'] },
  { group: 'badges', rect: [1116, 706, 1520, 802], split: ['bronze', 'silver', 'gold', 'royal', 'champion'] },
  { group: 'items', rect: [1130, 866, 1520, 916], split: ['cap-blue', 'cap-pink', 'cap-red', 'crown', 'wizard-hat', 'sunglasses'] },
  { group: 'items', rect: [1130, 920, 1520, 994], split: ['backpack-green', 'backpack-pink', 'jacket-black', 'tshirt-star', 'hoodie-blue'] },
  { group: 'ui', items: { 'xp-bar-star': [816, 705, 870, 760], 'stars-row': [822, 770, 905, 812], 'coin-big': [956, 764, 1007, 815] } },
]

const img = await loadRGBA(SRC)
const fg = backgroundMask(img)

function colCounts([x0, y0, x1, y1]) {
  const c = new Array(x1 - x0 + 1).fill(0)
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) c[x - x0] += fg[y * img.w + x]
  return c
}

// Split rect into n pieces at the emptiest columns near the even split points.
function splitRect(rect, n) {
  const [x0, y0, x1, y1] = rect
  const counts = colCounts(rect)
  const W = x1 - x0
  // find the real content extent first
  let a = 0, b = counts.length - 1
  while (a < b && counts[a] === 0) a++
  while (b > a && counts[b] === 0) b--
  const span = b - a
  const cuts = [x0 + a]
  for (let k = 1; k < n; k++) {
    const target = a + (span * k) / n
    const win = (span / n) * 0.35
    let best = Math.round(target), bestV = Infinity
    for (let x = Math.max(a, Math.round(target - win)); x <= Math.min(b, Math.round(target + win)); x++) {
      // favour columns closer to the target when counts tie
      const v = counts[x] + Math.abs(x - target) * 0.02
      if (v < bestV) { bestV = v; best = x }
    }
    cuts.push(x0 + best)
  }
  cuts.push(x0 + b)
  void W
  return Array.from({ length: n }, (_, i) => [cuts[i], y0, cuts[i + 1], y1])
}

// Shrink a rect to the foreground pixels inside it.
function trim([x0, y0, x1, y1]) {
  let nx0 = x1, ny0 = y1, nx1 = x0, ny1 = y0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (fg[y * img.w + x]) { if (x < nx0) nx0 = x; if (x > nx1) nx1 = x; if (y < ny0) ny0 = y; if (y > ny1) ny1 = y }
  }
  return { x0: nx0, y0: ny0, x1: nx1, y1: ny1 }
}

// Cut but blank out any foreground pixels outside the given rect (neighbours that touch).
async function save(group, name, rect, opts = {}) {
  const dir = path.join(OUT, group)
  fs.mkdirSync(dir, { recursive: true })
  const box = trim(rect)
  const local = new Uint8Array(fg.length)
  const [x0, y0, x1, y1] = rect
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) local[y * img.w + x] = fg[y * img.w + x]
  let finalBox = box
  if (!opts.keepBg) {
    // clear near-white reachable from this rect's own edges (white enclosed by neighbouring items)
    const d = img.data
    const white = (p) => d[p * 4] >= 236 && d[p * 4 + 1] >= 236 && d[p * 4 + 2] >= 236
    const stack = []
    const seen = new Uint8Array(local.length)
    const push = (x, y) => {
      if (x < x0 || y < y0 || x > x1 || y > y1) return
      const p = y * img.w + x
      if (seen[p] || (local[p] && !white(p))) return
      seen[p] = 1
      local[p] = 0
      stack.push(p)
    }
    for (let x = x0; x <= x1; x++) { push(x, y0); push(x, y1) }
    for (let y = y0; y <= y1; y++) { push(x0, y); push(x1, y) }
    while (stack.length) {
      const p = stack.pop(), x = p % img.w, y = (p / img.w) | 0
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
    }
    // keep only the main item: the largest blob, plus blobs that sit inside its bounds (e.g. a bee's wings)
    const blobs = components(local, img.w, img.h, 1, 0).sort((a, b) => b.area - a.area)
    const main = blobs[0]
    if (main) {
      const inside = (b) => b.x0 >= main.x0 - 6 && b.x1 <= main.x1 + 6 && b.y0 >= main.y0 - 6 && b.y1 <= main.y1 + 6
      const touchesEdge = (b) => b.x0 <= x0 + 1 || b.x1 >= x1 - 1
      const keep = blobs.filter((b) => b === main || (inside(b) && !(touchesEdge(b) && b.area < main.area * 0.08)))
      const drop = blobs.filter((b) => !keep.includes(b))
      for (const b of drop) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
        const p = y * img.w + x
        if (!keep.some((k) => x >= k.x0 && x <= k.x1 && y >= k.y0 && y <= k.y1)) local[p] = 0
      }
      finalBox = { x0: main.x0, y0: main.y0, x1: main.x1, y1: main.y1 }
      for (const k of keep) finalBox = { x0: Math.min(finalBox.x0, k.x0), y0: Math.min(finalBox.y0, k.y0), x1: Math.max(finalBox.x1, k.x1), y1: Math.max(finalBox.y1, k.y1) }
    }
  }
  await cutout(img, local, finalBox, path.join(dir, `${name}.png`), { pad: 4, ...opts })
  return path.join(dir, `${name}.png`)
}

const written = []
for (const step of plan) {
  if (step.split) {
    const rects = splitRect(step.rect, step.split.length)
    for (let i = 0; i < rects.length; i++) written.push(await save(step.group, step.split[i], rects[i], { keepBg: false }))
  } else if (step.items) {
    for (const [name, r] of Object.entries(step.items)) written.push(await save(step.group, name, r))
  } else if (step.xs) {
    for (let i = 0; i < step.xs.length; i++) {
      const x0 = step.xs[i] - 3, x1 = (step.xs[i + 1] ?? step.xs[i] + 64) - 4
      written.push(await save(step.group, step.names[i], [x0, step.y[0], Math.min(x1, x0 + 66), step.y[1]]))
    }
  }
}

// Contact sheet for a quick visual check
const thumbs = await Promise.all(written.map(async (f) => sharp(f).resize(96, 96, { fit: 'contain', background: { r: 230, g: 236, b: 245, alpha: 1 } }).png().toBuffer()))
const cols = 12, rows = Math.ceil(thumbs.length / cols)
await sharp({ create: { width: cols * 100, height: rows * 100, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite(thumbs.map((input, i) => ({ input, left: (i % cols) * 100 + 2, top: Math.floor(i / cols) * 100 + 2 })))
  .png()
  .toFile('scripts/.contact.png')
console.log(`${written.length} images written to ${OUT}`)
