import { useState, type CSSProperties, type ReactNode } from 'react'
import { ImageOff, Volume2 } from 'lucide-react'
import { speak } from '../lib/speech'
import { itemArt } from '../lib/rewards'
import type { AvatarConfig } from '../lib/types'

/** Image with a soft placeholder when the file has not been generated yet. */
export function Art({ src, alt = '', className = '', style, tone = 'var(--color-brand)' }: { src: string; alt?: string; className?: string; style?: CSSProperties; tone?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className={`grid place-items-center rounded-2xl ${className}`} style={{ ...style, background: `color-mix(in oklab, ${tone} 14%, white)`, color: tone }} title={`Missing art: ${src}`}>
        <ImageOff className="size-6 opacity-60" />
      </div>
    )
  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} draggable={false} />
}

export function Avatar({ avatar, size = 56, ring = 'white', showItem = true }: { avatar: AvatarConfig; size?: number; ring?: string; showItem?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="overflow-hidden rounded-full" style={{ width: size, height: size, background: 'linear-gradient(160deg,#ffe7a6,#ffc979)', boxShadow: `0 0 0 3px ${ring}` }}>
        <img src={`images/sheet/heads/${avatar.base}.png`} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" style={{ transform: 'scale(1.08) translateY(6%)' }} />
      </div>
      {showItem && avatar.item && (
        <span className="absolute -right-1 -bottom-1 grid place-items-center rounded-full bg-white shadow" style={{ width: size * 0.42, height: size * 0.42 }}>
          <img src={itemArt(avatar.item)} alt="" className="w-[80%]" />
        </span>
      )}
    </div>
  )
}

export function Bar({ value, color = 'var(--color-brand)', height = 10, track = '#e3eaf5' }: { value: number; color?: string; height?: number; track?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height, background: track }}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: color }} />
    </div>
  )
}

export const icon = (n: string) => `images/sheet/icons/${n}.png`

export function CoinChip({ coins, dark = false }: { coins: number; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 font-display font-semibold ${dark ? 'bg-white/15 text-white' : 'bg-white text-ink shadow-sm'}`}>
      <img src={icon('coin')} alt="" className="size-6" />
      {coins}
    </span>
  )
}

export function SpeakButton({ text, size = 44, className = '', label = 'Listen' }: { text: string; size?: number; className?: string; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={() => speak(text)} className={`grid shrink-0 place-items-center rounded-full bg-white text-brand shadow-[0_3px_0_#c8d6ee] ring-2 ring-line transition active:translate-y-0.5 ${className}`} style={{ width: size, height: size }}>
      <Volume2 style={{ width: size * 0.5, height: size * 0.5 }} />
    </button>
  )
}

export function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const s = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-3xl' : 'text-xl'
  return (
    <div className={`font-display leading-[0.9] font-bold ${s}`} style={{ textShadow: light ? 'none' : '0 3px 0 #0d3b9e' }}>
      <span style={{ color: '#ffc22e', WebkitTextStroke: light ? '0' : '1.5px #0d3b9e' }}>English</span>
      <br />
      <span style={{ color: light ? 'white' : '#fff', WebkitTextStroke: light ? '0' : '1.5px #0d3b9e' }}>Adventure</span>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-5 shadow-[0_2px_0_#dbe5f3,0_10px_30px_-18px_rgba(18,38,79,.35)] ${className}`}>{children}</div>
}

export function Companion({ text, speakIt = false, compact = false }: { text: string; speakIt?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <img src="images/sheet/mascots/owl.png" alt="Ollie the owl" className={`${compact ? 'w-12' : 'w-16'} shrink-0 bob`} />
      <div className="relative mb-2 rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-snug font-semibold text-ink shadow-[0_2px_0_#dbe5f3]">
        {text}
        {speakIt && (
          <button onClick={() => speak(text)} className="ml-2 inline-flex translate-y-0.5 text-brand" aria-label="Read aloud">
            <Volume2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function Pill({ children, color = 'var(--color-brand)' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `color-mix(in oklab, ${color} 14%, white)`, color: `color-mix(in oklab, ${color} 80%, black)` }}>
      {children}
    </span>
  )
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
export function fmtMins(sec: number) {
  const m = Math.round(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`
}
