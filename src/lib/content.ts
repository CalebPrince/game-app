import type { Child, Difficulty, SkillId, Track } from './types'

/* ---------- question shapes ---------- */
interface Base {
  hint?: string
  tag?: string // mistake category recorded when answered wrong
}
export type Question = Base &
  (
    | { kind: 'pick-letter'; say: string; prompt: string; answer: string; options: string[] }
    | { kind: 'pick-picture'; say: string; prompt: string; answer: string; options: string[] }
    | { kind: 'pick-word'; say: string; prompt: string; answer: string; options: string[] }
    | { kind: 'trace'; letter: string }
    | { kind: 'build-word'; word: string; picture?: string; pool: string[]; prompt: string }
    | { kind: 'fill-blanks'; word: string; blanks: number[]; pool: string[]; say: string; sentence: string }
    | { kind: 'dictation'; word: string; say: string; sentence: string; definition: string }
    | { kind: 'build-sentence'; words: string[]; picture?: string }
    | { kind: 'mcq'; prompt: string; options: string[]; answer: number; explain: string; passage?: Passage; audio?: string }
    | { kind: 'speak'; text: string }
    | { kind: 'write'; prompt: string; minWords: number; genre: 'descriptive' | 'letter' | 'argument' | 'story' }
  )

export interface Passage {
  title: string
  text: string
  art?: string
}

export interface ActivityDef {
  id: string
  track: Track
  skill: SkillId
  title: string
  subtitle: string
  icon: string // image path
  requires?: SkillId[]
  build: (child: Child, d: Difficulty) => Question[]
}

/* ---------- helpers ---------- */
export const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const pickN = <T,>(a: T[], n: number) => shuffle(a).slice(0, n)
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const OBJ = (name: string) => `images/sheet/objects/${name}.png`
export const ICON = (name: string) => `images/sheet/icons/${name}.png`

// Pictures we have art for, with their first sound
export const PICTURES: { word: string; sound: string }[] = [
  { word: 'cat', sound: 'c' }, { word: 'dog', sound: 'd' }, { word: 'sun', sound: 's' }, { word: 'bee', sound: 'b' },
  { word: 'bus', sound: 'b' }, { word: 'apple', sound: 'a' }, { word: 'frog', sound: 'f' }, { word: 'tree', sound: 't' },
  { word: 'ball', sound: 'b' }, { word: 'bird', sound: 'b' }, { word: 'house', sound: 'h' }, { word: 'car', sound: 'c' },
]
const PHONICS_SAY: Record<string, string> = { c: 'kuh', d: 'duh', s: 'sss', b: 'buh', a: 'a, as in apple', f: 'fff', t: 'tuh', h: 'hhh' }

/* ---------- Little Explorers ---------- */
const letterHunt: ActivityDef = {
  id: 'letter-hunt', track: 'little', skill: 'letters', title: 'Letter Hunt', subtitle: 'Find the letter you hear', icon: ICON('learning'),
  build: (_c, d) => {
    const pool = d === 1 ? ALPHA.slice(0, 13) : ALPHA
    return pickN(pool, 5).map((L) => {
      const lower = d === 3
      const confusable: Record<string, string[]> = { b: ['d', 'p', 'q'], d: ['b', 'p', 'q'], p: ['q', 'b', 'd'], m: ['n', 'w'], u: ['n', 'v'] }
      const target = lower ? L.toLowerCase() : L
      const others = lower && confusable[target] ? confusable[target].slice(0, 3) : pickN((lower ? ALPHA.map((x) => x.toLowerCase()) : pool).filter((x) => x !== target), 3)
      return {
        kind: 'pick-letter', answer: target, options: shuffle([target, ...others]),
        say: lower ? `Find the small letter ${L}` : `Find the letter ${L}`,
        prompt: lower ? `Find the small letter` : 'Find the letter',
        hint: `Listen again. The letter ${L} says ${PHONICS_SAY[L.toLowerCase()] ?? L}.`,
        tag: lower ? 'lowercase letters' : 'uppercase letters',
      }
    })
  },
}

