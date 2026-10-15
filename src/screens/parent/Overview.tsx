import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Flame, Home, Lightbulb } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useParentChild } from './ParentShell'
import { useStore } from '../../lib/store'
import { SKILLS, curriculumLabel, learnerLabel, skillsFor } from '../../lib/skills'
import { effectiveMastery, level, overallMastery, pct, recommend, strengthsAndNeeds } from '../../lib/engine'
import { badgeDef, streakDays } from '../../lib/rewards'
import { Art, Avatar, Bar, Card, fmtMins } from '../../components/ui'
import { dailySeries, periodStats } from './stats'

export function Delta({ v, unit = '', invertGood = false }: { v: number; unit?: string; invertGood?: boolean }) {
  const up = v >= 0
  const good = invertGood ? !up : up
  const I = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${good ? 'text-leaf-dark' : 'text-coral'}`}>
      <I className="size-3.5" /> {up ? '+' : ''}
      {v}
      {unit}
    </span>
  )
}

export function NoChild() {
  return (
    <Card className="text-center">
      <p className="text-ink-soft">No learner yet.</p>
      <Link to="/parent/add" className="btn-game mt-3">
        Add a learner
      </Link>
    </Card>
  )
}

export function ParentOverview() {
  const child = useParentChild()
  const attempts = useStore((s) => s.attempts)
  const nav = useNavigate()
  if (!child) return <NoChild />
  const lv = level(child.xp)
  const wk = periodStats(attempts, child, 7)
  const prev = periodStats(attempts, child, 7, 7)
  const overall = overallMastery(child)
  const streak = streakDays(attempts, child.id)
  const series = dailySeries(attempts, child, 7)
  const recs = recommend(child, 3)
  const mine = attempts.filter((a) => a.childId === child.id)
  const { strengths, needs, patterns } = strengthsAndNeeds(child, mine)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Overall mastery', value: `${pct(overall)}%`, delta: <Delta v={pct(wk.masteryDelta)} unit="% this week" />, color: 'var(--color-leaf)' },
    { label: 'Activities completed', value: wk.list.length, delta: <Delta v={wk.list.length - prev.list.length} unit=" vs last week" />, color: 'var(--color-brand)' },
    { label: 'Learning time', value: fmtMins(wk.secs), delta: <Delta v={Math.round((wk.secs - prev.secs) / 60)} unit=" min" />, color: 'var(--color-vocab)' },
    { label: 'Day streak', value: streak, delta: <span className="inline-flex items-center gap-1 text-xs font-bold text-spell"><Flame className="size-3.5" /> {wk.activeDays} active days this week</span>, color: 'var(--color-spell)' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-bold md:text-4xl">{greet}!</h1>
      <p className="text-ink-soft">Here is {child.name}'s English learning progress.</p>

      <div className="relative mt-5 overflow-hidden rounded-[28px] bg-navy text-white">
        <Art src="images/map-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e2350]/95 via-[#0e2350]/75 to-[#0e2350]/20" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar avatar={child.avatar} size={92} ring="rgba(255,255,255,.9)" />
          <div className="flex-1">
            <div className="font-display text-3xl font-bold">{child.name}</div>
            <div className="font-semibold text-white/90">{learnerLabel(child)}</div>
            <div className="text-sm font-semibold text-sun">{curriculumLabel(child)}</div>
          </div>
          <div className="rounded-2xl bg-white/95 p-4 text-ink sm:w-64">
            <div className="flex items-center gap-3">
              <img src="images/sheet/icons/rewards.png" alt="" className="size-10" />
              <div>
                <div className="text-xs font-bold text-ink-soft">Current level</div>
                <div className="font-display text-2xl font-bold">Level {lv.level}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Bar value={lv.into / lv.per} color="var(--color-leaf)" />
              <span className="text-xs font-bold whitespace-nowrap text-ink-soft">
                {lv.into}/{lv.per} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="font-display text-3xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-sm font-semibold text-ink-soft">{s.label}</div>
            <div className="mt-1">{s.delta}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Skill mastery</h2>
            <Link to="/parent/skills" className="flex items-center gap-1 text-sm font-bold text-brand">
              See details <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3.5">
            {skillsFor(child.track).map((s) => {
              const m = child.mastery[s]
              const eff = effectiveMastery(m)
              return (
                <div key={s} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: SKILLS[s].color }} />
                    {SKILLS[s].label}
                  </span>
                  <Bar value={eff} color={SKILLS[s].color} height={10} />
                  <span className="text-right font-bold">{m?.evidence ? `${pct(eff)}%` : '–'}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-ink-faint">Mastery measures independent, lasting understanding. It is separate from stars and coins, which reward effort.</p>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Progress this week</h2>
          <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid stroke="#e8eef7" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#4a5b7d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#8a98b4' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dbe5f3', fontSize: 13 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="accuracy" name="Correct answers (%)" stroke="#1fae6a" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="minutes" name="Time spent (mins)" stroke="#1f6bff" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-display text-xl font-semibold">Strengths</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {strengths.length ? strengths.map((s) => <li key={s.skill} className="rounded-xl bg-[#e6f8ee] px-3 py-2 font-semibold">{s.text}</li>) : <li className="text-ink-soft">Strengths appear after a few more activities.</li>}
          </ul>
          <h2 className="mt-5 font-display text-xl font-semibold">Needs practice</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {needs.map((s) => (
              <li key={s.skill} className="rounded-xl bg-[#fff1e3] px-3 py-2 font-semibold">
                {s.text}
              </li>
            ))}
            {patterns.slice(0, 3).map((p) => (
              <li key={p.pattern} className="rounded-xl bg-[#fdeeea] px-3 py-2">
                Frequent mistake: <span className="font-bold">{p.pattern}</span> ({p.count}x)
              </li>
            ))}
            {!needs.length && !patterns.length && <li className="text-ink-soft">Nothing stands out. Great work!</li>}
          </ul>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Lightbulb className="size-5 text-sun-dark" /> Recommended next
          </h2>
          <div className="mt-3 space-y-2.5">
            {recs.map((r) => (
              <div key={r.activity.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
                <img src={r.activity.icon} alt="" className="size-10 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{r.activity.title}</div>
                  <div className="text-xs text-ink-soft">{r.reason}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">These appear as {child.name}'s daily missions in the app.</p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Home className="size-5 text-brand" /> Practise at home
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {(needs.length ? needs.map((n) => n.skill) : recs.map((r) => r.activity.skill)).slice(0, 3).map((s) => (
              <li key={s} className="rounded-2xl bg-sky px-3 py-2.5">
                <div className="text-xs font-bold" style={{ color: SKILLS[s].color }}>
                  {SKILLS[s].label}
                </div>
                {SKILLS[s].homeTip}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-bold tracking-wide text-ink-faint uppercase">Recent achievements</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {child.badges.slice(-4).reverse().map((b) => {
              const d = badgeDef(b)
              return (
                <span key={b} className="flex items-center gap-1.5 rounded-full bg-[#fff6dc] py-1 pr-3 pl-1 text-xs font-bold" title={d.desc}>
                  <img src={d.art} alt="" className="size-6" /> {d.name}
                </span>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 text-right">
        <button onClick={() => nav('/parent/history')} className="inline-flex items-center gap-1 text-sm font-bold text-brand">
          View full activity history <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
