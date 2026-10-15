import type { Attempt, Child, SkillId } from './types'
import { SKILLS } from './skills'

export const KIDS = ['boy-blue', 'girl-pink', 'boy-cap', 'girl-long', 'boy-glasses', 'girl-puffs'] as const
export const kidArt = (k: string) => `images/sheet/kids/${k}.png`
export const itemArt = (k: string) => `images/sheet/items/${k}.png`
export const badgeArt = (k: string) => `images/sheet/badges/${k}.png`

export const SHOP: { id: string; name: string; price: number }[] = [
  { id: 'cap-blue', name: 'Blue Cap', price: 30 },
  { id: 'cap-pink', name: 'Pink Cap', price: 30 },
  { id: 'cap-red', name: 'Red Cap', price: 30 },
  { id: 'sunglasses', name: 'Cool Shades', price: 45 },
  { id: 'tshirt-star', name: 'Star T-Shirt', price: 50 },
  { id: 'backpack-green', name: 'Green Backpack', price: 60 },
  { id: 'backpack-pink', name: 'Pink Backpack', price: 60 },
  { id: 'hoodie-blue', name: 'Blue Hoodie', price: 80 },
  { id: 'jacket-black', name: 'Explorer Jacket', price: 90 },
  { id: 'wizard-hat', name: 'Wizard Hat', price: 120 },
  { id: 'crown', name: 'Golden Crown', price: 200 },
]

export interface BadgeDef {
  id: string
  name: string
  desc: string
  art: string
}

const SKILL_BADGE_ART = ['gold', 'royal', 'silver']
export function badgeDef(id: string): BadgeDef {
  if (id.startsWith('skill-')) {
    const s = id.slice(6) as SkillId
    const i = Object.keys(SKILLS).indexOf(s)
    return { id, name: `${SKILLS[s].label} Star`, desc: `Reached Strong in ${SKILLS[s].label}`, art: badgeArt(SKILL_BADGE_ART[i % 3]) }
  }
  const fixed: Record<string, BadgeDef> = {
    'first-steps': { id, name: 'First Steps', desc: 'Finished your first activity', art: badgeArt('bronze') },
    'perfect': { id, name: 'Perfect Score', desc: 'Got every answer right first time', art: badgeArt('gold') },
    'streak-3': { id, name: '3-Day Streak', desc: 'Learned 3 days in a row', art: badgeArt('silver') },
    'brave-try': { id, name: 'Brave Try', desc: 'Kept going after a tricky question', art: badgeArt('bronze') },
    'level-5': { id, name: 'Champion', desc: 'Reached level 5', art: badgeArt('champion') },
  }
  return fixed[id] ?? { id, name: id, desc: '', art: badgeArt('bronze') }
}

export function streakDays(attempts: Attempt[], childId: string, now = new Date()) {
  const days = new Set(attempts.filter((a) => a.childId === childId).map((a) => a.date.slice(0, 10)))
  let n = 0
  const d = new Date(now)
  // allow the streak to continue if today has no activity yet
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  while (days.has(d.toISOString().slice(0, 10))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function newBadges(child: Child, attempt: Attempt, attempts: Attempt[], hadWrongThenRight: boolean, level: number) {
  const earned: string[] = []
  const has = (b: string) => child.badges.includes(b) || earned.includes(b)
  if (!has('first-steps')) earned.push('first-steps')
  if (attempt.correct === attempt.total && attempt.hints === 0 && attempt.total >= 3 && !has('perfect')) earned.push('perfect')
  if (hadWrongThenRight && !has('brave-try')) earned.push('brave-try')
  if (streakDays(attempts, child.id) >= 3 && !has('streak-3')) earned.push('streak-3')
  if (attempt.masteryAfter >= 0.7 && !has(`skill-${attempt.skill}`)) earned.push(`skill-${attempt.skill}`)
  if (level >= 5 && !has('level-5')) earned.push('level-5')
  return earned
}