const letterSounds: ActivityDef = {
  id: 'letter-sounds', track: 'little', skill: 'phonics', title: 'Sound Safari', subtitle: 'Which picture starts with this sound?', icon: OBJ('bee'),
  build: (_c, d) => {
    const sounds = shuffle(['c', 'd', 's', 'b', 'a', 'f', 't', 'h'])
    return sounds.slice(0, 5).map((s) => {
      const right = pickN(PICTURES.filter((p) => p.sound === s), 1)[0]
      const wrong = pickN(PICTURES.filter((p) => p.sound !== s), d === 1 ? 1 : 2).map((p) => p.word)
      return {
        kind: 'pick-picture', answer: right.word, options: shuffle([right.word, ...wrong]),
        say: `Which picture starts with ${PHONICS_SAY[s]}? ${s.toUpperCase()}`, prompt: `Starts with the sound of ${s.toUpperCase()}`,
        hint: `Say each picture's name slowly. Which one begins with ${PHONICS_SAY[s]}?`, tag: `/${s}/ sound`,
      }
    })
  },
}

const traceLetters: ActivityDef = {
  id: 'trace-letters', track: 'little', skill: 'tracing', title: 'Trace the Letter', subtitle: 'Follow the dotted letter with your finger', icon: ICON('hint'),
  build: (_c, d) => {
    const pool = d === 1 ? ['A', 'L', 'T', 'O', 'I', 'H'] : d === 2 ? ['B', 'C', 'E', 'M', 'S', 'D'] : ['a', 'b', 'd', 'g', 'e', 's']
    return pickN(pool, 3).map((letter) => ({ kind: 'trace', letter, tag: /[a-z]/.test(letter) ? 'lowercase formation' : 'uppercase formation' }))
  },
}

const TWO = ['at', 'in', 'on', 'up', 'it', 'am', 'is', 'go', 'no', 'to', 'an', 'me']
const twoLetter: ActivityDef = {
  id: 'two-letter', track: 'little', skill: 'words2', title: '2-Letter Words', subtitle: 'Tap the word you hear', icon: ICON('sound'),
  requires: ['letters'],
  build: (_c, d) =>
    pickN(TWO, 5).map((w) => {
      const near = TWO.filter((x) => x !== w && (d === 3 ? x[0] === w[0] || x[1] === w[1] : true))
      const opts = pickN(near.length >= 2 ? near : TWO.filter((x) => x !== w), d === 1 ? 2 : 3)
      return { kind: 'pick-word', say: w, prompt: 'Tap the word you hear', answer: w, options: shuffle([w, ...opts]), hint: `Say the two sounds: ${w.split('').join(', ')}.`, tag: 'sight words' }
    }),
}

const W3 = ['cat', 'dog', 'sun', 'bee', 'bus']
const W4 = ['frog', 'tree', 'ball', 'bird']
const W5 = ['apple', 'house']
const buildWord = (word: string, d: Difficulty, prompt: string): Question => {
  const extra = pickN('aeioumnprstb'.split('').filter((x) => !word.includes(x)), d)
  return { kind: 'build-word', word, picture: OBJ(word), pool: shuffle([...word.split(''), ...extra]), prompt, hint: `Tap the picture to hear the word, then listen for the first sound: ${word[0]}.`, tag: word.length === 3 ? 'CVC blending' : 'longer word blending' }
}
const makeWord3: ActivityDef = {
  id: 'make-word-3', track: 'little', skill: 'words3', title: 'Make the Word', subtitle: 'Build cat, dog, sun and more', icon: OBJ('cat'),
  requires: ['words2'],
  build: (_c, d) => shuffle(W3).map((w) => buildWord(w, d, 'What word is this?')),
}
const makeWord4: ActivityDef = {
  id: 'make-word-4', track: 'little', skill: 'words4', title: 'Word Builder', subtitle: 'Build frog, tree, ball and longer words', icon: OBJ('frog'),
  requires: ['words3'],
  build: (_c, d) => [...shuffle(W4), ...(d >= 2 ? W5 : [])].slice(0, 5).map((w) => buildWord(w, d === 3 ? 2 : 1, 'Build the word')),
}
const listenMatch: ActivityDef = {
  id: 'listen-match', track: 'little', skill: 'matching', title: 'Listen & Match', subtitle: 'Tap the picture you hear', icon: OBJ('bird'),
  requires: ['words2'],
  build: (_c, d) =>
    pickN(PICTURES, 5).map((p) => ({
      kind: 'pick-picture', say: p.word, prompt: 'Tap the picture you hear', answer: p.word,
      options: shuffle([p.word, ...pickN(PICTURES.filter((x) => x.word !== p.word), d === 1 ? 2 : d === 2 ? 3 : 5).map((x) => x.word)]),
      hint: 'Tap the speaker to hear the word again.', tag: 'listening vocabulary',
    })),
}
const SENTENCES: { s: string; pic?: string; d: Difficulty }[] = [
  { s: 'I see a bee', pic: 'bee', d: 1 }, { s: 'The cat is big', pic: 'cat', d: 1 }, { s: 'The sun is hot', pic: 'sun', d: 1 },
  { s: 'A dog can run', pic: 'dog', d: 2 }, { s: 'The bus is yellow', pic: 'bus', d: 2 }, { s: 'The frog is on a log', pic: 'frog', d: 3 },
  { s: 'The bird is in the tree', pic: 'bird', d: 3 }, { s: 'I like my red ball', pic: 'ball', d: 3 },
]
const firstSentences: ActivityDef = {
  id: 'first-sentences', track: 'little', skill: 'sentences', title: 'Read the Sentence', subtitle: 'Put the words in order', icon: ICON('learning'),
  requires: ['words3', 'matching'],
  build: (_c, d) => pickN(SENTENCES.filter((x) => x.d <= d), 4).map((x) => ({ kind: 'build-sentence', words: x.s.split(' '), picture: x.pic ? OBJ(x.pic) : undefined, hint: 'A sentence starts with a capital letter. Which word has one?', tag: 'sentence order' })),
}

