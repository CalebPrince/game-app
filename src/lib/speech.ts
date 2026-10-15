import { lineKey } from './voiceKey'
import { music } from './music'
// Browser speech: text-to-speech for instructions/words, and speech recognition for Speaking Studio.
let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => /en-GB/i.test(v.lang) && /female|libby|sonia|serena|google uk english female/i.test(v.name)) ??
    voices.find((v) => /en-GB/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null
  )
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => (voice = pickVoice())
  voice = pickVoice()
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/*
  Narration uses pre-generated ElevenLabs audio (scripts/voice-lines.ts writes public/audio/ and a
  manifest keyed by lineKey(text)). The API key never reaches the browser. Lines that could not be
  known in advance (e.g. a newly added child's name) fall back to the browser's own voice.
*/
let manifest: Record<string, string> = {}
let current: HTMLAudioElement | null = null
let seq = 0
if (typeof window !== 'undefined') {
  fetch('audio/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => (manifest = m))
    .catch(() => {})
}

function stopAll() {
  seq++
  if (current) {
    current.pause()
    current = null
  }
  if (canSpeak()) window.speechSynthesis.cancel()
}

function playOne(text: string, rate: number, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (token !== seq) return resolve()
    const file = manifest[lineKey(text)]
    if (file) {
      const a = new Audio(`audio/${file}`)
      current = a
      a.onended = () => resolve()
      a.onerror = () => resolve()
      a.play().catch(() => resolve())
      return
    }
    if (import.meta.env.DEV) console.info('[voice] no ElevenLabs audio for:', text)
    if (!canSpeak()) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    if (voice) u.voice = voice
    u.lang = voice?.lang ?? 'en-GB'
    u.rate = rate
    u.pitch = 1.05
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function speak(text: string, opts: { rate?: number } = {}) {
  speakSeq([text], opts)
}

/** Speak several lines one after another (e.g. "Hi Kofi!" then the greeting). */
export async function speakSeq(lines: string[], opts: { rate?: number } = {}) {
  stopAll()
  const token = seq
  music.duck(true)
  try {
    for (const l of lines) {
      if (token !== seq) return
      await playOne(l, opts.rate ?? 0.9, token)
    }
  } finally {
    music.duck(false)
  }
}

type Rec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: { 0: { transcript: string; confidence: number } }[] & ArrayLike<ArrayLike<{ transcript: string; confidence: number }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function recognizer(): Rec | null {
  const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition
  if (!C) return null
  const r = new C()
  r.lang = 'en-GB'
  r.interimResults = false
  r.maxAlternatives = 3
  return r
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

function lev(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

/**
 * Accent-tolerant comparison: each target word counts as "heard" if any spoken word is an exact
 * match or a close variant (small edit distance relative to length). We score what was said,
 * never how "native" it sounds, so valid accents are not penalised.
 */
export function compareSpeech(target: string, heard: string) {
  const t = norm(target)
  const h = norm(heard)
  const words = t.map((w) => {
    const ok = h.some((x) => x === w || (w.length > 3 && lev(x, w) <= Math.floor(w.length / 4)))
    return { word: w, ok }
  })
  const score = words.filter((w) => w.ok).length / Math.max(1, words.length)
  return { words, score }
}
