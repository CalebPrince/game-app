// Prints the bounding boxes of every item found on a sheet (used to build the slice map).
import { loadRGBA, backgroundMask, components } from './sheet-lib.mjs'

const file = process.argv[2]
const img = await loadRGBA(file)
const fg = backgroundMask(img)
const boxes = components(fg, img.w, img.h, 250, 3).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
for (const b of boxes) console.log(`${b.x0},${b.y0} -> ${b.x1},${b.y1}  (${b.x1 - b.x0}x${b.y1 - b.y0})`)
console.log(boxes.length, 'items')