/* ---------- Junior Explorers ---------- */
interface SpellWord { w: string; d: Difficulty; tag: string; blanks: number[]; sentence: string; def: string }
const SPELL: SpellWord[] = [
  { w: 'friend', d: 1, tag: 'ie / ei', blanks: [2, 3], sentence: 'My best friend sits next to me in class.', def: 'a person you like and trust' },
  { w: 'because', d: 1, tag: 'unstressed vowels', blanks: [3, 4], sentence: 'We stayed inside because it was raining.', def: 'for the reason that' },
  { w: 'people', d: 1, tag: 'silent letters', blanks: [2, 4], sentence: 'Many people came to the festival.', def: 'more than one person' },
  { w: 'answer', d: 1, tag: 'silent letters', blanks: [2, 3], sentence: 'Write your answer in the box.', def: 'a reply to a question' },
  { w: 'market', d: 1, tag: 'unstressed vowels', blanks: [1, 4], sentence: 'Mother bought tomatoes at the market.', def: 'a place where goods are sold' },
  { w: 'necessary', d: 2, tag: 'double consonants', blanks: [2, 4, 5], sentence: 'It is necessary to drink water every day.', def: 'needed; essential' },
  { w: 'environment', d: 2, tag: 'silent letters', blanks: [5, 6], sentence: 'We must protect our environment.', def: 'the natural world around us' },
  { w: 'library', d: 2, tag: 'unstressed vowels', blanks: [3, 4], sentence: 'I borrowed two books from the library.', def: 'a place where books are kept to borrow' },
  { w: 'separate', d: 2, tag: 'unstressed vowels', blanks: [3, 5], sentence: 'Keep the paper and plastic separate.', def: 'apart; not together' },
  { w: 'government', d: 2, tag: 'silent letters', blanks: [4, 5], sentence: 'The government built a new road.', def: 'the group that runs a country' },
  { w: 'accommodation', d: 3, tag: 'double consonants', blanks: [1, 2, 4, 5], sentence: 'The team found accommodation near the stadium.', def: 'a place to stay or live' },
  { w: 'embarrass', d: 3, tag: 'double consonants', blanks: [4, 5, 7, 8], sentence: 'Please do not embarrass me in front of my friends.', def: 'to make someone feel shy or ashamed' },
  { w: 'occurrence', d: 3, tag: 'double consonants', blanks: [1, 2, 4, 5], sentence: 'Floods are a common occurrence in the rainy season.', def: 'something that happens' },
  { w: 'rhythm', d: 3, tag: 'silent letters', blanks: [1, 3], sentence: 'The drummers kept a steady rhythm.', def: 'a regular, repeated pattern of sounds' },
  { w: 'conscience', d: 3, tag: '-sion / -tion / -science', blanks: [3, 4, 5], sentence: 'Her conscience told her to return the money.', def: 'the inner sense of right and wrong' },
]
const spelling: ActivityDef = {
  id: 'spelling-challenge', track: 'junior', skill: 'spelling', title: 'Spelling Challenge', subtitle: 'Missing letters and dictation', icon: ICON('star'),
  build: (_c, d) => {
    const words = pickN(SPELL.filter((s) => s.d === d), 5)
    return words.map((s, i): Question =>
      d === 1 || i < 2
        ? { kind: 'fill-blanks', word: s.w, blanks: s.blanks, pool: shuffle([...s.blanks.map((b) => s.w[b]), ...pickN('aeiouclmnrst'.split(''), 2)]), say: s.w, sentence: s.sentence, hint: `Listen to the word slowly. Watch for ${s.tag}.`, tag: s.tag }
        : { kind: 'dictation', word: s.w, say: s.w, sentence: s.sentence, definition: s.def, hint: `It means "${s.def}". Watch for ${s.tag}.`, tag: s.tag },
    )
  },
}

