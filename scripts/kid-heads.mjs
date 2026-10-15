// Makes square head-and-shoulders crops of each kid sprite for round avatars.
import fs from 'node:fs'
import sharp from 'sharp'
const dir = 'public/images/sheet/kids'
fs.mkdirSync('public/images/sheet/heads', { recursive: true })
for (const f of fs.readdirSync(dir)) {
  const { data, info } = await sharp(`${dir}/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  // horizontal centre of mass of the top 22% (hair and face)
  let sx = 0, n = 0
  for (let y = 0; y < h * 0.22; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 128) { sx += x; n++ }
  const cx = Math.round(sx / n)
  const size = Math.round(h * 0.47)
  const left = Math.max(0, Math.min(w - 1, cx - Math.round(size / 2)))
  const ext = { left: Math.max(0, cx - Math.round(size / 2)), top: 0, width: Math.min(size, w - Math.max(0, cx - Math.round(size / 2))), height: size }
  void left
  await sharp(`${dir}/${f}`).extract(ext).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`public/images/sheet/heads/${f}`)
}
const files = fs.readdirSync('public/images/sheet/heads')
const bufs = await Promise.all(files.map((f) => sharp(`public/images/sheet/heads/${f}`).resize(120, 120, { fit: 'contain', background: '#ffd98a' }).png().toBuffer()))
await sharp({ create: { width: files.length * 124, height: 124, channels: 3, background: '#fff' } }).composite(bufs.map((input, i) => ({ input, left: i * 124, top: 2 }))).png().toFile('scripts/.contact.png')
console.log(files.join(' '))
