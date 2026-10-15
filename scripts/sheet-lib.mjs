// Shared helpers for cutting items out of generated sprite/asset sheets.
// Background removal: flood-fill near-white pixels from the image border, so white
// *inside* an object (eyes, eggs, milk) is kept.
import sharp from 'sharp'

export async function loadRGBA(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

const isBg = (d, i, tol) => d[i] >= tol && d[i + 1] >= tol && d[i + 2] >= tol

// Returns Uint8Array mask: 1 = foreground, 0 = background (connected to border or to `seeds`).
export function backgroundMask({ data, w, h }, tol = 236, seeds = []) {
  const bg = new Uint8Array(w * h)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const p = y * w + x
    if (bg[p]) return
    if (!isBg(data, p * 4, tol)) return
    bg[p] = 1
    stack.push(p)
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  for (const [x, y] of seeds) push(x, y)
  while (stack.length) {
    const p = stack.pop()
    const x = p % w, y = (p / w) | 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
  const fg = new Uint8Array(w * h)
  for (let i = 0; i < fg.length; i++) fg[i] = bg[i] ? 0 : 1
  return fg
}

// Connected components on the foreground mask, merging blobs within `gap` px.
export function components(fg, w, h, minArea = 300, gap = 4) {
  const label = new Int32Array(w * h).fill(-1)
  const boxes = []
  for (let p = 0; p < fg.length; p++) {
    if (!fg[p] || label[p] !== -1) continue
    const id = boxes.length
    let x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0
    const stack = [p]
    label[p] = id
    while (stack.length) {
      const q = stack.pop()
      const x = q % w, y = (q / w) | 0
      area++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (fg[n] && label[n] === -1) { label[n] = id; stack.push(n) }
      }
    }
    boxes.push({ x0, y0, x1, y1, area })
  }
  let list = boxes.filter((b) => b.area >= minArea)
  // merge boxes that overlap or sit within `gap`
  let merged = true
  while (merged) {
    merged = false
    outer: for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]
      if (a.x0 - gap <= b.x1 && b.x0 - gap <= a.x1 && a.y0 - gap <= b.y1 && b.y0 - gap <= a.y1) {
        list[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), area: a.area + b.area }
        list.splice(j, 1)
        merged = true
        break outer
      }
    }
  }
  return list
}

// Cut a rect out, applying the mask as alpha; pad a little and write PNG.
export async function cutout({ data, w }, fg, box, outFile, { pad = 6, keepBg = false } = {}) {
  const x0 = Math.max(0, box.x0 - pad), y0 = Math.max(0, box.y0 - pad)
  const x1 = box.x1 + pad, y1 = box.y1 + pad
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = Buffer.alloc(cw * ch * 4)
  const H = data.length / 4 / w
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const sx = x0 + x, sy = y0 + y
    const o = (y * cw + x) * 4
    if (sx >= w || sy >= H) continue
    const p = sy * w + sx
    out[o] = data[p * 4]; out[o + 1] = data[p * 4 + 1]; out[o + 2] = data[p * 4 + 2]
    out[o + 3] = keepBg || fg[p] ? 255 : 0
  }
  await sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png().toFile(outFile)
}
