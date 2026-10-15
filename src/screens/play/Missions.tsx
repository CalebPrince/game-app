import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { playSfx } from '../../lib/sfx'
import { Check, ClipboardList } from 'lucide-react'
import { useActiveChild } from './PlayShell'
import { recommend } from '../../lib/engine'
import { useStore } from '../../lib/store'
import { activityById } from '../../lib/content'
import { SKILLS } from '../../lib/skills'
import { Card, icon } from '../../components/ui'

const BONUS = { xp: 50, coins: 20 }

export function Missions() {
  const child = useActiveChild()
  const nav = useNavigate()
  const attempts = useStore((s) => s.attempts)
  const assignments = useStore((s) => s.assignments)
  const claim = useStore((s) => s.claimMissions)
  const today = new Date().toISOString().slice(0, 10)
  const doneToday = new Set(attempts.filter((a) => a.childId === child.id && a.date.startsWith(today)).map((a) => a.activityId))

  // Missions are fixed for the day: today's recommendations, keeping completed ones in place.
  const recs = recommend(child, 6)
  const missions = [...recs.filter((r) => doneToday.has(r.activity.id)), ...recs.filter((r) => !doneToday.has(r.activity.id))].slice(0, 3)
  const done = missions.filter((m) => doneToday.has(m.activity.id)).length
  const claimed = child.missionsClaimed.includes(today)
  const inClass = child.id === 'ama' // Ama is in the demo teacher's class

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-center font-display text-3xl font-bold">Today's Missions</h1>
      <p className="mt-1 text-center text-ink-soft">Complete 3 activities to earn your bonus!</p>

      <div className="mt-5 grid gap-3">
        {missions.map((m, i) => {
          const isDone = doneToday.has(m.activity.id)
          return (
            <div key={m.activity.id} className="rise flex items-center gap-3 rounded-3xl bg-white p-3 shadow-[0_3px_0_#dbe5f3]" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${SKILLS[m.activity.skill].color} 15%, white)` }}>
                <img src={m.activity.icon} alt="" className="size-10 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-semibold">{m.activity.title}</div>
                <div className="text-xs text-ink-soft">{m.reason}</div>
              </div>
              {isDone ? (
                <span className="grid size-11 place-items-center rounded-full bg-leaf text-white">
                  <Check className="size-6" strokeWidth={3} />
                </span>
              ) : (
                <button onClick={() => nav(`/activity/${m.activity.id}`)} className="btn-game px-4 py-2">
                  Start
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Card className="mt-4 flex items-center gap-4 bg-gradient-to-br from-[#fff4d6] to-[#ffe9f1]">
        <img src={icon('gift')} alt="" className="size-16" />
        <div className="flex-1">
          <div className="font-display text-lg font-semibold">{claimed ? 'Bonus claimed!' : `Complete all 3 to earn`}</div>
          <div className="mt-1 flex items-center gap-4 font-display font-semibold">
            <span className="flex items-center gap-1">
              <img src={icon('star')} alt="" className="size-6" /> {BONUS.xp} XP
            </span>
            <span className="flex items-center gap-1">
              <img src={icon('coin')} alt="" className="size-6" /> {BONUS.coins} coins
            </span>
          </div>
          <div className="mt-1 text-xs font-bold text-ink-soft">{done}/3 done</div>
        </div>
        {!claimed && (
          <button
            disabled={done < 3}
            onClick={() => {
              claim(child.id, BONUS.coins, BONUS.xp)
              playSfx('reward')
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } })
            }}
            className="btn-game px-4 py-2"
          >
            Claim
          </button>
        )}
      </Card>

      {inClass && assignments.length > 0 && (
        <>
          <h2 className="mt-7 mb-2 flex items-center gap-2 font-display text-xl font-semibold">
            <ClipboardList className="size-5 text-brand" /> From your teacher
          </h2>
          <div className="grid gap-3">
            {assignments.map((as) => {
              const a = activityById(as.activityId)
              if (!a) return null
              const isDone = attempts.some((x) => x.childId === child.id && x.activityId === a.id && x.date >= as.assignedAt)
              return (
                <div key={as.id} className="flex items-center gap-3 rounded-3xl border-2 border-brand/20 bg-white p-3">
                  <img src={a.icon} alt="" className="size-10" />
                  <div className="flex-1">
                    <div className="font-display font-semibold">{as.title}</div>
                    <div className="text-xs text-ink-soft">
                      {a.title} · due {new Date(as.due).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  {isDone ? (
                    <Check className="size-6 text-leaf" strokeWidth={3} />
                  ) : (
                    <button onClick={() => nav(`/activity/${a.id}`)} className="btn-game px-4 py-2">
                      Start
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
