/*
  Adaptive learning engine (client-side for the demo).

  Two separate measures, as the brief requires:
  - Game rewards (XP, coins, stars) reward effort and participation. Every finished activity earns some.
  - Learning mastery (0..1 per skill) estimates independent, durable understanding.

  Each answered item is scored for mastery by:
    first-try correct = 1.0, correct after one retry = 0.6, after more = 0.35, wrong = 0
    x0.7 if a hint was used (help is fine, but it is not yet independent)
    x difficulty weight (easy items count a little less, hard ones a little more)
  The skill estimate moves toward each item score with a step that shrinks as evidence grows,
  so early results move it quickly and an established skill is stable.
  Retention: if a skill is not practised, the displayed ("effective") mastery decays by up to 25%
  over 60 days, which triggers review recommendations.
*/
import type { Attempt, Child, Difficulty, ItemResult, SkillId, SkillMastery } from './types'
import { SKILLS, skillsFor } from './skills'
import { ACTIVITIES, type ActivityDef } from './content'

const DIFF_WEIGHT: Record<Difficulty, number> = { 1: 0.85, 2: 1, 3: 1.1 }

export function itemScore(r: ItemResult) {
  if (!r.correct) return 0
  let s = r.tries === 0 ? 1 : r.tries === 1 ? 0.6 : 0.35
  if (r.hint) s *= 0.7
  return Math.min(1, s * DIFF_WEIGHT[r.difficulty])
}

export const emptyMastery = (): SkillMastery => ({ score: 0, evidence: 0, lastPracticed: null, difficulty: 1 })

export function applyItems(m: SkillMastery, items: ItemResult[], when: string, weight = 1): SkillMastery {
  let { score, evidence } = m
  for (const it of items) {
    const alpha = Math.max(0.05, 1 / (evidence + 2)) * weight
    score = score + alpha * (itemScore(it) - score)
    evidence += weight
  }
  score = Math.max(0, Math.min(1, score))
  // a full round sets the next round's level; a practice round (lower weight) leaves it as it is
  return { score, evidence, lastPracticed: when, difficulty: weight === 1 ? nextDifficulty({ ...m, score, evidence }, items) : m.difficulty }
}

/** Each round is harder than the last once the child is ready: a strong round (80% or more right on the first try,
 *  without a hint) moves the next round up a level, a hard round (under half) moves it back down so the child is not
 *  stuck, anything between keeps the level. Without a round, the long-run mastery decides. */
export function nextDifficulty(m: SkillMastery, round?: ItemResult[]): Difficulty {
  if (round && round.length) {
    const firstTry = round.filter((r) => r.correct && r.tries === 0 && !r.hint).length / round.length
    if (firstTry >= 0.8) return Math.min(3, m.difficulty + 1) as Difficulty
    if (firstTry < 0.5) return Math.max(1, m.difficulty - 1) as Difficulty
    return m.difficulty
  }
  if (m.evidence >= 6 && m.score >= 0.8) return Math.min(3, m.difficulty + 1) as Difficulty
  if (m.score < 0.45 && m.evidence >= 4) return Math.max(1, m.difficulty - 1) as Difficulty
  return m.difficulty
}

export function daysSince(iso: string | null, now = new Date()) {
  if (!iso) return Infinity
  return (now.getTime() - new Date(iso).getTime()) / 86400000
}

export function effectiveMastery(m: SkillMastery | undefined, now = new Date()) {
  if (!m || m.evidence === 0) return 0
  const d = daysSince(m.lastPracticed, now)
  const decay = Math.min(0.25, (Math.max(0, d - 3) / 60) * 0.25)
  return m.score * (1 - decay)
}

export const pct = (x: number) => Math.round(x * 100)

