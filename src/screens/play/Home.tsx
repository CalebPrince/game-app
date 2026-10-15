import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Play } from 'lucide-react'
import { useActiveChild } from './PlayShell'
import { worldsFor, type World } from '../../lib/skills'
import { effectiveMastery, recommend, unlocked } from '../../lib/engine'
import { ACTIVITIES, VOICE } from '../../lib/content'
import { Art, Companion } from '../../components/ui'
import { speakSeq } from '../../lib/speech'
import type { Child } from '../../lib/types'

export const worldUnlocked = (child: Child, w: World) => ACTIVITIES.some((a) => a.track === child.track && w.skills.includes(a.skill) && unlocked(child, a))
export const worldMastery = (child: Child, w: World) => w.skills.reduce((n, s) => n + effectiveMastery(child.mastery[s]), 0) / w.skills.length

export function Home() {
  const child = useActiveChild()
  const nav = useNavigate()
  const worlds = worldsFor(child.track)
  const rec = recommend(child, 1)[0]
  const little = child.track === 'little'
  const greeting = rec
    ? little
      ? VOICE.letsPlay(rec.activity.title)
      : `${rec.reason}. Try ${rec.activity.title} next.`
    : VOICE.pickWorld
  const spoke = useRef(false)
  useEffect(() => {
    if (little && !spoke.current) {
      const t = setTimeout(() => {
        spoke.current = true
        speakSeq([VOICE.hi(child.name), greeting])
      }, 600)
      return () => clearTimeout(t)
    }
  }, [little, child.name, greeting])

  return (
    <div>
      <div className="relative overflow-hidden rounded-[28px] ring-4 ring-white">
        <Art src="images/map-bg.webp" alt="" className="h-36 w-full object-cover md:h-48" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e2350]/70 via-transparent to-transparent" />
        <div className="absolute right-4 bottom-3 left-4 flex items-end justify-between gap-3 text-white">
          <div>
            <div className="text-xs font-bold tracking-wider uppercase opacity-80">{little ? 'My Learning World' : 'Adventure Map'}</div>
            <div className="font-display text-2xl font-semibold">{little ? 'Little Explorers' : 'Junior Explorers'}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <Companion text={greeting} speakIt={little} />
      </div>

      <Trail worlds={worlds} child={child} onOpen={(id) => nav(`/play/world/${id}`)} />
      <div className="h-20 md:hidden" />
      {rec && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-20 px-4 md:static md:mt-2 md:px-0">
          <div className="pointer-events-auto mx-auto max-w-md">
            <button onClick={() => nav(`/activity/${rec.activity.id}`)} className={`btn-game w-full ${little ? 'py-4 text-2xl' : 'text-xl'}`}>
              <Play className="size-6 fill-current" /> Continue Adventure
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Worlds in normal document flow, alternating left and right (so cards can never overlap other
 * content), with the dotted trail drawn behind them from their measured centres.
 */
function Trail({ worlds, child, onOpen }: { worlds: World[]; child: Child; onOpen: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLButtonElement | null)[]>([])
  const [path, setPath] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const draw = () => {
      const b = el.getBoundingClientRect()
      const pts = cards.current.filter(Boolean).map((c) => {
        const r = c!.getBoundingClientRect()
        return [r.left - b.left + r.width / 2, r.top - b.top + r.height * 0.45] as const
      })
      setSize({ w: b.width, h: b.height })
      setPath(
        pts
          .map(([x, y], i) => {
            if (i === 0) return `M ${x} ${y}`
            const [px, py] = pts[i - 1]
            const dy = (y - py) * 0.6
            return `C ${px} ${py + dy}, ${x} ${y - dy}, ${x} ${y}`
          })
          .join(' '),
      )
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [worlds.length])

  return (
    <div ref={box} className="relative mx-auto mt-4 max-w-xl">
      <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden>
        <path d={path} fill="none" stroke="#8fb0e6" strokeWidth="9" className="trail" />
      </svg>
      {worlds.map((w, i) => {
        const open = worldUnlocked(child, w)
        const mastery = worldMastery(child, w)
        return (
          <div key={w.id} className={`relative flex ${i % 2 ? 'justify-end' : 'justify-start'} ${i ? '-mt-16 sm:-mt-28' : ''}`}>
            <button
              ref={(el) => {
                cards.current[i] = el
              }}
              disabled={!open}
              onClick={() => onOpen(w.id)}
              className="group w-[46%] max-w-[230px] text-left disabled:cursor-not-allowed"
            >
              <div className={`relative overflow-hidden rounded-3xl bg-white p-1.5 shadow-[0_5px_0_#c7d6ee,0_16px_30px_-18px_rgba(18,38,79,.6)] transition group-hover:-translate-y-1 ${open ? '' : 'grayscale-[.85]'}`}>
                <Art src={w.art} alt={w.name} tone={w.color} className="aspect-square w-full rounded-[20px] object-cover object-bottom" />
                {!open && (
                  <div className="absolute inset-1.5 bottom-12 grid place-items-center rounded-[20px] bg-navy/35">
                    <span className="grid size-12 place-items-center rounded-full bg-white/95 text-ink shadow">
                      <Lock className="size-6" />
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-1.5 pt-1.5 pb-1">
                  <span className="text-[11px] font-black text-ink-faint">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold md:text-base">{w.name}</span>
                </div>
                <div className="mx-1.5 mb-1 h-2 overflow-hidden rounded-full bg-[#e3eaf5]">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(mastery * 100)}%`, background: w.color }} />
                </div>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
