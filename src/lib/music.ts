// Looping background music for the child experience.
// - Starts on the first tap/click (browsers block autoplay with sound).
// - Ducks under narration, pauses while the microphone listens, and is off in parent/teacher portals.
// - The on/off choice is remembered per device.
import { useSyncExternalStore } from 'react'

const SRC = 'audio/music/adventure-loop.mp3'
const BASE = 0.1
const DUCKED = 0.025
const KEY = 'ea-music'

let audio: HTMLAudioElement | null = null
let enabled = true
let allowedHere = true
let ducks = 0
let holds = 0
let unlocked = false
const subs = new Set<() => void>()

try {
  enabled = localStorage.getItem(KEY) !== 'off'
} catch {
  /* storage blocked: default on */
}

function el() {
  if (!audio && typeof window !== 'undefined') {
    audio = new Audio(SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = BASE
    if (import.meta.env.DEV) (window as unknown as { __eaMusic: HTMLAudioElement }).__eaMusic = audio
  }
  return audio
}

function fadeTo(v: number) {
  const a = el()
  if (!a) return
  clearInterval(fadeTimer)
  const start = a.volume
  const t0 = Date.now()
  // dips fast (a tap is only a quarter of a second), comes back gently
  const ms = v < start ? 60 : 350
  fadeTimer = window.setInterval(() => {
    const k = Math.min(1, (Date.now() - t0) / ms)
    a.volume = start + (v - start) * k
    if (k >= 1) clearInterval(fadeTimer)
  }, 30)
}
let fadeTimer = 0

function sync() {
  const a = el()
  if (!a) return
  const shouldPlay = enabled && allowedHere && unlocked && holds === 0
  if (shouldPlay) {
    if (a.paused) a.play().catch(() => {})
    fadeTo(ducks > 0 ? DUCKED : BASE)
  } else if (!a.paused) a.pause()
  subs.forEach((f) => f())
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    unlocked = true
    sync()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio?.pause()
    else sync()
  })
}

/** True in the child-facing app (music and tap sounds), false in parent/teacher portals. */
export const musicArea = () => allowedHere

export const music = {
  setEnabled(v: boolean) {
    enabled = v
    try {
      localStorage.setItem(KEY, v ? 'on' : 'off')
    } catch {
      /* ignore */
    }
    sync()
  },
  /** Called on route change: music only plays in the child-facing app. */
  setAllowed(v: boolean) {
    allowedHere = v
    sync()
  },
  duck(on: boolean) {
    ducks = Math.max(0, ducks + (on ? 1 : -1))
    sync()
  },
  /** Fully pause (e.g. while the microphone is listening). */
  hold(on: boolean) {
    holds = Math.max(0, holds + (on ? 1 : -1))
    sync()
  },
}

export function useMusicEnabled() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => enabled,
    () => enabled,
  )
}
