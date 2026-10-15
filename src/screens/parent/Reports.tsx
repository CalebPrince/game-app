import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useParentChild } from './ParentShell'
import { NoChild, Delta } from './Overview'
import { useStore } from '../../lib/store'
import { SKILLS, curriculumLabel, learnerLabel, skillsFor } from '../../lib/skills'
import { effectiveMastery, overallMastery, pct, recommend, strengthsAndNeeds } from '../../lib/engine'
import { badgeDef } from '../../lib/rewards'
import { Bar, Card, fmtMins } from '../../components/ui'
import { dailySeries, periodStats } from './stats'
import { track } from '../../lib/analytics'

export function ParentReports() {
  const child = useParentChild()
  const attempts = useStore((s) => s.attempts)
  const [period, setPeriod] = useState<7 | 30>(7)
  const [shared, setShared] = useState('')
  if (!child) return <NoChild />
  const cur = periodStats(attempts, child, period)
  const prev = periodStats(attempts, child, period, period)
  const overall = overallMastery(child)
  const series = dailySeries(attempts, child, period === 7 ? 7 : 14)
  const { strengths, needs, patterns } = strengthsAndNeeds(child, cur.list)
  const recs = recommend(child, 3)
  const label = period === 7 ? 'Weekly' : 'Monthly'
  const newBadges = child.badges.slice(-3)

  const summary = `${child.name}'s ${label.toLowerCase()} English report: ${cur.list.length} activities, ${fmtMins(cur.secs)} of learning, ${Math.round(cur.accuracy * 100)}% correct answers, overall mastery ${pct(overall)}%. Strengths: ${strengths.map((s) => SKILLS[s.skill].label).join(', ') || 'building'}. Next focus: ${recs.map((r) => r.activity.title).join(', ')}.`

  const share = async () => {
    track('report_shared', { period })
    try {
      if (navigator.share) await navigator.share({ title: `${child.name}'s English Adventure report`, text: summary })
      else {
        await navigator.clipboard.writeText(summary)
        setShared('Summary copied. Paste it into WhatsApp, SMS or email.')
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div>
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Learning Report</h1>
          <p className="text-ink-soft">Download or share a progress report.</p>
        </div>
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {([7, 30] as const).map((p) => (
            <button key={p} onClick={() => {
                setPeriod(p)
                track('report_period_changed', { period: p })
              }} className={`rounded-full px-4 py-1.5 text-sm font-bold ${period === p ? 'bg-brand text-white' : 'text-ink-soft'}`}>
              {p === 7 ? 'This week' : 'This month'}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-bold tracking-wide text-ink-faint uppercase">English Adventure · {label} report</div>
            <div className="font-display text-2xl font-bold">{child.name}</div>
            <div className="text-sm text-ink-soft">
              {learnerLabel(child)} · {curriculumLabel(child)}
            </div>
          </div>
          <div className="text-right text-sm text-ink-soft">
            {new Date(Date.now() - period * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { l: 'Overall mastery', v: `${pct(overall)}%`, d: <Delta v={pct(cur.masteryDelta)} unit="%" /> },
            { l: 'Time spent', v: fmtMins(cur.secs), d: <Delta v={Math.round((cur.secs - prev.secs) / 60)} unit=" min" /> },
            { l: 'Activities', v: cur.list.length, d: <Delta v={cur.list.length - prev.list.length} /> },
            { l: 'Correct answers', v: `${Math.round(cur.accuracy * 100)}%`, d: <Delta v={Math.round((cur.accuracy - prev.accuracy) * 100)} unit="%" /> },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-sky p-3">
              <div className="text-xs font-bold text-ink-soft">{x.l}</div>
              <div className="font-display text-2xl font-bold">{x.v}</div>
              {x.d}
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Skill breakdown</h2>
            <div className="mt-3 space-y-2.5">
              {skillsFor(child.track).map((s) => (
                <div key={s} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm">
                  <span className="font-semibold">{SKILLS[s].label}</span>
                  <Bar value={effectiveMastery(child.mastery[s])} color={SKILLS[s].color} />
                  <span className="text-right font-bold">{pct(effectiveMastery(child.mastery[s]))}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Daily learning time</h2>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ left: -24, right: 4, top: 8 }}>
                  <CartesianGrid stroke="#e8eef7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#4a5b7d' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a98b4' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dbe5f3', fontSize: 13 }} />
                  <RBar dataKey="minutes" name="Minutes" fill="#1f6bff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Strengths</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{strengths.length ? strengths.map((s) => <li key={s.skill}>{s.text}</li>) : <li>Building up evidence</li>}</ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Needs practice</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {needs.map((s) => (
                <li key={s.skill}>{s.text}</li>
              ))}
              {patterns.slice(0, 3).map((p) => (
                <li key={p.pattern}>Mistakes with {p.pattern}</li>
              ))}
              {!needs.length && !patterns.length && <li>No concerns this period</li>}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Recommendations</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {recs.map((r) => (
                <li key={r.activity.id}>
                  <span className="font-semibold">{r.activity.title}</span>: {r.reason.toLowerCase()}
                </li>
              ))}
              {needs.slice(0, 1).map((n) => (
                <li key={n.skill}>At home: {SKILLS[n.skill].homeTip}</li>
              ))}
            </ul>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-sm font-bold">Achievements:</span>
            {newBadges.map((b) => (
              <span key={b} className="flex items-center gap-1.5 rounded-full bg-[#fff6dc] py-1 pr-3 pl-1 text-xs font-bold">
                <img src={badgeDef(b).art} alt="" className="size-6" /> {badgeDef(b).name}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="no-print mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button onClick={share} className="btn-game" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-brand)' }}>
          <Share2 className="size-5" /> Share summary
        </button>
        <button
          onClick={() => {
            track('report_downloaded', { period })
            window.print()
          }}
          className="btn-game"
        >
          <Download className="size-5" /> Download report (PDF)
        </button>
      </div>
      {shared && <p className="no-print mt-2 text-right text-sm font-semibold text-leaf-dark">{shared}</p>}
      <p className="no-print mt-1 text-right text-xs text-ink-faint">Download opens your browser's print dialog. Choose "Save as PDF".</p>
    </div>
  )
}
