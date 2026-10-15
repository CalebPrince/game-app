export type Track = 'little' | 'junior'
export type Curriculum = 'nacca' | 'intl'
export type Difficulty = 1 | 2 | 3

export type LittleSkill = 'letters' | 'phonics' | 'tracing' | 'words2' | 'words3' | 'words4' | 'matching' | 'sentences'
export type JuniorSkill = 'spelling' | 'reading' | 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'listening'
export type SkillId = LittleSkill | JuniorSkill

export interface SkillMastery {
  /** 0..1 estimate of independent, durable understanding */
  score: number
  /** how many scored items have fed the estimate */
  evidence: number
  lastPracticed: string | null
  difficulty: Difficulty
}

export interface AvatarConfig {
  base: string // kid sprite name
  item?: string // equipped accessory
}

export interface ChildSettings {
  dailyLimitMin: number
  voiceConsent: boolean
  aiCompanion: boolean
}

export interface Child {
  id: string
  name: string
  track: Track
  grade?: 6 | 7 | 8 | 9
  age?: number
  curriculum: Curriculum
  avatar: AvatarConfig
  xp: number
  coins: number
  stars: number
  badges: string[]
  owned: string[]
  mastery: Partial<Record<SkillId, SkillMastery>>
  settings: ChildSettings
  createdAt: string
  missionsClaimed: string[] // ISO dates the daily bonus was claimed
}

/** One scored item inside an activity */
export interface ItemResult {
  correct: boolean
  tries: number // wrong tries before the final answer
  hint: boolean
  difficulty: Difficulty
  tag?: string // mistake category, e.g. "-tion endings"
}

export interface Attempt {
  id: string
  childId: string
  activityId: string
  title: string
  topic: string
  skill: SkillId
  date: string
  correct: number
  total: number
  hints: number
  durationSec: number
  mistakes: string[]
  difficulty: Difficulty
  xp: number
  coins: number
  masteryBefore: number
  masteryAfter: number
  practiceOnly?: boolean
}

export interface Assignment {
  id: string
  activityId: string
  title: string
  due: string
  assignedAt: string
}
