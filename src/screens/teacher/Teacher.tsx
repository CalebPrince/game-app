import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ClipboardPlus, Trash2, Users, X } from 'lucide-react'
import { useStore } from '../../lib/store'
import { CLASS_INFO, seedClass, type ClassStudent } from '../../lib/seed'
import { JUNIOR_SKILLS, SKILLS } from '../../lib/skills'
import { ACTIVITIES } from '../../lib/content'
import { effectiveMastery, pct } from '../../lib/engine'
import { Bar, Card, fmtDate } from '../../components/ui'
import type { SkillId } from '../../lib/types'

const SHORT: Partial<Record<SkillId, string>> = { spelling: 'Spell', reading: 'Read', vocabulary: 'Vocab', grammar: 'Gram', speaking: 'Speak', writing: 'Write', listening: 'Listen' }
const overallOf = (s: ClassStudent) => JUNIOR_SKILLS.reduce((n, k) => n + (s.mastery[k] ?? 0), 0) / JUNIOR_SKILLS.length
const cell = (v: number) => (v >= 0.75 ? '#c9efd9' : v >= 0.55 ? '#fff0c7' : '#fdd6cf')

export function Teacher() {
  const nav = useNavigate()
  const children = useStore((s) => s.children)
  const attempts = useStore((s) => s.attempts)
  const assignments = useStore((s) => s.assignments)
  const assign = useStore((s) => s.assign)
  const unassign = useStore((s) => s.unassign)
  const [open, setOpen] = useState<ClassStudent | null>(null)
  const [modal, setModal] = useState(false)

  // Ama is a live learner in this class: her row comes from her real demo data.
  const students = useMemo(() => {
    const base = seedClass()
    const ama = children.find((c) => c.id === 'ama')
    if (ama) {
      const mine = attempts.filter((a) => a.childId === 'ama' && Date.now() - new Date(a.date).getTime() < 7 * 86400000)
      base.unshift({
        id: 'ama', name: 'Ama (live demo learner)', live: true,
        mastery: Object.fromEntries(JUNIOR_SKILLS.map((s) => [s, effectiveMastery(ama.mastery[s])])) as Partial<Record<SkillId, number>>,
        activitiesWeek: mine.length, minutesWeek: Math.round(mine.reduce((n, a) => n + a.durationSec, 0) / 60),
        lastActive: attempts.find((a) => a.childId === 'ama')?.date ?? new Date().toISOString(),
      })
    }
    return base
  }, [children, attempts])

  const avg = (s: SkillId) => students.reduce((n, x) => n + (x.mastery[s] ?? 0), 0) / students.length
  const classAvg = students.reduce((n, s) => n + overallOf(s), 0) / students.length
  const daysAway = (s: ClassStudent) => (Date.now() - new Date(s.lastActive).getTime()) / 86400000
  const support = students.filter((s) => overallOf(s) < 0.5 || daysAway(s) > 5)
  const activeWeek = students.filter((s) => daysAway(s) <= 7).length
  const weakest = [...JUNIOR_SKILLS].sort((a, b) => avg(a) - avg(b)).slice(0, 2)
  const amaTags = new Map<string, number>()
  attempts.filter((a) => a.childId === 'ama').forEach((a) => a.mistakes.forEach((t) => amaTags.set(t, (amaTags.get(t) ?? 0) + 1)))
  const commonMistakes = [
    { t: 'subject-verb agreement', n: 9 + (amaTags.get('subject-verb agreement') ?? 0) },
    { t: 'double consonants', n: 7 + (amaTags.get('double consonants') ?? 0) },
    { t: 'inference questions', n: 6 + (amaTags.get('inference') ?? 0) },
    { t: 'linking words in writing', n: 5 },
  ].sort((a, b) => b.n - a.n)

  return (
    <div className="min-h-dvh bg-[#f2f7fe] pb-24">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 md:px-8">
          <button onClick={() => nav('/')} className="grid size-10 place-items-center rounded-full bg-white/10" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <div className="text-xs font-bold tracking-wide text-white/60 uppercase">Teacher dashboard · {CLASS_INFO.school}</div>
            <div className="font-display text-2xl font-bold">
              {CLASS_INFO.name} <span className="text-white/75">· Basic {CLASS_INFO.grade} · Ghana NaCCA</span>
            </div>
          </div>
          <button onClick={() => setModal(true)} className="btn-game" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
            <ClipboardPlus className="size-5" /> Assign activity
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 md:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: 'Learners', v: students.length, c: 'var(--color-brand)' },
            { l: 'Class mastery', v: `${pct(classAvg)}%`, c: 'var(--color-leaf)' },
            { l: 'Active this week', v: `${activeWeek}/${students.length}`, c: 'var(--color-vocab)' },
            { l: 'Need support', v: support.length, c: 'var(--color-coral)' },
          ].map((x) => (
            <Card key={x.l} className="p-4">
              <div className="font-display text-3xl font-bold" style={{ color: x.c }}>
                {x.v}
              </div>
              <div className="text-sm font-semibold text-ink-soft">{x.l}</div>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="font-display text-xl font-semibold">Class skill mastery</h2>
            <div className="mt-4 space-y-3">
              {JUNIOR_SKILLS.map((s) => (
                <div key={s} className="grid grid-cols-[96px_1fr_36px] items-center gap-3 text-sm">
                  <span className="font-semibold">{SKILLS[s].label}</span>
                  <Bar value={avg(s)} color={SKILLS[s].color} />
                  <span className="text-right font-bold">{pct(avg(s))}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <AlertTriangle className="size-5 text-coral" /> Common difficulties
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {commonMistakes.map((m) => (
                <li key={m.t} className="flex justify-between rounded-xl bg-[#fdeeea] px-3 py-2">
                  <span className="font-semibold">{m.t}</span>
                  <span className="shrink-0 text-ink-soft">{m.n} this week</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-bold">Suggested revision:</span> whole-class lesson on {SKILLS[weakest[0]].label.toLowerCase()} and {SKILLS[weakest[1]].label.toLowerCase()}, the two lowest class averages.
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Assignments</h2>
            <div className="mt-3 space-y-2">
              {assignments.map((a) => {
                const act = ACTIVITIES.find((x) => x.id === a.activityId)
                const amaDone = attempts.some((x) => x.childId === 'ama' && x.activityId === a.activityId && x.date >= a.assignedAt)
                const done = 7 + (amaDone ? 1 : 0)
                return (
                  <div key={a.id} className="rounded-2xl border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{a.title}</div>
                        <div className="text-xs text-ink-soft">
                          {act?.title} · due {fmtDate(a.due)}
                        </div>
                      </div>
                      <button onClick={() => unassign(a.id)} className="text-ink-faint hover:text-coral" aria-label="Remove assignment">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                      <Bar value={done / students.length} color="var(--color-leaf)" height={8} />
                      {done}/{students.length}
                    </div>
                  </div>
                )
              })}
              {!assignments.length && <p className="text-sm text-ink-soft">No assignments yet.</p>}
            </div>
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden p-0">
          <div className="flex items-center gap-2 p-5 pb-3">
            <Users className="size-5 text-brand" />
            <h2 className="font-display text-xl font-semibold">Learners</h2>
            <span className="ml-auto text-xs text-ink-soft">Tap a learner for details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-sky text-left text-xs tracking-wide text-ink-soft uppercase">
                <tr>
                  <th className="px-4 py-2.5">Learner</th>
                  <th className="px-2 py-2.5">Overall</th>
                  {JUNIOR_SKILLS.map((s) => (
                    <th key={s} className="px-1 py-2.5 text-center" title={SKILLS[s].label}>
                      {SHORT[s]}
                    </th>
                  ))}
                  <th className="px-2 py-2.5">This week</th>
                  <th className="px-4 py-2.5">Last active</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const o = overallOf(s)
                  const flag = o < 0.5 || daysAway(s) > 5
                  return (
                    <tr key={s.id} onClick={() => setOpen(s)} className={`cursor-pointer border-t border-line hover:bg-sky/60 ${s.live ? 'bg-brand-soft/40' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold">
                        {s.name}
                        {flag && <span className="ml-2 rounded-full bg-[#fdeeea] px-2 py-0.5 text-[10px] font-black text-coral-dark uppercase">Support</span>}
                      </td>
                      <td className="px-2 py-2.5 font-bold">{pct(o)}%</td>
                      {JUNIOR_SKILLS.map((k) => (
                        <td key={k} className="px-1 py-1.5 text-center">
                          <span className="inline-block w-11 rounded-md py-1 text-xs font-bold" style={{ background: cell(s.mastery[k] ?? 0) }}>
                            {pct(s.mastery[k] ?? 0)}
                          </span>
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-ink-soft">
                        {s.activitiesWeek} acts · {s.minutesWeek}m
                      </td>
                      <td className={`px-4 py-2.5 ${daysAway(s) > 5 ? 'font-bold text-coral' : 'text-ink-soft'}`}>{fmtDate(s.lastActive)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy/50" onClick={() => setOpen(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">{open.name}</h3>
              <button onClick={() => setOpen(null)} aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
            <p className="text-sm text-ink-soft">
              Overall mastery {pct(overallOf(open))}% · last active {fmtDate(open.lastActive)}
            </p>
            <div className="mt-4 space-y-3">
              {JUNIOR_SKILLS.map((s) => (
                <div key={s}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{SKILLS[s].label}</span>
                    <span>{pct(open.mastery[s] ?? 0)}%</span>
                  </div>
                  <Bar value={open.mastery[s] ?? 0} color={SKILLS[s].color} />
                </div>
              ))}
            </div>
            {(() => {
              const low = [...JUNIOR_SKILLS].sort((a, b) => (open.mastery[a] ?? 0) - (open.mastery[b] ?? 0))[0]
              const act = ACTIVITIES.find((a) => a.skill === low && a.track === 'junior')!
              return (
                <div className="mt-5 rounded-2xl bg-sky p-4 text-sm">
                  <div className="font-bold">Recommended targeted practice</div>
                  <p className="mt-1">
                    {SKILLS[low].label} is this learner's weakest area. Assign <span className="font-semibold">{act.title}</span> and check in during class.
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {modal && <AssignModal onClose={() => setModal(false)} onAssign={(a) => (assign(a), setModal(false))} />}
    </div>
  )
}

function AssignModal({ onClose, onAssign }: { onClose: () => void; onAssign: (a: { id: string; activityId: string; title: string; due: string; assignedAt: string }) => void }) {
  const acts = ACTIVITIES.filter((a) => a.track === 'junior')
  const [activityId, setActivityId] = useState(acts[0].id)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
  const act = acts.find((a) => a.id === activityId)!
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
      <div className="pop w-full max-w-md rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold">Assign activity</h3>
          <button onClick={onClose} aria-label="Close">
            <X className="size-6" />
          </button>
        </div>
        <p className="text-sm text-ink-soft">Sent to every learner in {CLASS_INFO.name}. It appears in their Missions.</p>
        <label className="mt-4 block text-sm font-bold">
          Activity
          <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold">
            {acts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({SKILLS[a.skill].label})
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-bold">
          Title for learners
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${act.title} practice`} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold" />
        </label>
        <label className="mt-3 block text-sm font-bold">
          Due date
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold" />
        </label>
        <button
          onClick={() => onAssign({ id: `as${Date.now()}`, activityId, title: title.trim() || `${act.title} practice`, due: new Date(due).toISOString(), assignedAt: new Date().toISOString() })}
          className="btn-game mt-5 w-full"
          style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}
        >
          Assign to class
        </button>
      </div>
    </div>
  )
}
