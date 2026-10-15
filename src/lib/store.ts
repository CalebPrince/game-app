import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assignment, Attempt, Child, ItemResult } from './types'
import type { ActivityDef } from './content'
import { applyItems, emptyMastery, effectiveMastery, level, rewardsFor } from './engine'
import { newBadges } from './rewards'
import { seedAttempts, seedChildren } from './seed'

export interface FinishInput {
  child: Child
  activity: ActivityDef
  topic: string
  items: ItemResult[]
  durationSec: number
  practiceOnly?: boolean // e.g. speaking without a microphone: rewards yes, mastery barely moves
}

export interface FinishResult {
  attempt: Attempt
  stars: number
  badges: string[]
  leveledUp: boolean
}

interface State {
  children: Child[]
  attempts: Attempt[]
  activeChildId: string | null
  parentChildId: string
  assignments: Assignment[]
  setActiveChild: (id: string | null) => void
  setParentChild: (id: string) => void
  addChild: (c: Child) => void
  updateChild: (id: string, patch: Partial<Child>) => void
  deleteChild: (id: string) => void
  clearHistory: (id: string) => void
  finishActivity: (input: FinishInput) => FinishResult
  buy: (childId: string, item: string, price: number) => boolean
  equip: (childId: string, item?: string) => void
  claimMissions: (childId: string, coins: number, xp: number) => void
  assign: (a: Assignment) => void
  unassign: (id: string) => void
  reset: () => void
}

const initial = () => ({
  children: seedChildren(),
  attempts: seedAttempts(),
  activeChildId: null as string | null,
  parentChildId: 'ama',
  assignments: [
    { id: 'as1', activityId: 'grammar-practice', title: 'Past perfect revision', due: new Date(Date.now() + 2 * 86400000).toISOString(), assignedAt: new Date().toISOString() },
  ] as Assignment[],
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      setActiveChild: (id) => set({ activeChildId: id }),
      setParentChild: (id) => set({ parentChildId: id }),
      addChild: (c) => set((s) => ({ children: [...s.children, c], parentChildId: c.id })),
      updateChild: (id, patch) => set((s) => ({ children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteChild: (id) =>
        set((s) => {
          const children = s.children.filter((c) => c.id !== id)
          return {
            children,
            attempts: s.attempts.filter((a) => a.childId !== id),
            activeChildId: s.activeChildId === id ? null : s.activeChildId,
            parentChildId: s.parentChildId === id ? children[0]?.id ?? '' : s.parentChildId,
          }
        }),
      clearHistory: (id) =>
        set((s) => ({
          attempts: s.attempts.filter((a) => a.childId !== id),
          children: s.children.map((c) => (c.id === id ? { ...c, mastery: {}, xp: 0, coins: 0, stars: 0, badges: [] } : c)),
        })),
      finishActivity: ({ child, activity, topic, items, durationSec, practiceOnly }) => {
        const now = new Date().toISOString()
        const prev = child.mastery[activity.skill] ?? emptyMastery()
        const before = effectiveMastery(prev)
        const next = applyItems(prev, items, now, practiceOnly ? 0.25 : 1)
        const correct = items.filter((i) => i.correct).length
        const hints = items.filter((i) => i.hint).length
        const r = rewardsFor(correct, items.length, hints)
        const lvlBefore = level(child.xp).level
        const lvlAfter = level(child.xp + r.xp).level
        const attempt: Attempt = {
          id: `${child.id}-${Date.now()}`, childId: child.id, activityId: activity.id, title: activity.title, topic, skill: activity.skill,
          date: now, correct, total: items.length, hints, durationSec,
          mistakes: items.filter((i) => !i.correct || i.tries > 0).map((i) => i.tag).filter((t): t is string => !!t),
          difficulty: prev.difficulty, xp: r.xp, coins: r.coins, masteryBefore: before, masteryAfter: next.score, practiceOnly,
        }
        const attempts = [attempt, ...get().attempts]
        const badges = newBadges(child, attempt, attempts, items.some((i) => i.correct && i.tries > 0), lvlAfter)
        set((s) => ({
          attempts,
          children: s.children.map((c) =>
            c.id === child.id
              ? { ...c, xp: c.xp + r.xp, coins: c.coins + r.coins, stars: c.stars + r.stars, badges: [...c.badges, ...badges], mastery: { ...c.mastery, [activity.skill]: next } }
              : c,
          ),
        }))
        return { attempt, stars: r.stars, badges, leveledUp: lvlAfter > lvlBefore }
      },
      buy: (childId, item, price) => {
        const c = get().children.find((x) => x.id === childId)
        if (!c || c.coins < price || c.owned.includes(item)) return false
        set((s) => ({ children: s.children.map((x) => (x.id === childId ? { ...x, coins: x.coins - price, owned: [...x.owned, item], avatar: { ...x.avatar, item } } : x)) }))
        return true
      },
      equip: (childId, item) => set((s) => ({ children: s.children.map((x) => (x.id === childId ? { ...x, avatar: { ...x.avatar, item } } : x)) })),
      claimMissions: (childId, coins, xp) =>
        set((s) => ({
          children: s.children.map((x) =>
            x.id === childId ? { ...x, coins: x.coins + coins, xp: x.xp + xp, missionsClaimed: [...x.missionsClaimed, new Date().toISOString().slice(0, 10)] } : x,
          ),
        })),
      assign: (a) => set((s) => ({ assignments: [a, ...s.assignments] })),
      unassign: (id) => set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),
      reset: () => set({ ...initial() }),
    }),
    { name: 'english-adventure-demo-v1' },
  ),
)

export const useChild = (id: string | null | undefined) => useStore((s) => s.children.find((c) => c.id === id))

export function minutesToday(attempts: Attempt[], childId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return Math.round(attempts.filter((a) => a.childId === childId && a.date.startsWith(today)).reduce((n, a) => n + a.durationSec, 0) / 60)
}
