// Demo data: two learners with two weeks of history, and a teacher's class.
import type { Attempt, Child, Difficulty, SkillId, SkillMastery } from './types'
import { ACTIVITIES } from './content'

const daysAgo = (n: number, hour = 16) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, (n * 17) % 60, 0, 0)
  return d.toISOString()
}

// deterministic random so the demo looks the same on every reset
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const m = (score: number, evidence: number, lastDays: number, difficulty: Difficulty = 1): SkillMastery => ({ score, evidence, lastPracticed: daysAgo(lastDays), difficulty })

export function seedChildren(): Child[] {
  return [
    {
      id: 'ama', name: 'Ama', track: 'junior', grade: 7, curriculum: 'nacca',
      avatar: { base: 'girl-puffs', item: 'backpack-pink' },
      xp: 920, coins: 320, stars: 61,
      badges: ['first-steps', 'streak-3', 'skill-reading', 'skill-vocabulary', 'perfect', 'skill-listening', 'level-5'],
      owned: ['backpack-pink', 'cap-blue'],
      mastery: {
        spelling: m(0.6, 34, 0, 2), reading: m(0.82, 41, 1, 2), vocabulary: m(0.75, 30, 2, 2), grammar: m(0.68, 28, 12, 2),
        speaking: m(0.66, 16, 4, 1), writing: m(0.57, 9, 3, 1), listening: m(0.74, 14, 5, 2),
      },
      settings: { dailyLimitMin: 45, voiceConsent: true, aiCompanion: true },
      createdAt: daysAgo(40), missionsClaimed: [],
    },
    {
      id: 'kofi', name: 'Kofi', track: 'little', age: 5, curriculum: 'intl',
      avatar: { base: 'boy-blue', item: 'cap-red' },
      xp: 380, coins: 120, stars: 34,
      badges: ['first-steps', 'skill-letters', 'brave-try'],
      owned: ['cap-red'],
      mastery: {
        letters: m(0.82, 30, 0, 2), phonics: m(0.7, 22, 1, 2), tracing: m(0.64, 12, 2, 1), words2: m(0.68, 18, 1, 1),
        words3: m(0.48, 14, 0, 1), matching: m(0.55, 10, 3, 1),
      },
      settings: { dailyLimitMin: 20, voiceConsent: false, aiCompanion: true },
      createdAt: daysAgo(30), missionsClaimed: [],
    },
  ]
}

interface Row { day: number; act: string; topic: string; c: number; t: number; mistakes?: string[]; hints?: number; d?: Difficulty; mins: number }
const AMA: Row[] = [
  { day: 0, act: 'spelling-challenge', topic: 'Word endings (-tion, -sion)', c: 4, t: 5, mistakes: ['double consonants'], d: 2, mins: 6 },
  { day: 0, act: 'reading-quest', topic: '"Market Day at Kejetia"', c: 5, t: 5, d: 2, mins: 8 },
  { day: 1, act: 'grammar-practice', topic: 'Past perfect tense', c: 3, t: 5, mistakes: ['past perfect', 'subject-verb agreement'], hints: 1, d: 2, mins: 5 },
  { day: 1, act: 'word-quest', topic: 'Synonyms and antonyms', c: 4, t: 5, mistakes: ['antonyms'], d: 2, mins: 6 },
  { day: 2, act: 'writing-workshop', topic: 'Descriptive paragraph', c: 4, t: 7, mistakes: ['linking words', 'varied word choice'], d: 1, mins: 10 },
  { day: 2, act: 'reading-quest', topic: '"The School Debate"', c: 5, t: 5, d: 1, mins: 7 },
  { day: 3, act: 'spelling-challenge', topic: 'Commonly confused words', c: 3, t: 5, mistakes: ['silent letters', 'unstressed vowels'], hints: 2, d: 2, mins: 5 },
  { day: 3, act: 'listen-up', topic: 'Announcements', c: 3, t: 4, mistakes: ['inference'], d: 2, mins: 4 },
  { day: 4, act: 'read-aloud', topic: 'Reading sentences aloud', c: 3, t: 4, d: 1, mins: 4 },
  { day: 5, act: 'grammar-practice', topic: 'Direct and reported speech', c: 4, t: 5, mistakes: ['reported speech'], d: 2, mins: 6 },
  { day: 6, act: 'word-quest', topic: 'Context clues', c: 5, t: 5, d: 2, mins: 5 },
  { day: 7, act: 'spelling-challenge', topic: 'Double consonants', c: 2, t: 5, mistakes: ['double consonants', 'double consonants'], hints: 2, d: 2, mins: 7 },
  { day: 8, act: 'reading-quest', topic: '"The School Debate"', c: 4, t: 5, mistakes: ['inference'], d: 1, mins: 8 },
  { day: 9, act: 'writing-workshop', topic: 'Letter to a friend', c: 4, t: 7, mistakes: ['capital letters'], d: 1, mins: 12 },
  { day: 10, act: 'listen-up', topic: 'Announcements', c: 4, t: 4, d: 1, mins: 4 },
  { day: 12, act: 'grammar-practice', topic: 'Subject-verb agreement', c: 3, t: 5, mistakes: ['subject-verb agreement'], d: 1, mins: 6 },
  { day: 13, act: 'spelling-challenge', topic: 'Silent letters', c: 3, t: 5, mistakes: ['silent letters'], d: 1, mins: 6 },
]
const KOFI: Row[] = [
  { day: 0, act: 'make-word-3', topic: 'cat, dog, sun', c: 3, t: 5, mistakes: ['CVC blending'], hints: 2, mins: 5 },
  { day: 0, act: 'letter-hunt', topic: 'Uppercase A to Z', c: 5, t: 5, d: 2, mins: 3 },
  { day: 1, act: 'two-letter', topic: 'at, in, on, up', c: 4, t: 5, mistakes: ['sight words'], mins: 4 },
  { day: 1, act: 'letter-sounds', topic: 'Sounds b, c, s', c: 4, t: 5, mistakes: ['/b/ sound'], mins: 4 },
  { day: 2, act: 'trace-letters', topic: 'A, L, T', c: 2, t: 3, mistakes: ['uppercase formation'], mins: 5 },
  { day: 3, act: 'listen-match', topic: 'Animals and things', c: 3, t: 5, mistakes: ['listening vocabulary'], hints: 1, mins: 4 },
  { day: 4, act: 'make-word-3', topic: 'bee, bus, sun', c: 2, t: 5, mistakes: ['CVC blending', 'CVC blending'], hints: 2, mins: 6 },
  { day: 5, act: 'letter-hunt', topic: 'Small letters b, d, p', c: 3, t: 5, mistakes: ['lowercase letters'], d: 2, mins: 4 },
  { day: 6, act: 'two-letter', topic: 'it, is, go', c: 4, t: 5, mins: 3 },
  { day: 8, act: 'letter-sounds', topic: 'Sounds a, f, t', c: 3, t: 5, mistakes: ['/f/ sound'], mins: 4 },
  { day: 10, act: 'letter-hunt', topic: 'Uppercase A to M', c: 5, t: 5, mins: 3 },
  { day: 12, act: 'trace-letters', topic: 'O, I, H', c: 3, t: 3, mins: 4 },
]

