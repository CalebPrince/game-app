// Rule-based writing feedback for the demo. In production this would be an AI review with
// a restricted, age-appropriate prompt; the checklist shape (and how it scores) stays the same.
export interface WritingCheck {
  id: string
  label: string
  ok: boolean
  tip: string
}

const LINKERS = ['and', 'but', 'because', 'so', 'then', 'also', 'however', 'although', 'firstly', 'secondly', 'finally', 'therefore', 'in addition', 'for example', 'as a result', 'in conclusion', 'after that', 'next']
const SENSES = ['see', 'saw', 'hear', 'heard', 'smell', 'smelt', 'smelled', 'taste', 'feel', 'felt', 'loud', 'bright', 'colourful', 'colorful', 'sweet', 'noisy', 'busy', 'crowded', 'fresh', 'spicy', 'shouting', 'calling']
const OPINION = ['i think', 'i believe', 'in my opinion', 'i strongly', 'should', 'must']

export function reviewWriting(text: string, genre: string, minWords: number) {
  const clean = text.trim()
  const words = clean ? clean.split(/\s+/) : []
  const lower = ' ' + clean.toLowerCase().replace(/\s+/g, ' ') + ' '
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  const counts = new Map<string, number>()
  for (const w of words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter((w) => w.length > 3)) counts.set(w, (counts.get(w) ?? 0) + 1)
  const repeated = [...counts.entries()].filter(([, n]) => n >= 4).map(([w]) => w)
  const lowercaseI = /(^|\s)i(\s|')/.test(clean)
  const sentenceStartsOk = sentences.every((s) => /^["'(]?[A-Z0-9]/.test(s.trim()))

  const checks: WritingCheck[] = [
    { id: 'length', label: `At least ${minWords} words`, ok: words.length >= minWords, tip: `You have ${words.length} words. Add more detail or another example.` },
    { id: 'sentences', label: 'Several complete sentences', ok: sentences.length >= (genre === 'argument' ? 6 : 5), tip: 'Break your ideas into separate sentences, each ending with . ! or ?' },
    { id: 'capitals', label: 'Sentences start with capital letters', ok: sentenceStartsOk && !lowercaseI, tip: lowercaseI ? 'Remember: the word "I" is always a capital letter.' : 'Check that every sentence starts with a capital letter.' },
    { id: 'ending', label: 'Ends with punctuation', ok: /[.!?]["')]?$/.test(clean), tip: 'Finish your last sentence with a full stop.' },
    { id: 'linking', label: 'Uses linking words', ok: LINKERS.filter((l) => lower.includes(` ${l} `)).length >= 2, tip: 'Join ideas with words like because, however, also, for example.' },
    { id: 'variety', label: 'Varied word choice', ok: repeated.length === 0, tip: repeated.length ? `You used "${repeated[0]}" many times. Try a synonym.` : '' },
  ]
  if (genre === 'descriptive') checks.push({ id: 'senses', label: 'Uses the senses', ok: SENSES.filter((s) => lower.includes(` ${s}`)).length >= 3, tip: 'Tell the reader what you could see, hear and smell.' })
  if (genre === 'letter') checks.push({ id: 'format', label: 'Greeting and closing', ok: /\bdear\b/i.test(clean) && /(yours|love|best wishes|regards|your friend)/i.test(clean), tip: 'Start with "Dear ..." and end with "Your friend" or "Best wishes".' })
  if (genre === 'argument') checks.push({ id: 'opinion', label: 'States a clear opinion', ok: OPINION.some((o) => lower.includes(o)), tip: 'Say clearly what you think: "I believe that..."' }, { id: 'conclusion', label: 'Has a conclusion', ok: /(in conclusion|to conclude|therefore|for these reasons|in summary)/i.test(clean), tip: 'End with a sentence that sums up your argument.' })

  const passed = checks.filter((c) => c.ok).length
  return { checks, passed, total: checks.length, words: words.length, sentences: sentences.length }
}