const PASSAGES: { p: Passage; d: Difficulty; qs: Omit<Extract<Question, { kind: 'mcq' }>, 'kind' | 'passage'>[] }[] = [
  {
    d: 1,
    p: {
      title: 'The School Debate', art: 'images/story-debate.webp',
      text: 'Kofi and Ama were preparing for the school debate. The topic was "Should every school have a garden?" They spent Saturday afternoon at the library reading articles about farming and nutrition. Ama wrote the main points on small cards, while Kofi practised speaking slowly and clearly. "If we grow our own vegetables, pupils will eat healthier lunches," Ama said. Kofi nodded and added, "And we will learn science outside the classroom." By evening they felt ready, although Kofi still worried about speaking in front of the whole school.',
    },
    qs: [
      { prompt: 'What were Kofi and Ama doing?', options: ['Watching a film', 'Preparing for a debate', 'Planting a garden', 'Going to the market'], answer: 1, explain: 'The first sentence says they were preparing for the school debate.', hint: 'Look at the very first sentence.' },
      { prompt: 'Where did they read articles?', options: ['At home', 'In the classroom', 'At the library', 'In the garden'], answer: 2, explain: 'They read articles at the library on Saturday afternoon.', hint: 'Find the word "articles" in the passage.' },
      { prompt: 'What did Ama write on small cards?', options: ['The main points', 'A poem', 'Her timetable', 'A shopping list'], answer: 0, explain: 'Ama wrote the main points on small cards.', hint: 'What would you need to remember in a debate?' },
      { prompt: 'How did Kofi feel at the end?', options: ['Bored', 'Angry', 'Ready but a little nervous', 'Very sleepy'], answer: 2, explain: 'They felt ready, "although Kofi still worried" about speaking in front of everyone.', hint: 'Read the last sentence carefully, especially the word "although".', tag: 'inference' },
      { prompt: 'Which side of the debate were Kofi and Ama on?', options: ['Schools should not have gardens', 'Schools should have gardens', 'They had not decided', 'The passage does not say'], answer: 1, explain: 'Their arguments (healthier lunches, learning science outside) support having a garden.', hint: 'Look at what Ama and Kofi say. Are they for or against gardens?', tag: 'inference' },
    ],
  },
  {
    d: 2,
    p: {
      title: 'Market Day at Kejetia',
      text: 'Kejetia Market in Kumasi is one of the largest markets in West Africa. Long before sunrise, traders arrive with baskets of plantain, pepper and fresh fish. By mid-morning the narrow lanes are so crowded that shoppers must squeeze sideways between stalls. Esi helps her aunt sell colourful kente cloth every Saturday. She has learned to greet every customer warmly, to listen carefully to what they want and to bargain politely. "A good trader," her aunt often says, "sells trust before she sells cloth." Last month a tourist bought three pieces, and returned the next week with two friends.',
    },
    qs: [
      { prompt: 'What is the main idea of the passage?', options: ['Kumasi has heavy traffic', 'Kejetia is a busy market where Esi learns to trade well', 'Kente cloth is expensive', 'Tourists do not like markets'], answer: 1, explain: 'Most sentences describe the busy market and what Esi learns while trading there.', hint: 'Which answer covers the whole passage, not just one detail?', tag: 'main idea' },
      { prompt: 'Why must shoppers "squeeze sideways"?', options: ['The stalls are closed', 'The lanes are narrow and crowded', 'It is raining', 'They are carrying fish'], answer: 1, explain: 'The lanes are narrow and so crowded that people squeeze between stalls.', hint: 'Look at the sentence that mentions mid-morning.' },
      { prompt: 'What does the aunt mean by "sells trust before she sells cloth"?', options: ['Trust is a kind of cloth', 'Customers buy from traders they trust', 'She sells cheap cloth', 'She does not trust customers'], answer: 1, explain: 'She means honesty and kindness make customers want to buy, and come back.', hint: 'Think about why the tourist came back.', tag: 'figurative language' },
      { prompt: 'Why did the tourist return with two friends?', options: ['She lost her bag', 'She was treated well and trusted Esi', 'The cloth was free', 'She was lost'], answer: 1, explain: 'This links to the aunt\'s advice: good service builds trust, so customers return and bring others.', hint: 'Connect the last sentence to the aunt\'s saying.', tag: 'inference' },
      { prompt: 'In this passage, "bargain" means to...', options: ['steal something', 'discuss and agree on a price', 'give a gift', 'shout loudly'], answer: 1, explain: 'In a market, to bargain is to discuss the price until both sides agree.', hint: 'Esi bargains politely with customers. What do buyers and sellers discuss?', tag: 'vocabulary in context' },
    ],
  },
  {
    d: 3,
    p: {
      title: 'Above the Forest Floor',
      text: 'Thirty metres above the ground, the canopy walkway at Kakum National Park sways gently with every step. Seven narrow bridges connect the giant trees, and from them visitors see a world that most people never notice: hornbills gliding between branches, butterflies resting on sunlit leaves and monkeys calling from somewhere unseen. Yet the walkway was not built simply for thrills. Park officials hoped that if people experienced the forest from above, they would value it enough to protect it. Since the walkway opened, nearby communities have earned income from tourism instead of logging, and the forest has become a classroom for thousands of students each year.',
    },
    qs: [
      { prompt: 'What was the main purpose of building the walkway?', options: ['To give visitors a thrilling ride', 'To help people value and protect the forest', 'To make logging easier', 'To study monkeys only'], answer: 1, explain: '"The walkway was not built simply for thrills"; officials hoped people would value the forest enough to protect it.', hint: 'Look for the sentence that starts with "Yet".', tag: 'author\'s purpose' },
      { prompt: 'The word "Yet" at the start of the fourth sentence signals...', options: ['a contrast with what came before', 'a list of examples', 'the end of the story', 'a question'], answer: 0, explain: '"Yet" introduces a contrast: it is thrilling, but that was not the only reason.', hint: 'Does the sentence agree with, or turn away from, the previous idea?', tag: 'connectives' },
      { prompt: 'How have nearby communities benefited?', options: ['They sell more timber', 'They earn money from tourism', 'They moved to the city', 'They built new bridges'], answer: 1, explain: 'Communities earn income from tourism instead of logging.', hint: 'Read the final sentence.' },
      { prompt: 'Which detail shows the forest is full of life that is easy to miss?', options: ['The walkway sways', 'There are seven bridges', 'Monkeys calling from somewhere unseen', 'It is thirty metres high'], answer: 2, explain: 'Animals heard but not seen show life most people never notice.', hint: 'Which detail involves something you cannot see?', tag: 'supporting detail' },
      { prompt: 'Which sentence best summarises the passage?', options: ['Kakum has seven bridges.', 'A canopy walkway lets visitors enjoy the forest and encourages its protection, helping local people too.', 'Hornbills are beautiful birds.', 'Logging is the best way to earn money.'], answer: 1, explain: 'A summary covers the main points: the experience, the purpose and the benefits.', hint: 'A good summary includes the beginning, middle and end ideas.', tag: 'summarising' },
    ],
  },
]
const readingQuest: ActivityDef = {
  id: 'reading-quest', track: 'junior', skill: 'reading', title: 'Reading Quest', subtitle: 'Read a passage and answer questions', icon: ICON('learning'),
  build: (_c, d) => {
    const set = PASSAGES.find((x) => x.d === d) ?? PASSAGES[0]
    return set.qs.map((q) => ({ kind: 'mcq', ...q, passage: set.p }))
  },
}

