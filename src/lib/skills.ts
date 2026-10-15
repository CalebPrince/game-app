import type { JuniorSkill, LittleSkill, SkillId, Track } from './types'

export interface SkillMeta {
  id: SkillId
  label: string
  color: string // css var
  world: string
  blurb: string
  homeTip: string
}

export const SKILLS: Record<SkillId, SkillMeta> = {
  // Little Explorers
  letters: { id: 'letters', label: 'Letter Recognition', color: '#ff9a1f', world: 'Letter Land', blurb: 'Knows uppercase and lowercase letters', homeTip: 'Point at letters on signs and packets at home and ask your child to name them.' },
  phonics: { id: 'phonics', label: 'Letter Sounds', color: '#23b8a8', world: 'Letter Land', blurb: 'Matches letters to their sounds', homeTip: 'Play "I spy something that starts with the sound b-b-b" during the day.' },
  tracing: { id: 'tracing', label: 'Letter Tracing', color: '#ef4f7a', world: 'Letter Land', blurb: 'Forms letters with the right strokes', homeTip: 'Let your child trace letters in sand, flour or with a wet finger on a table.' },
  words2: { id: 'words2', label: '2-Letter Words', color: '#129fc4', world: 'Two-Letter Town', blurb: 'Reads small words like at, in, on, up', homeTip: 'Write "in", "on" and "up" on cards and act them out together with a toy.' },
  words3: { id: 'words3', label: '3-Letter Words', color: '#1fae6a', world: 'Three-Letter Forest', blurb: 'Builds words like cat, dog, sun', homeTip: 'Say a word slowly (c-a-t) and let your child blend the sounds and say it fast.' },
  words4: { id: 'words4', label: '4+ Letter Words', color: '#8a5cf6', world: 'Word Builder Castle', blurb: 'Builds longer words like frog, tree, ball', homeTip: 'Spot longer words in a picture book and clap the sounds together.' },
  matching: { id: 'matching', label: 'Listen & Match', color: '#e8a600', world: 'My First Stories', blurb: 'Matches spoken words to pictures', homeTip: 'Name things around the house and ask your child to point to them.' },
  sentences: { id: 'sentences', label: 'First Sentences', color: '#f0503c', world: 'First Reading Adventure', blurb: 'Reads and builds short sentences', homeTip: 'Read one short picture book a day and let your child read the last word of each page.' },
  // Junior Explorers
  spelling: { id: 'spelling', label: 'Spelling', color: '#ff9a1f', world: 'Spelling Island', blurb: 'Spells grade-level words and patterns', homeTip: 'Do a 5-word spelling quiz at dinner using words from the activity history.' },
  reading: { id: 'reading', label: 'Reading', color: '#1fae6a', world: 'Reading Forest', blurb: 'Understands, infers from and summarises texts', homeTip: 'After a story or news article, ask "What was the main idea? How do you know?"' },
  vocabulary: { id: 'vocabulary', label: 'Vocabulary', color: '#8a5cf6', world: 'Vocabulary Kingdom', blurb: 'Knows meanings, synonyms and antonyms', homeTip: 'Pick a "word of the day" and both try to use it in conversation.' },
  grammar: { id: 'grammar', label: 'Grammar', color: '#129fc4', world: 'Grammar Galaxy', blurb: 'Uses tenses, agreement and punctuation correctly', homeTip: 'Read a short paragraph aloud and ask your child to spot the verbs and their tense.' },
  speaking: { id: 'speaking', label: 'Speaking', color: '#e8a600', world: 'Speaking Studio', blurb: 'Reads aloud clearly and with confidence', homeTip: 'Ask your child to read a paragraph aloud to the family once a day.' },
  writing: { id: 'writing', label: 'Writing', color: '#ef4f7a', world: 'Writing Workshop', blurb: 'Writes organised, clear paragraphs', homeTip: 'Ask for a 5-sentence diary entry about the day, then read it together.' },
  listening: { id: 'listening', label: 'Listening', color: '#23b8a8', world: 'Speaking Studio', blurb: 'Understands spoken English', homeTip: 'Listen to a short English radio story together and talk about what happened.' },
}

