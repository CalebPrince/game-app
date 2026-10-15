import type { Attempt, Child } from '../../lib/types'
import { skillsFor } from '../../lib/skills'

export const DAY = 86400000

export function inRange(a: Attempt, fromDaysAgo: number, toDaysAgo = 0) {
  const t = Date.now() - new Date(a.date).getTime()
  return t >= toDaysAgo * DAY && t < fromDaysAgo * DAY
}

export function periodStats(attempts: Attempt[], child: Child, days: number, offset = 0) {
  const list = attempts.filter((a) => a.childId === child.id && inRange(a, days + offset, offset))
  const secs = list.reduce((n, a) => n + a.durationSec, 0)
  const correct = list.reduce((n, a) => n + a.correct, 0)
  const total = list.reduce((n, a) => n + a.total, 0)
  const skills = skillsFor(child.track)
  // mastery change: summed per attempt, averaged across the track's skills
  const masteryDelta = list.reduce((n, a) => n + (a.masteryAfter - a.masteryBefore), 0) / skills.length
  const activeDays = new Set(list.map((a) => a.date.slice(0, 10))).size
  return { list, secs, correct, total, accuracy: total ? correct / total : 0, masteryDelta, activeDays }
}

export function dailySeries(attempts: Attempt[], child: Child, days = 7) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toISOString().slice(0, 10)
    const list = attempts.filter((a) => a.childId === child.id && a.date.startsWith(key))
    const c = list.reduce((n, a) => n + a.correct, 0)
    const t = list.reduce((n, a) => n + a.total, 0)
    out.push({
      day: days <= 7 ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      accuracy: t ? Math.round((c / t) * 100) : null,
      minutes: Math.round(list.reduce((n, a) => n + a.durationSec, 0) / 60),
    })
  }
  return out
}
