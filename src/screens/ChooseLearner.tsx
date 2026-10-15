import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Lock, Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from '../components/ui'
import { learnerLabel } from '../lib/skills'
import { level } from '../lib/engine'
import { setLearnerContext, track } from '../lib/analytics'

export function ChooseLearner() {
  const nav = useNavigate()
  const children = useStore((s) => s.children)
  const setActive = useStore((s) => s.setActiveChild)
  const tints = ['#dcf5e6', '#e3edff', '#efe6ff', '#ffead6', '#ffe2ea']
  return (
    <div className="min-h-dvh bg-sky">
      <div className="mx-auto max-w-xl px-4 pt-5 pb-28">
        <button onClick={() => nav('/')} className="grid size-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="mt-4 text-center font-display text-3xl font-bold">Who's learning today?</h1>
        <p className="mt-1 text-center text-ink-soft">Tap your picture to continue your adventure.</p>

        <div className="mt-6 grid gap-3">
          {children.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c.id)
                const sample = c.id === 'ama' || c.id === 'kofi'
                setLearnerContext({ track: c.track, grade: c.grade, age: c.age, curriculum: c.curriculum, sample })
                track('learner_selected', { track: c.track, grade: c.grade ?? null, age: c.age ?? null, curriculum: c.curriculum, sample_profile: sample })
                nav('/play')
              }}
              className="rise flex items-center gap-4 rounded-3xl border-2 border-white p-3 pr-4 text-left shadow-[0_3px_0_#d3dff0] transition hover:-translate-y-0.5"
              style={{ background: tints[i % tints.length], animationDelay: `${i * 60}ms` }}
            >
              <Avatar avatar={c.avatar} size={72} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl font-semibold">{c.name}</div>
                <div className="text-sm font-semibold text-ink-soft">{learnerLabel(c)}</div>
                <div className="mt-0.5 text-xs font-bold text-brand">Level {level(c.xp).level}</div>
              </div>
              <ChevronRight className="size-6 text-ink-soft" />
            </button>
          ))}
        </div>

        <button onClick={() => nav('/parent/add')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink-faint/50 py-4 font-display text-lg font-semibold text-ink-soft hover:border-brand hover:text-brand">
          <Plus className="size-5" /> Add a learner
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <Lock className="size-3.5" /> New learners are created by a parent or teacher.
        </p>
      </div>
    </div>
  )
}