export const LITTLE_SKILLS: LittleSkill[] = ['letters', 'phonics', 'tracing', 'words2', 'words3', 'words4', 'matching', 'sentences']
export const JUNIOR_SKILLS: JuniorSkill[] = ['spelling', 'reading', 'vocabulary', 'grammar', 'speaking', 'writing', 'listening']

export const skillsFor = (t: Track): SkillId[] => (t === 'little' ? LITTLE_SKILLS : JUNIOR_SKILLS)

export interface World {
  id: string
  name: string
  skills: SkillId[]
  art: string
  color: string
}

// Worlds are ordered along the adventure trail. Art comes from the worlds sheet
// (scripts/slice-worlds.mjs); a coloured placeholder shows if a file is missing.
export const JUNIOR_WORLDS: World[] = [
  { id: 'spelling-island', name: 'Spelling Island', skills: ['spelling'], art: 'images/worlds/spelling-island.webp', color: '#ff9a1f' },
  { id: 'reading-forest', name: 'Reading Forest', skills: ['reading'], art: 'images/worlds/reading-forest.webp', color: '#1fae6a' },
  { id: 'vocabulary-kingdom', name: 'Vocabulary Kingdom', skills: ['vocabulary'], art: 'images/worlds/vocabulary-kingdom.webp', color: '#8a5cf6' },
  { id: 'grammar-galaxy', name: 'Grammar Galaxy', skills: ['grammar'], art: 'images/worlds/grammar-galaxy.webp', color: '#129fc4' },
  { id: 'speaking-studio', name: 'Speaking Studio', skills: ['speaking', 'listening'], art: 'images/worlds/speaking-studio.webp', color: '#e8a600' },
  { id: 'writing-workshop', name: 'Writing Workshop', skills: ['writing'], art: 'images/worlds/writing-workshop.webp', color: '#ef4f7a' },
]

export const LITTLE_WORLDS: World[] = [
  { id: 'letter-land', name: 'Letter Land', skills: ['letters', 'phonics', 'tracing'], art: 'images/worlds/letter-land.webp', color: '#ff9a1f' },
  { id: 'two-letter-town', name: 'Two-Letter Town', skills: ['words2'], art: 'images/worlds/two-letter-town.webp', color: '#129fc4' },
  { id: 'three-letter-forest', name: 'Three-Letter Forest', skills: ['words3'], art: 'images/worlds/three-letter-forest.webp', color: '#1fae6a' },
  { id: 'word-builder-castle', name: 'Word Builder Castle', skills: ['words4'], art: 'images/worlds/word-builder-castle.webp', color: '#8a5cf6' },
  { id: 'my-first-stories', name: 'My First Stories', skills: ['matching'], art: 'images/worlds/my-first-stories.webp', color: '#e8a600' },
  { id: 'first-reading', name: 'First Reading Adventure', skills: ['sentences'], art: 'images/worlds/first-reading.webp', color: '#f0503c' },
]

export const worldsFor = (t: Track) => (t === 'little' ? LITTLE_WORLDS : JUNIOR_WORLDS)

export const GRADE_TITLES: Record<number, string> = { 6: 'Explorer', 7: 'Pathfinder', 8: 'Champion', 9: 'Master' }

export function learnerLabel(c: { track: Track; grade?: number; age?: number }) {
  if (c.track === 'little') return `Little Explorers${c.age ? ` · Age ${c.age}` : ''}`
  return `Grade ${c.grade} · ${GRADE_TITLES[c.grade ?? 6]}`
}

export function curriculumLabel(c: { curriculum: string; track: Track; grade?: number }) {
  if (c.track === 'little') return c.curriculum === 'nacca' ? 'Foundations (prepares for NaCCA)' : 'Foundations (prepares for Cambridge-aligned)'
  if (c.curriculum === 'nacca') return `Ghana NaCCA · Basic ${c.grade}`
  return `International (Cambridge-aligned) · Stage ${c.grade}`
}
