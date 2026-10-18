import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { ArrowRight, BarChart3 } from 'lucide-react'
import type { ActivityDef } from '../../lib/content'
import type { Child } from '../../lib/types'
import type { FinishResult } from '../../lib/store'
import { useChild } from '../../lib/store'
import { SKILLS } from '../../lib/skills'
import { pct, recommend } from '../../lib/engine'
import { badgeDef } from '../../lib/rewards'
import { Bar, icon } from '../../components/ui'
import { speakSeq } from '../../lib/speech'
import { playSfx } from '../../lib/sfx'
import { VOICE } from '../../lib/content'

export function Results({ child: before, activity, result }: { child: Child; activity: ActivityDef; result: FinishResult }) {
  const nav = useNavigate()
  const child = useChild(before.id) ?? before
  const { attempt, stars, badges, leveledUp } = result
  const little = child.track === 'little'
  const color = SKILLS[activity.skill].color
  const next = recommend(child, 2).find((r) => r.activity.id !== activity.id)?.activity
  const great = attempt.correct / attempt.total >= 0.8
  const headline = attempt.practiceOnly ? 'Nice practice!' : great ? 'Well Done!' : attempt.correct / attempt.total >= 0.5 ? 'Good effort!' : 'Keep going!'

  useEffect(() => {
    playSfx('celebrate')
    confetti({ particleCount: great ? 160 : 70, spread: 90, origin: { y: 0.35 }, colors: ['#ffc22e', '#1f6bff', '#1fae6a', '#ef4f7a', '#8a5cf6'] })
    if (little) speakSeq(attempt.practiceOnly ? [headline] : [headline, VOICE.score(attempt.correct, attempt.total)])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const change = attempt.masteryAfter - attempt.masteryBefore
  return (
    <div className="min-h-dvh bg-[radial-gradient(120%_70%_at_50%_0%,#d9f5e5_0%,#eaf4ff_60%)] px-4 pt-8 pb-16">
      <div className="mx-auto max-w-md text-center">
        <img src={great ? 'images/sheet/mascots/star.png' : 'images/sheet/mascots/owl.png'} alt="" className="pop mx-auto w-28" />
        <h1 className="mt-2 font-display text-4xl font-bold text-leaf-dark">{headline}</h1>
        <p className="mt-1 text-lg font-semibold">
          {attempt.practiceOnly ? 'Practice complete.' : `You got ${attempt.correct} out of ${attempt.total} correct.`}
        </p>
        <div className="mt-3 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <img key={i} src={icon('star')} alt="" className={`pop size-12 ${i < stars ? '' : 'opacity-20 grayscale'}`} style={{ animationDelay: `${200 + i * 150}ms` }} />
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-[0_3px_0_#dbe5f3]">
          <div className="text-xs font-bold tracking-wide text-ink-faint uppercase">Rewards</div>
          <div className="mt-2 flex justify-center gap-6 font-display text-2xl font-semibold">
            <span className="flex items-center gap-2">
              <img src={icon('star')} alt="" className="size-8" /> +{attempt.xp} XP
            </span>
            <span className="flex items-center gap-2">
              <img src={icon('coin')} alt="" className="size-8" /> +{attempt.coins}
            </span>
          </div>
          {leveledUp && <div className="pop mt-3 rounded-2xl bg-sun/25 py-2 font-display text-lg font-semibold">Level up! You reached a new level.</div>}
          {badges.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <div className="text-xs font-bold tracking-wide text-ink-faint uppercase">New badge{badges.length > 1 ? 's' : ''}!</div>
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {badges.map((b) => {
                  const d = badgeDef(b)
                  return (
                    <div key={b} className="pop flex w-24 flex-col items-center">
                      <img src={d.art} alt="" className="size-14" />
                      <div className="mt-1 text-xs font-bold">{d.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-5 text-left shadow-[0_3px_0_#dbe5f3]">
          <div className="flex items-baseline justify-between">
            <div className="text-xs font-bold tracking-wide text-ink-faint uppercase">Skill mastery · {SKILLS[activity.skill].label}</div>
            <div className={`text-sm font-black ${change >= 0 ? 'text-leaf-dark' : 'text-coral'}`}>
              {change >= 0 ? '+' : ''}
              {pct(change)}%
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Bar value={attempt.masteryAfter} color={color} height={14} />
            <span className="font-display text-xl font-semibold">{pct(attempt.masteryAfter)}%</span>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            {attempt.hints > 0 && !little
              ? 'Rewards count your effort. Mastery grows most when you answer on your own, so a little more solo practice will help.'
              : 'Mastery shows how well you know this skill on your own. It grows with practice.'}
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <button onClick={() => nav('/play')} className="btn-game w-full text-xl" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
            Continue
          </button>
          {next ? (
            <button onClick={() => nav(`/activity/${next.id}`, { replace: true })} className="btn-game w-full" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-brand)' }}>
              Next: {next.title} <ArrowRight className="size-5" />
            </button>
          ) : (
            <button onClick={() => nav('/play/progress')} className="btn-game w-full" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-brand)' }}>
              <BarChart3 className="size-5" /> View Progress
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
