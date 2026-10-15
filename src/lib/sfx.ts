// Short UI sound effects (ElevenLabs-generated files in public/audio/sfx), played through Web Audio
// for low latency. Taps play on any button in the child app; parent/teacher portals stay silent.
import { musicArea } from './music'

type Name = 'tap' | 'correct' | 'wrong' | 'reward'
const FILES: Record<Name, string> = {
  tap: 'audio/sfx/tap.mp3',
  correct: 'audio/sfx/correct.mp3',
  wrong: 'audio/sfx/wrong.mp3',
  reward: 'audio/sfx/reward.mp3',
}
const VOLUME: Record<Name, number> = { tap: 0.45, correct: 0.6, wrong: 0.5, reward: 0.6 }

let ctx: AudioContext | null = null
const buffers: Partial<Record<Name, AudioBuffer>> = {}

function context() {
  if (!ctx && typeof window !== 'undefined') {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new C()
    for (const [n, url] of Object.entries(FILES) as [Name, string][]) {
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((b) => ctx!.decodeAudioData(b))
        .then((buf) => (buffers[n] = buf))
        .catch(() => {})
    }
  }
  return ctx
}

export function playSfx(name: Name) {
  const c = context()
  const buf = buffers[name]
  if (!c || !buf) return
  if (c.state === 'suspended') c.resume()
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = VOLUME[name]
  src.buffer = buf
  src.connect(gain).connect(c.destination)
  src.start()
}

if (typeof window !== 'undefined') {
  // Warm up on first interaction so the first tap already has its sound loaded.
  const warm = () => {
    context()?.resume()
    window.removeEventListener('pointerdown', warm, true)
  }
  window.addEventListener('pointerdown', warm, true)
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (!musicArea()) return
      const el = (e.target as HTMLElement | null)?.closest('button, a[href], [role="button"], [role="switch"]') as HTMLButtonElement | null
      if (!el || el.disabled || el.dataset.sfx === 'none') return
      playSfx('tap')
    },
    true,
  )
}