export function overallMastery(child: Child) {
  const skills = skillsFor(child.track)
  const vals = skills.map((s) => effectiveMastery(child.mastery[s]))
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export type MasteryBand = 'new' | 'learning' | 'growing' | 'strong' | 'mastered'
export function band(score: number, evidence: number): MasteryBand {
  if (evidence === 0) return 'new'
  if (score >= 0.85) return 'mastered'
  if (score >= 0.7) return 'strong'
  if (score >= 0.5) return 'growing'
  return 'learning'
}
export const BAND_LABEL: Record<MasteryBand, string> = { new: 'Not started', learning: 'Learning', growing: 'Growing', strong: 'Strong', mastered: 'Mastered' }

export interface Recommendation {
  activity: ActivityDef
  reason: string
  kind: 'support' | 'review' | 'next' | 'challenge'
}

/** Activities ordered by what the learner needs most. */
export function recommend(child: Child, limit = 3): Recommendation[] {
  const skills = skillsFor(child.track)
  const now = new Date()
  const ranked = skills
    .map((s) => {
      const m = child.mastery[s]
      const eff = effectiveMastery(m, now)
      const stale = m && m.evidence > 0 && daysSince(m.lastPracticed, now) > 10
      return { s, m, eff, stale }
    })
    .filter(({ s }) => ACTIVITIES.some((a) => a.skill === s && a.track === child.track && unlocked(child, a)))
    .sort((a, b) => {
      // unseen skills after weak ones, strong skills last
      const ka = a.m?.evidence ? a.eff : 0.6
      const kb = b.m?.evidence ? b.eff : 0.6
      return ka - kb
    })

  const out: Recommendation[] = []
  for (const r of ranked) {
    const acts = ACTIVITIES.filter((a) => a.skill === r.s && a.track === child.track && unlocked(child, a))
    if (!acts.length) continue
    const act = acts[out.length % acts.length]
    const label = SKILLS[r.s].label
    if (!r.m || r.m.evidence === 0) out.push({ activity: act, kind: 'next', reason: `New skill to explore: ${label}` })
    else if (r.eff < 0.55) out.push({ activity: act, kind: 'support', reason: `${label} needs more practice (${pct(r.eff)}%)` })
    else if (r.stale) out.push({ activity: act, kind: 'review', reason: `Time to review ${label} so it sticks` })
    else if (r.eff >= 0.8) out.push({ activity: act, kind: 'challenge', reason: `Ready for harder ${label} challenges` })
    else out.push({ activity: act, kind: 'next', reason: `Keep building ${label}` })
    if (out.length >= limit) break
  }
  return out
}

/** Little Explorers progress through worlds by demonstrated understanding, not by count. */
export const UNLOCK_AT = 0.6
export function unlocked(child: Child, a: ActivityDef) {
  if (!a.requires) return true
  return a.requires.every((s) => effectiveMastery(child.mastery[s]) >= UNLOCK_AT)
}

export function strengthsAndNeeds(child: Child, attempts: Attempt[]) {
  const skills = skillsFor(child.track)
  const strengths: { skill: SkillId; text: string }[] = []
  const needs: { skill: SkillId; text: string }[] = []
  for (const s of skills) {
    const m = child.mastery[s]
    if (!m || m.evidence === 0) continue
    const eff = effectiveMastery(m)
    if (eff >= 0.72) strengths.push({ skill: s, text: `${SKILLS[s].label}: ${SKILLS[s].blurb.toLowerCase()}` })
    if (eff < 0.58) needs.push({ skill: s, text: `${SKILLS[s].label} (${pct(eff)}%)` })
  }
  // most frequent mistake patterns from recent attempts
  const counts = new Map<string, number>()
  for (const a of attempts.slice(0, 30)) for (const m of a.mistakes) counts.set(m, (counts.get(m) ?? 0) + 1)
  const patterns = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m, n]) => ({ pattern: m, count: n }))
  return { strengths, needs, patterns }
}

export function level(xp: number) {
  const per = 200
  return { level: Math.floor(xp / per) + 1, into: xp % per, per }
}

export function rewardsFor(correct: number, total: number, hints: number) {
  const stars = correct === total ? 3 : correct / total >= 0.6 ? 2 : 1
  // effort always earns something; accuracy earns more. Hints never cost rewards.
  const xp = 10 + correct * 8 + (stars === 3 ? 10 : 0)
  const coins = 2 + correct * 2
  void hints
  return { stars, xp, coins }
}
