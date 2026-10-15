import { useActiveChild } from './PlayShell'
import { useStore } from '../../lib/store'
import { SKILLS, skillsFor } from '../../lib/skills'
import { BAND_LABEL, band, effectiveMastery, level } from '../../lib/engine'
import { streakDays } from '../../lib/rewards'
import { Bar, Card, icon } from '../../components/ui'

export function MyProgress() {
  const child = useActiveChild()
  const attempts = useStore((s) => s.attempts)
  const mine = attempts.filter((a) => a.childId === child.id)
  const stats = [
    { label: 'Level', value: level(child.xp).level, img: 'rewards' },
    { label: 'Stars', value: child.stars, img: 'star' },
    { label: 'Day streak', value: streakDays(attempts, child.id), img: 'calendar' },
    { label: 'Activities', value: mine.length, img: 'activities' },
  ]
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold">My Progress</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col items-center p-4 text-center">
            <img src={icon(s.img)} alt="" className="size-10" />
            <div className="mt-1 font-display text-3xl font-bold">{s.value}</div>
            <div className="text-xs font-bold text-ink-soft">{s.label}</div>
          </Card>
        ))}
      </div>

      <h2 className="mt-6 mb-1 font-display text-xl font-semibold">My skills</h2>
      <p className="mb-3 text-sm text-ink-soft">Stars show how well you know each skill on your own. Practise to fill them up!</p>
      <div className="grid gap-3">
        {skillsFor(child.track).map((s) => {
          const m = child.mastery[s]
          const eff = effectiveMastery(m)
          const b = band(eff, m?.evidence ?? 0)
          const stars = b === 'mastered' ? 3 : b === 'strong' ? 2 : b === 'growing' ? 1 : 0
          return (
            <div key={s} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_3px_0_#dbe5f3]">
              <span className="h-10 w-2 rounded-full" style={{ background: SKILLS[s].color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold">{SKILLS[s].label}</span>
                  <span className="flex">
                    {[0, 1, 2].map((i) => (
                      <img key={i} src={icon('star')} alt="" className={`size-6 ${i < stars ? '' : 'opacity-20 grayscale'}`} />
                    ))}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <Bar value={eff} color={SKILLS[s].color} />
                  <span className="w-20 shrink-0 text-right text-xs font-bold text-ink-soft">{BAND_LABEL[b]}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
