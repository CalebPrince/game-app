import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, Play } from 'lucide-react'
import { useActiveChild } from './PlayShell'
import { SKILLS, worldsFor } from '../../lib/skills'
import { ACTIVITIES } from '../../lib/content'
import { BAND_LABEL, UNLOCK_AT, band, effectiveMastery, pct, unlocked } from '../../lib/engine'
import { Art, Bar } from '../../components/ui'

export function WorldView() {
  const child = useActiveChild()
  const nav = useNavigate()
  const { worldId } = useParams()
  const world = worldsFor(child.track).find((w) => w.id === worldId)
  if (!world) return null
  const acts = ACTIVITIES.filter((a) => a.track === child.track && world.skills.includes(a.skill))

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => nav('/play')} className="mb-3 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-brand">
        <ArrowLeft className="size-5" /> Map
      </button>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
        <Art src={world.art} alt={world.name} tone={world.color} className="aspect-square w-full rounded-3xl object-cover object-bottom ring-4 ring-white" />
        <div>
          <h1 className="font-display text-3xl font-bold">{world.name}</h1>
          <div className="mt-3 space-y-3">
            {world.skills.map((s) => {
              const m = child.mastery[s]
              const eff = effectiveMastery(m)
              return (
                <div key={s}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{SKILLS[s].label}</span>
                    <span className="text-ink-soft">
                      {BAND_LABEL[band(eff, m?.evidence ?? 0)]} · {pct(eff)}%
                    </span>
                  </div>
                  <Bar value={eff} color={SKILLS[s].color} height={10} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <h2 className="mt-6 mb-2 font-display text-xl font-semibold">Activities</h2>
      <div className="grid gap-3">
        {acts.map((a) => {
          const open = unlocked(child, a)
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-3xl bg-white p-3 shadow-[0_3px_0_#dbe5f3] ${open ? '' : 'opacity-70'}`}>
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${SKILLS[a.skill].color} 14%, white)` }}>
                <img src={a.icon} alt="" className="size-12 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-semibold">{a.title}</div>
                <div className="text-sm text-ink-soft">{open ? a.subtitle : `Unlocks when ${a.requires!.map((r) => SKILLS[r].label).join(' and ')} reach ${pct(UNLOCK_AT)}%`}</div>
              </div>
              {open ? (
                <button onClick={() => nav(`/activity/${a.id}`)} className="btn-game px-4 py-2.5" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
                  <Play className="size-4 fill-current" /> Start
                </button>
              ) : (
                <Lock className="mr-2 size-6 text-ink-faint" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