function rowsToAttempts(childId: string, rows: Row[]): Attempt[] {
  const r = rng(childId.length * 99)
  return rows.map((x, i) => {
    const a = ACTIVITIES.find((y) => y.id === x.act)!
    const before = 0.4 + r() * 0.35
    const delta = (x.c / x.t - 0.6) * 0.06
    return {
      id: `${childId}-seed-${i}`, childId, activityId: a.id, title: a.title, topic: x.topic, skill: a.skill as SkillId,
      date: daysAgo(x.day, 15 + (i % 4)), correct: x.c, total: x.t, hints: x.hints ?? 0, durationSec: x.mins * 60,
      mistakes: x.mistakes ?? [], difficulty: x.d ?? 1, xp: 10 + x.c * 8, coins: 2 + x.c * 2,
      masteryBefore: before, masteryAfter: Math.max(0, Math.min(1, before + delta)),
    }
  })
}

export function seedAttempts(): Attempt[] {
  return [...rowsToAttempts('ama', AMA), ...rowsToAttempts('kofi', KOFI)].sort((a, b) => b.date.localeCompare(a.date))
}

/* ---------- teacher's class ---------- */
export interface ClassStudent {
  id: string
  name: string
  mastery: Partial<Record<SkillId, number>>
  activitiesWeek: number
  minutesWeek: number
  lastActive: string
  live?: boolean // linked to a real demo learner
}

const NAMES = ['Kwame Mensah', 'Abena Owusu', 'Yaw Boateng', 'Akosua Asante', 'Kojo Appiah', 'Efua Darko', 'Nana Adjei', 'Adwoa Ofori', 'Kweku Badu', 'Esi Quaye', 'Fiifi Arthur', 'Afia Sarpong']
const JS: SkillId[] = ['spelling', 'reading', 'vocabulary', 'grammar', 'speaking', 'writing', 'listening']

export function seedClass(): ClassStudent[] {
  const r = rng(7)
  return NAMES.map((name, i) => {
    const base = 0.35 + r() * 0.45
    const mastery: Partial<Record<SkillId, number>> = {}
    for (const s of JS) mastery[s] = Math.max(0.15, Math.min(0.97, base + (r() - 0.5) * 0.35 - (s === 'writing' ? 0.08 : 0)))
    const days = Math.floor(r() * 9)
    return { id: `s${i}`, name, mastery, activitiesWeek: Math.floor(2 + r() * 12), minutesWeek: Math.floor(20 + r() * 140), lastActive: daysAgo(days) }
  })
}

export const CLASS_INFO = { name: 'JHS 1 Gold', grade: 7, curriculum: 'nacca' as const, school: 'Asante Hill Basic School', teacher: 'Mrs. Grace Addo' }