type MCQ = Omit<Extract<Question, { kind: 'mcq' }>, 'kind'> & { d: Difficulty }
const VOCAB: MCQ[] = [
  { d: 1, prompt: 'Choose a word that means the same as "happy".', options: ['sad', 'joyful', 'tired', 'angry'], answer: 1, explain: '"Joyful" is a synonym of "happy".', hint: 'A synonym has the same meaning.', tag: 'synonyms' },
  { d: 1, prompt: 'What is the opposite of "ancient"?', options: ['old', 'broken', 'modern', 'large'], answer: 2, explain: '"Ancient" means very old, so the antonym is "modern".', hint: 'Ancient buildings are very old. What is the opposite of very old?', tag: 'antonyms' },
  { d: 1, prompt: 'The baby was so tiny it fit in her father\'s hands. "Tiny" means...', options: ['very small', 'very loud', 'very hungry', 'very tall'], answer: 0, explain: 'If it fits in your hands, it is very small.', hint: 'Use the clue: it fit in his hands.', tag: 'context clues' },
  { d: 1, prompt: 'Which word best completes the sentence? "Please ___ the door quietly."', options: ['shout', 'close', 'eat', 'run'], answer: 1, explain: 'You close a door.', tag: 'collocation' },
  { d: 2, prompt: 'Choose the synonym of "reluctant".', options: ['eager', 'unwilling', 'quick', 'proud'], answer: 1, explain: 'Reluctant means not wanting to do something: unwilling.', hint: 'Think of how you feel about doing chores you do not like.', tag: 'synonyms' },
  { d: 2, prompt: 'What is the antonym of "generous"?', options: ['kind', 'selfish', 'rich', 'polite'], answer: 1, explain: 'Generous people share; selfish people do not.', tag: 'antonyms' },
  { d: 2, prompt: 'The fishermen were exhausted after rowing all night. "Exhausted" means...', options: ['excited', 'very tired', 'very hungry', 'lost'], answer: 1, explain: 'Rowing all night would make you very tired.', hint: 'How would you feel after working all night?', tag: 'context clues' },
  { d: 2, prompt: 'Which word fits? "The teacher asked us to ___ the story in three sentences."', options: ['summarise', 'decorate', 'whisper', 'borrow'], answer: 0, explain: 'To summarise is to give the main points briefly.', tag: 'academic vocabulary' },
  { d: 3, prompt: 'Choose the word closest in meaning to "meticulous".', options: ['careless', 'very careful and precise', 'fast', 'noisy'], answer: 1, explain: 'Meticulous means showing great attention to detail.', tag: 'synonyms' },
  { d: 3, prompt: 'The rains were "scarce" this year, so the farmers worried. "Scarce" means...', options: ['plentiful', 'not enough', 'too heavy', 'early'], answer: 1, explain: 'Farmers worry when rain is in short supply.', hint: 'Why would farmers worry?', tag: 'context clues' },
  { d: 3, prompt: 'Which is an antonym of "transparent"?', options: ['clear', 'opaque', 'glass', 'thin'], answer: 1, explain: 'Transparent means you can see through it; opaque means you cannot.', tag: 'antonyms' },
  { d: 3, prompt: '"His argument was persuasive." This means it was...', options: ['convincing', 'boring', 'very long', 'untrue'], answer: 0, explain: 'Persuasive arguments convince people.', tag: 'academic vocabulary' },
]
const vocab: ActivityDef = {
  id: 'word-quest', track: 'junior', skill: 'vocabulary', title: 'Word Quest', subtitle: 'Synonyms, antonyms and context clues', icon: ICON('rewards'),
  build: (_c, d) => pickN(VOCAB.filter((q) => q.d === d), 4).concat(pickN(VOCAB.filter((q) => q.d !== d && Math.abs(q.d - d) === 1), 1)).map(({ d: _d, ...q }) => ({ kind: 'mcq', ...q })),
}

