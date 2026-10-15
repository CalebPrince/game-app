/*
  Generates ElevenLabs narration for every line the app can speak.
  Run:  npx tsx scripts/voice-lines.ts --dry   (list lines and character count, no API calls)
        npx tsx scripts/voice-lines.ts         (generate missing files; existing ones are reused)
  Key:  ELEVENLABS_API_KEY from the environment, or from ../motion-designs/remotion/.env.
        The key is only used here, never shipped to the browser.
*/
import fs from 'node:fs'
import path from 'node:path'
import { ACTIVITIES, VOICE, type Question } from '../src/lib/content'
import { seedChildren } from '../src/lib/seed'
import { lineKey, normLine } from '../src/lib/voiceKey'
import type { Child, Difficulty } from '../src/lib/types'

const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2' // "Alice - Clear, Engaging Educator" (British). Change here to re-voice.
const MODEL_ID = 'eleven_multilingual_v2'
const OUT = 'public/audio'
const dry = process.argv.includes('--dry')

const lines = new Set<string>()
const add = (t?: string) => t && lines.add(normLine(t))

function linesFor(q: Question, little: boolean) {
  if (little) add(q.hint)
  switch (q.kind) {
    case 'pick-letter':
    case 'pick-word':
    case 'pick-picture':
      add(q.say)
      break
    case 'trace':
      add(VOICE.traceLetter(q.letter))
      break
    case 'build-word':
      add(VOICE.buildWordIntro)
      add(q.word)
      q.pool.forEach(add)
      break
    case 'fill-blanks':
      add(VOICE.fillBlanks(q.say, q.sentence))
      q.pool.forEach(add)
      break
    case 'dictation':
      add(VOICE.dictation(q.word, q.sentence))
      break
    case 'build-sentence':
      add(VOICE.sentenceIntro)
      add(q.words.join(' '))
      q.words.forEach(add)
      break
    case 'mcq':
      add(q.passage?.text)
      add(q.audio)
      break
    case 'speak':
      add(q.text)
      break
  }
}

// Sample every activity many times at every difficulty so random pools are fully covered.
const children = seedChildren()
for (const a of ACTIVITIES) {
  const child = children.find((c) => c.track === a.track) as Child
  for (const d of [1, 2, 3] as Difficulty[]) for (let i = 0; i < 300; i++) a.build(child, d).forEach((q) => linesFor(q, a.track === 'little'))
}
// Letter tiles can show any letter
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(add)
VOICE.praise.forEach(add)
VOICE.headlines.forEach(add)
add(VOICE.retry)
add(VOICE.reveal)
add(VOICE.pickWorld)
for (let t = 1; t <= 6; t++) for (let c = 0; c <= t; c++) add(VOICE.score(c, t))
ACTIVITIES.filter((a) => a.track === 'little').forEach((a) => add(VOICE.letsPlay(a.title)))
children.forEach((c) => add(VOICE.hi(c.name)))

const all = [...lines].sort()
const chars = all.reduce((n, l) => n + l.length, 0)
fs.mkdirSync(OUT, { recursive: true })
const manifestPath = path.join(OUT, 'manifest.json')
const manifest: Record<string, string> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
const todo = all.filter((l) => !manifest[lineKey(l)] || !fs.existsSync(path.join(OUT, manifest[lineKey(l)])))
const todoChars = todo.reduce((n, l) => n + l.length, 0)
console.log(`${all.length} lines, ${chars} characters in total. To generate: ${todo.length} lines, ${todoChars} characters.`)
if (dry) {
  fs.writeFileSync('scripts/.voice-lines.txt', all.join('\n'))
  console.log('Line list written to scripts/.voice-lines.txt')
  process.exit(0)
}

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY
  const env = fs.readFileSync(path.resolve('../motion-designs/remotion/.env'), 'utf8')
  const m = env.match(/^ELEVENLABS_API_KEY=(.*)$/m)
  if (!m) throw new Error('ELEVENLABS_API_KEY not found')
  return m[1].trim().replace(/^['"]|['"]$/g, '')
}
const key = apiKey()

async function synth(text: string) {
  // Single letters are read as letter names; give the model a little context so it does not mumble.
  const spoken = /^[a-z]$/.test(text) ? `${text.toUpperCase()}.` : text
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: spoken, model_id: MODEL_ID, voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 0.92 } }),
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      continue
    }
    throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  throw new Error('ElevenLabs: too many retries')
}

let done = 0
const queue = [...todo]
async function worker() {
  while (queue.length) {
    const line = queue.shift()!
    const k = lineKey(line)
    const file = `${k}.mp3`
    fs.writeFileSync(path.join(OUT, file), await synth(line))
    manifest[k] = file
    done++
    if (done % 25 === 0) {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest))
      console.log(`${done}/${todo.length}`)
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker))
fs.writeFileSync(manifestPath, JSON.stringify(manifest))
console.log(`Done. ${done} new files, manifest has ${Object.keys(manifest).length} lines.`)
