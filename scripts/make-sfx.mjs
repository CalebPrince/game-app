// Builds the UI sound effects in public/audio/sfx.
// tap.mp3     : trimmed from the ElevenLabs "soft bubbly pop" generation (pass its path as argv[2]).
// correct/wrong/reward.mp3 : synthesised bell tones (sine partials with exponential decay).
// celebrate.mp3 : star pings and a chord, with the kids' cheer in scripts/assets mixed on top.
// Needs ffmpeg on PATH. Run: node scripts/make-sfx.mjs "<path to ElevenLabs pop mp3>"
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = 'public/audio/sfx'
const RATE = 44100
fs.mkdirSync(OUT, { recursive: true })

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24)
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

// A soft mallet/bell note: fundamental + a few inharmonic partials, fast attack, exponential decay.
function note(buf, start, freq, dur, amp = 0.5, decay = 7) {
  const s0 = Math.floor(start * RATE)
  const n = Math.floor(dur * RATE)
  const partials = [[1, 1, 1], [2.0, 0.35, 1.6], [3.01, 0.12, 2.4], [4.2, 0.05, 3.2]]
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / RATE
    const attack = Math.min(1, t / 0.004)
    let v = 0
    for (const [m, a, dm] of partials) v += a * Math.sin(2 * Math.PI * freq * m * t) * Math.exp(-decay * dm * t)
    buf[s0 + i] += amp * attack * v
  }
}

function render(name, len, fn) {
  const buf = new Float32Array(Math.floor(len * RATE))
  fn(buf)
  const peak = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1
  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / peak) * 0.8
  const tmp = `${OUT}/${name}.wav`
  fs.writeFileSync(tmp, wav(buf))
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-b:a', '128k', `${OUT}/${name}.mp3`])
  fs.unlinkSync(tmp)
}

// Correct: bright rising two-note chime (C6 then G6)
render('correct', 0.9, (b) => {
  note(b, 0, 1046.5, 0.6, 0.5, 6)
  note(b, 0.11, 1568, 0.75, 0.55, 5)
})
// Try again: soft, low, descending two notes (gentle, not punishing)
render('wrong', 0.6, (b) => {
  note(b, 0, 392, 0.35, 0.5, 9)
  note(b, 0.13, 329.6, 0.45, 0.45, 8)
})
// Reward: quick sparkling arpeggio up to the octave (C6 E6 G6 C7)
render('reward', 1.3, (b) => {
  ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => note(b, i * 0.085, f, 1.0 - i * 0.1, 0.45, 4.5))
})

// Celebrate (the activity complete screen): a ping as each of the three stars pops in (Results.tsx pops them at
// 200, 350 and 500 ms), a bright major chord, then a real group of children shouting "Yay!"
// (scripts/assets/kids-yay-cheer.mp3, Pixabay sound effect 299607, Pixabay Content License, no credit required) on top.
// The cheer is only trimmed and set in level (a limiter, no loudness normalising), so it keeps its natural sound.
render('celebrate-chimes', 2.2, (b) => {
  ;[1318.5, 1568, 2093].forEach((f, i) => note(b, 0.2 + i * 0.15, f, 0.7, 0.5, 5))
  ;[1046.5, 1318.5, 1568, 2093].forEach((f) => note(b, 0.68, f, 1.5, 0.32, 2.6))
  for (let i = 0; i < 6; i++) note(b, 0.75 + i * 0.07, 2637 + (i % 3) * 300, 0.4, 0.12, 6)
})
const yay = 'scripts/assets/kids-yay-cheer.mp3'
if (fs.existsSync(yay)) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}/celebrate-chimes.mp3`, '-i', yay, '-filter_complex',
    '[1:a]silenceremove=start_periods=1:start_threshold=-45dB,afade=t=out:st=1.6:d=0.4,volume=0.7,adelay=600:all=1[y];' +
    '[0:a]volume=0.55[c];[c][y]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:attack=5:release=80,aresample=44100',
    '-ac', '2', '-b:a', '160k', `${OUT}/celebrate.mp3`])
  fs.unlinkSync(`${OUT}/celebrate-chimes.mp3`)
} else fs.renameSync(`${OUT}/celebrate-chimes.mp3`, `${OUT}/celebrate.mp3`)

// Tap: take the first transient of the ElevenLabs pop and keep it short.
const pop = process.argv[2]
if (pop && fs.existsSync(pop)) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', pop, '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,atrim=0:0.28,afade=t=out:st=0.18:d=0.1,loudnorm=I=-20:TP=-3',
    '-ar', '44100', '-ac', '1', '-b:a', '128k', `${OUT}/tap.mp3`])
}
console.log(fs.readdirSync(OUT).join(' '))
