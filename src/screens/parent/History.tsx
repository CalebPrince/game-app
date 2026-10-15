import { useState } from 'react'
import { useParentChild } from './ParentShell'
import { NoChild } from './Overview'
import { useStore } from '../../lib/store'
import { SKILLS, skillsFor } from '../../lib/skills'
import { Card, fmtDate, fmtMins } from '../../components/ui'
import { inRange } from './stats'

const scoreColor = (r: number) => (r >= 0.8 ? 'text-leaf-dark' : r >= 0.6 ? 'text-spell' : 'text-coral')

export function ParentHistory() {
  const child = useParentChild()
  const attempts = useStore((s) => s.attempts)
  const [skill, setSkill] = useState('all')
  const [days, setDays] = useState(14)
  if (!child) return <NoChild />
  const list = attempts.filter((a) => a.childId === child.id && (skill === 'all' || a.skill === skill) && inRange(a, days))

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Activity History</h1>
          <p className="text-ink-soft">What {child.name} has been learning and how they performed.</p>
        </div>
        <div className="flex gap-2">
          <select value={skill} onChange={(e) => setSkill(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold">
            <option value="all">All skills</option>
            {skillsFor(child.track).map((s) => (
              <option key={s} value={s}>
                {SKILLS[s].label}
              </option>
            ))}
          </select>
          <select value={days} onChange={(e) => setDays(+e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold">
            <option value={7}>This week</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <table className="hidden w-full text-sm md:table">
          <thead className="bg-sky text-left text-xs tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Hints</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Mistakes in</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{fmtDate(a.date)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: SKILLS[a.skill].color }} />
                    {a.title}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{a.topic}</td>
                <td className={`px-4 py-3 font-bold ${scoreColor(a.correct / a.total)}`}>
                  {a.practiceOnly ? 'Practice' : `${Math.round((a.correct / a.total) * 100)}%`}
                </td>
                <td className="px-4 py-3 text-ink-soft">{a.hints || '–'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{fmtMins(a.durationSec)}</td>
                <td className="px-4 py-3 text-xs text-ink-soft">{[...new Set(a.mistakes)].join(', ') || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divide-y divide-line md:hidden">
          {list.map((a) => (
            <div key={a.id} className="flex gap-3 p-4">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: SKILLS[a.skill].color }} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{a.title}</span>
                  <span className={`font-bold ${scoreColor(a.correct / a.total)}`}>{a.practiceOnly ? 'Practice' : `${Math.round((a.correct / a.total) * 100)}%`}</span>
                </div>
                <div className="text-sm text-ink-soft">{a.topic}</div>
                <div className="mt-1 text-xs text-ink-faint">
                  {fmtDate(a.date)} · {fmtMins(a.durationSec)}
                  {a.mistakes.length > 0 && ` · Mistakes: ${[...new Set(a.mistakes)].join(', ')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="p-6 text-center text-ink-soft">No activities in this period.</p>}
      </Card>
    </div>
  )
}