const GRAMMAR: MCQ[] = [
  { d: 1, prompt: 'She ____ to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 1, explain: 'With "she" in the simple present, add -s: she goes.', hint: '"Every day" tells you it is a habit, so simple present. What happens to the verb after "she"?', tag: 'subject-verb agreement' },
  { d: 1, prompt: 'Yesterday, we ____ football after school.', options: ['play', 'plays', 'played', 'playing'], answer: 2, explain: '"Yesterday" needs the simple past: played.', hint: 'Which word tells you when it happened?', tag: 'past tense' },
  { d: 1, prompt: 'Which word is a noun? "The tall boy kicked the ball."', options: ['tall', 'kicked', 'ball', 'the'], answer: 2, explain: 'A noun names a person, place or thing: ball.', tag: 'parts of speech' },
  { d: 1, prompt: 'Choose the correct sentence.', options: ['my sister lives in accra.', 'My sister lives in Accra.', 'My sister lives in accra', 'my Sister lives in Accra.'], answer: 1, explain: 'Sentences start with a capital letter, names of places are capitalised, and a full stop ends the sentence.', tag: 'capital letters and punctuation' },
  { d: 1, prompt: 'The children ____ singing in the hall now.', options: ['is', 'are', 'was', 'be'], answer: 1, explain: '"Children" is plural and "now" means present: are.', tag: 'subject-verb agreement' },
  { d: 2, prompt: 'By the time we arrived, the film ____.', options: ['already started', 'has already started', 'had already started', 'already starts'], answer: 2, explain: 'One past action before another past action uses the past perfect: had started.', hint: 'Two actions in the past. Which happened first?', tag: 'past perfect' },
  { d: 2, prompt: 'Neither Kwame nor his brothers ____ late.', options: ['was', 'were', 'is', 'has'], answer: 1, explain: 'With "neither...nor", the verb agrees with the nearer subject: brothers were.', tag: 'subject-verb agreement' },
  { d: 2, prompt: 'Choose the correctly punctuated sentence.', options: ['Its a lovely day isn\'t it?', 'It\'s a lovely day, isn\'t it?', 'Its\' a lovely day, isnt it?', 'It\'s a lovely day isn\'t it.'], answer: 1, explain: '"It\'s" = it is; a comma comes before the question tag, which ends with a question mark.', tag: 'apostrophes and commas' },
  { d: 2, prompt: 'Which word is an adverb? "The drummer played loudly at the festival."', options: ['drummer', 'played', 'loudly', 'festival'], answer: 2, explain: 'Adverbs describe how an action is done: loudly.', tag: 'parts of speech' },
  { d: 2, prompt: 'If it rains tomorrow, we ____ inside.', options: ['stay', 'will stay', 'stayed', 'would stayed'], answer: 1, explain: 'First conditional: if + present, will + verb.', tag: 'conditionals' },
  { d: 3, prompt: 'Identify the relative clause: "The girl who won the prize is my cousin."', options: ['The girl', 'who won the prize', 'is my cousin', 'my cousin'], answer: 1, explain: 'A relative clause starts with who/which/that and adds information about a noun.', tag: 'clauses' },
  { d: 3, prompt: 'Change to reported speech: She said, "I am tired."', options: ['She said she is tired.', 'She said that she was tired.', 'She said I was tired.', 'She says she was tired.'], answer: 1, explain: 'In reported speech the tense moves back: am becomes was, and I becomes she.', tag: 'reported speech' },
  { d: 3, prompt: 'Which sentence uses the passive voice?', options: ['The farmer harvested the cocoa.', 'The cocoa was harvested by the farmer.', 'The farmer is harvesting.', 'Cocoa grows in Ghana.'], answer: 1, explain: 'Passive: the object becomes the subject + be + past participle.', tag: 'active and passive' },
  { d: 3, prompt: 'If I ____ the president, I would build more libraries.', options: ['am', 'was being', 'were', 'will be'], answer: 2, explain: 'The second conditional uses "were" for imaginary situations.', tag: 'conditionals' },
  { d: 3, prompt: 'Choose the sentence with correct semicolon use.', options: ['I was tired; so I slept.', 'I was tired; I went to bed early.', 'I; was tired.', 'I was; tired and I slept.'], answer: 1, explain: 'A semicolon joins two complete, related sentences.', tag: 'semicolons' },
]
const grammar: ActivityDef = {
  id: 'grammar-practice', track: 'junior', skill: 'grammar', title: 'Grammar Practice', subtitle: 'Tenses, agreement and punctuation', icon: ICON('settings'),
  build: (_c, d) => pickN(GRAMMAR.filter((q) => q.d === d), 5).map(({ d: _d, ...q }) => ({ kind: 'mcq', ...q })),
}

const LISTEN: MCQ[] = [
  { d: 1, audio: 'Good morning, pupils. Please bring your mathematics books to class tomorrow.', prompt: 'What should pupils bring tomorrow?', options: ['Their lunch', 'Mathematics books', 'Football boots', 'Their parents'], answer: 1, explain: 'The speaker asks for mathematics books.', tag: 'listening for detail' },
  { d: 1, audio: 'The bus to Cape Coast leaves at half past nine from platform three.', prompt: 'When does the bus leave?', options: ['9:00', '9:30', '3:00', '3:30'], answer: 1, explain: '"Half past nine" means 9:30.', tag: 'listening for detail' },
  { d: 2, audio: 'Although the match was cancelled because of the storm, the coach said the team would train indoors on Friday.', prompt: 'What will the team do on Friday?', options: ['Play the match', 'Train indoors', 'Rest at home', 'Travel to the stadium'], answer: 1, explain: 'The coach said they would train indoors on Friday.', tag: 'listening for detail' },
  { d: 2, audio: 'Esi was sure she had left her keys on the table, but when she checked her bag, there they were.', prompt: 'Where were the keys?', options: ['On the table', 'In her bag', 'In the car', 'Lost forever'], answer: 1, explain: '"There they were" refers to her bag.', tag: 'inference' },
  { d: 3, audio: 'Visitors are reminded that photography is permitted in the gallery, but flash must be switched off to protect the paintings.', prompt: 'What is not allowed in the gallery?', options: ['Taking photos', 'Using flash', 'Visiting', 'Looking at paintings'], answer: 1, explain: 'Photos are allowed, but flash must be switched off.', tag: 'inference' },
  { d: 3, audio: 'The scientist explained that the river had not flooded in years, yet the community still practised its evacuation plan every rainy season.', prompt: 'Why does the community practise the plan?', options: ['The river floods every year', 'To be prepared, even though floods are rare', 'The scientist forced them', 'It is a festival'], answer: 1, explain: '"Yet" shows they prepare even though floods have not happened for years.', tag: 'inference' },
]
const listenUp: ActivityDef = {
  id: 'listen-up', track: 'junior', skill: 'listening', title: 'Listen Up', subtitle: 'Listen to the announcement and answer', icon: ICON('sound'),
  build: (_c, d) => shuffle(LISTEN.filter((q) => q.d <= d)).slice(0, 4).map(({ d: _d, ...q }) => ({ kind: 'mcq', ...q, hint: 'Tap play to listen again. Focus on the key words in the question.' })),
}

const SPEAK: Record<Difficulty, string[]> = {
  1: ['The market is busy on Saturday.', 'I like to read stories with my friends.', 'Our school has a big green field.', 'Please pass me the blue pen.'],
  2: ['Reading every day helps us learn new words.', 'The farmers harvested cocoa before the rain.', 'Our class visited the museum in Cape Coast.', 'Practice makes progress, not perfection.'],
  3: ['Protecting the environment is everyone\'s responsibility.', 'The canopy walkway encourages visitors to value the forest.', 'Confident speakers pause, breathe and speak clearly.', 'Technology can connect classrooms across the world.'],
}
const readAloud: ActivityDef = {
  id: 'read-aloud', track: 'junior', skill: 'speaking', title: 'Read Aloud', subtitle: 'Say the sentence clearly into the microphone', icon: ICON('sound'),
  build: (_c, d) => SPEAK[d].map((text) => ({ kind: 'speak', text, tag: 'clarity and fluency' })),
}

const WRITE: Record<Difficulty, Extract<Question, { kind: 'write' }>> = {
  1: { kind: 'write', genre: 'descriptive', minWords: 50, prompt: 'Describe a busy market. What can you see, hear and smell? Write one paragraph of at least 5 sentences.' },
  2: { kind: 'write', genre: 'letter', minWords: 80, prompt: 'Write a short letter to a friend telling them about the best day of your holidays. Include a greeting, what happened, how you felt and a closing.' },
  3: { kind: 'write', genre: 'argument', minWords: 110, prompt: 'Should every school have a garden? Write a short argument with a clear opinion, at least two reasons with examples, and a conclusion.' },
}
const writingWorkshop: ActivityDef = {
  id: 'writing-workshop', track: 'junior', skill: 'writing', title: 'Writing Workshop', subtitle: 'Write a paragraph and get feedback', icon: ICON('hint'),
  build: (_c, d) => [WRITE[d]],
}

export const ACTIVITIES: ActivityDef[] = [
  letterHunt, letterSounds, traceLetters, twoLetter, makeWord3, makeWord4, listenMatch, firstSentences,
  spelling, readingQuest, vocab, grammar, listenUp, readAloud, writingWorkshop,
]
export const activityById = (id: string) => ACTIVITIES.find((a) => a.id === id)

/* ---------- spoken lines (shared by the app and scripts/voice-lines.ts) ---------- */
export const VOICE = {
  traceLetter: (l: string) => `Trace the letter ${l}`,
  fillBlanks: (say: string, sentence: string) => `${say}. ${sentence}`,
  dictation: (word: string, sentence: string) => `${word}. ${sentence} ${word}.`,
  buildWordIntro: 'What word is this?',
  sentenceIntro: 'Put the words in order to make a sentence.',
  praise: ['Great job!', 'Well done!', 'You did it!', 'Super!'],
  retry: 'Almost! Try again.',
  reveal: "That's okay! Let's look at the answer together.",
  hi: (name: string) => `Hi ${name}!`,
  letsPlay: (title: string) => `Let's play ${title}! Tap the big button.`,
  pickWorld: 'Pick a world to explore!',
  score: (c: number, t: number) => `You got ${c} out of ${t}.`,
  headlines: ['Well Done!', 'Good effort!', 'Keep going!', 'Nice practice!'],
}
