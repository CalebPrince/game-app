import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useParentChild } from './ParentShell'
import { NoChild } from './Overview'
import { useStore } from '../../lib/store'
import { SKILLS, skillsFor } from '../../lib/skills'
import { ACTIVITIES } from '../../lib/content'
import { BAND_LABEL, band, daysSince, effectiveMastery, pct, unlocked } from '../../lib/engine'
import { Bar, Card, fmtDate } from '../../components/ui'
import type { SkillId } from '../../lib/types'

const DIFF = { 1: 'Foundation', 2: 'Core', 3: 'Stretch' } as const

export function ParentSkills() {
  const child = useParentChild()
  const attempts = useStore((s) => s.attempts)
  const skills = child ? skillsFor(child.track) : []
  const [sel, setSel] = useState<SkillId | null>(null)
  if (!child) return <NoChild />
  const skill = sel && skills.includes(sel) ? sel : skills[0]
  const meta = SKILLS[skill]
  const m = child.mastery[skill]
  const eff = effectiveMastery(m)
  const list = attempts.filter((a) => a.childId === child.id && a.skill === skill)
  const series = [...list].reverse().map((a) => ({ date: fmtDate(a.date), mastery: pct(a.masteryAfter), score: Math.round((a.correct / a.total) * 100) }))
  const tags = new Map<string, number>()
  list.forEach((a) => a.mistakes.forEach((t) => tags.set(t, (tags.get(t) ?? 0) + 1)))
  const weak = [...tags.entries()].sort((a, b) => b[1] - a[1])
  const strongTopics = list.filter((a) => a.correct / a.total >= 0.8).map((a) => a.topic)
  const acts = ACTIVITIES.filter((a) => a.skill === skill && a.track === child.track)
  const stale = m && daysSince(m.lastPracticed) > 10

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Skills Detail</h1>
      <p className="text-ink-soft">Detailed progress for each English skill.</p>
      <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
        {skills.map((s) => (
          <button key={s} onClick={() => setSel(s)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${s === skill ? 'text-white shadow' : 'bg-white text-ink-soft'}`} style={s === skill ? { background: SKILLS[s].color } : undefined}>
            {SKILLS[s].label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl font-semibold">{meta.label}</div>
              <div className="text-sm text-ink-soft">{meta.blurb}. World: {meta.world}.</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-bold" style={{ color: meta.color }}>
                {m?.evidence ? `${pct(eff)}%` : '–'}
              </div>
              <div className="text-xs font-bold text-ink-soft">{BAND_LABEL[band(eff, m?.evidence ?? 0)]}</div>
            </div>
          </div>
          <div className="mt-3">
            <Bar value={eff} color={meta.color} height={12} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl bg-sky p-2">
              <dt className="text-xs font-bold text-ink-soft">Questions answered</dt>
              <dd className="font-display text-xl font-semibold">{Math.round(m?.evidence ?? 0)}</dd>
            </div>
            <div className="rounded-2xl bg-sky p-2">
              <dt className="text-xs font-bold text-ink-soft">Current level</dt>
              <dd className="font-display text-xl font-semibold">{DIFF[m?.difficulty ?? 1]}</dd>
            </div>
            <div className="rounded-2xl bg-sky p-2">
              <dt className="text-xs font-bold text-ink-soft">Last practised</dt>
              <dd className="font-display text-xl font-semibold">{m?.lastPracticed ? fmtDate(m.lastPracticed) : '–'}</dd>
            </div>
          </dl>
          {stale && <p className="mt-3 rounded-xl bg-[#fff4e0] px-3 py-2 text-sm">Not practised for {Math.floor(daysSince(m!.lastPracticed))} days. Mastery is adjusted down slightly until it is reviewed, and a review is now recommended.</p>}
          <div className="mt-4 text-xs font-bold tracking-wide text-ink-faint uppercase">Activities for this skill</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {acts.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <img src={a.icon} alt="" className="size-6" /> <span className="font-semibold">{a.title}</span>
                <span className="text-ink-faint">· {unlocked(child, a) ? a.subtitle : 'Locked until earlier skills are stronger'}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Progress over time</h2>
          {series.length > 1 ? (
            <div className="mt-3 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid stroke="#e8eef7" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4a5b7d' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#8a98b4' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dbe5f3', fontSize: 13 }} />
                  <Line type="monotone" dataKey="score" name="Activity score %" stroke="#c4d1e6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="mastery" name="Mastery %" stroke={meta.color} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">The chart appears after two or more activities in this skill.</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-bold">Doing well</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {[...new Set(strongTopics)].slice(0, 4).map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-leaf" /> {t}
                  </li>
                ))}
                {!strongTopics.length && <li className="text-ink-soft">Not enough high scores yet.</li>}
              </ul>
            </div>
            <div>
              <div className="text-sm font-bold">Needs practice</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {weak.slice(0, 4).map(([t, n]) => (
                  <li key={t} className="flex gap-2">
                    <AlertCircle className="size-4 shrink-0 translate-y-0.5 text-coral" /> {t} <span className="text-ink-faint">({n}x)</span>
                  </li>
                ))}
                {!weak.length && <li className="text-ink-soft">No repeated mistakes.</li>}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-sky px-4 py-3 text-sm">
            <span className="font-bold">At home: </span>
            {meta.homeTip}
          </div>
        </Card>
      </div>
    </div>
  )
}
