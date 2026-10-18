import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Lightbulb, X } from 'lucide-react'
import { VOICE, activityById, buildRound, type Question } from '../../lib/content'
import { minutesToday, useChild, useStore, type FinishResult } from '../../lib/store'
import { SKILLS, curriculumLabel } from '../../lib/skills'
import { emptyMastery } from '../../lib/engine'
import type { ItemResult } from '../../lib/types'
import { Bar, CoinChip, MusicToggle } from '../../components/ui'
import { QuestionView, type Phase } from './questions'
import { Results } from './Results'
import { speak } from '../../lib/speech'
import { playSfx } from '../../lib/sfx'
import { track } from '../../lib/analytics'

function topicOf(qs: Question[]) {
  const q = qs[0]
  if (!q) return ''
  if (q.kind === 'mcq' && q.passage) return `"${q.passage.title}"`
  const tags = [...new Set(qs.map((x) => x.tag).filter(Boolean))]
  if (q.kind === 'build-word' || q.kind === 'fill-blanks' || q.kind === 'dictation') return qs.map((x) => ('word' in x ? x.word : '')).filter(Boolean).slice(0, 3).join(', ')
  if (q.kind === 'trace') return qs.map((x) => (x.kind === 'trace' ? x.letter : '')).join(', ')
  if (q.kind === 'write') return q.genre === 'letter' ? 'Letter to a friend' : q.genre === 'argument' ? 'Argument essay' : 'Descriptive paragraph'
  return tags.slice(0, 2).join(', ') || 'Practice'
}

export function ActivityRunner() {
  const { activityId } = useParams()
  const nav = useNavigate()
  const activity = activityById(activityId ?? '')
  const childId = useStore((s) => s.activeChildId)
  const child = useChild(childId)
  const attempts = useStore((s) => s.attempts)
  const finish = useStore((s) => s.finishActivity)

  const difficulty = child?.mastery[activity?.skill ?? 'spelling']?.difficulty ?? emptyMastery().difficulty
  // easy to hard through the round: each item keeps its own level (buildRound in content.ts)
  const round = useMemo(() => (activity && child ? buildRound(activity, child, difficulty) : []), [activity?.id, child?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(() => round.map((r) => r.q), [round])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])
  const [tries, setTries] = useState(0)
  const [hint, setHint] = useState(false)
  const [phase, setPhase] = useState<Phase>('answering')
  const [done, setDone] = useState<FinishResult | null>(null)
  const [practiceOnly, setPracticeOnly] = useState(false)
  const started = useRef(Date.now())

  useEffect(() => {
    setTries(0)
    setHint(false)
    setPhase('answering')
  }, [index])

  useEffect(() => {
    if (activity && child) track('activity_started', { activity: activity.id, activity_title: activity.title, skill: activity.skill, track: child.track, difficulty, questions: questions.length })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activity) return <Navigate to="/play" replace />
  if (!child) return <Navigate to="/who" replace />
  if (minutesToday(attempts, child.id) >= child.settings.dailyLimitMin && !done) return <Navigate to="/play" replace />

  const little = child.track === 'little'
  const q = questions[index]
  const qd = round[index]?.d ?? difficulty // this question's level
  const color = SKILLS[activity.skill].color
  const maxTries = little ? 3 : q?.kind === 'mcq' || q?.kind === 'dictation' ? 2 : 3
  const multiItem = q?.kind === 'write' // write reports several checklist items at once

  const complete = (all: ItemResult[], practice = practiceOnly) => {
    const durationSec = Math.max(30, Math.round((Date.now() - started.current) / 1000))
    const r = finish({ child, activity, topic: topicOf(questions), items: all, durationSec, practiceOnly: practice })
    track('activity_completed', {
      activity: activity.id, activity_title: activity.title, skill: activity.skill, track: child.track, difficulty,
      correct: r.attempt.correct, total: r.attempt.total, accuracy: r.attempt.total ? Math.round((r.attempt.correct / r.attempt.total) * 100) : 0,
      hints: r.attempt.hints, duration_sec: durationSec, stars: r.stars, practice_only: !!practice,
      mastery_before: Math.round(r.attempt.masteryBefore * 100), mastery_after: Math.round(r.attempt.masteryAfter * 100),
      badges_earned: r.badges.length, leveled_up: r.leveledUp,
    })
    setDone(r)
  }

  const submit = (correct: boolean) => {
    if (phase === 'correct' || phase === 'revealed') return
    if (correct) {
      playSfx('correct')
      setResults((r) => [...r, { correct: true, tries, hint, difficulty: qd, tag: q.tag }])
      setPhase('correct')
      if (little) speak(VOICE.praise[Math.floor(Math.random() * VOICE.praise.length)])
    } else {
      playSfx('wrong')
      const t = tries + 1
      if (t >= maxTries) {
        setResults((r) => [...r, { correct: false, tries: t, hint, difficulty: qd, tag: q.tag }])
        setPhase('revealed')
        if (little) speak(VOICE.reveal)
      } else {
        setTries(t)
        setPhase('retry')
        if (little) speak(VOICE.retry)
      }
    }
  }

  const submitItems = (items: ItemResult[], practice = false) => {
    if (practice) setPracticeOnly(true)
    const all = [...results, ...items]
    setResults(all)
    if (index + 1 >= questions.length) complete(all, practice || practiceOnly)
    else setIndex(index + 1)
  }

  const next = () => {
    if (index + 1 >= questions.length) complete(results)
    else setIndex(index + 1)
  }

  if (done) return <Results child={child} activity={activity} result={done} />

  const hintText = q?.hint
  const showCompanion = child.settings.aiCompanion && hintText && !multiItem && q.kind !== 'speak'

  return (
    <div className="flex min-h-dvh flex-col bg-sky">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => {
              track('activity_quit', { activity: activity.id, skill: activity.skill, track: child.track, at_question: index + 1, of: questions.length })
              nav(-1)
            }}
            className="grid size-10 place-items-center rounded-full bg-sky text-ink-soft"
            aria-label="Quit activity"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="truncate font-display text-lg font-semibold">{activity.title}</h1>
              <span className="text-sm font-bold text-ink-soft">
                {Math.min(index + 1, questions.length)}/{questions.length}
              </span>
            </div>
            <Bar value={(index + (phase === 'correct' || phase === 'revealed' ? 1 : 0)) / questions.length} color={color} height={8} />
          </div>
          {!little && <CoinChip coins={child.coins} />}
          <MusicToggle />
        </div>
        {!little && <div className="mx-auto max-w-3xl px-4 pb-2 text-[11px] font-bold tracking-wide text-ink-faint uppercase">{curriculumLabel(child)} · {SKILLS[activity.skill].label}</div>}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-44">
        {q && (
          <QuestionView key={index} q={q} little={little} phase={phase} onSubmit={submit} onItems={submitItems} voiceConsent={child.settings.voiceConsent} difficulty={qd} />
        )}

        {showCompanion && (phase === 'answering' || phase === 'retry') && (
          <div className="mt-5">
            {hint ? (
              <div className="pop flex items-end gap-2">
                <img src="images/sheet/mascots/owl.png" alt="Ollie" className="w-14 shrink-0" />
                <div className="mb-1 rounded-2xl rounded-bl-sm bg-[#fff7dd] px-4 py-2.5 text-sm font-semibold shadow-[0_2px_0_#f3e1a6]">{hintText}</div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setHint(true)
                  track('hint_used', { activity: activity.id, skill: activity.skill, question: index + 1 })
                  if (little && hintText) speak(hintText)
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft shadow-[0_2px_0_#dbe5f3] hover:text-brand"
              >
                <Lightbulb className="size-4 text-sun-dark" /> Ask Ollie for a hint
              </button>
            )}
          </div>
        )}
      </main>

      {!multiItem && q?.kind !== 'speak' && (phase === 'retry' || phase === 'correct' || phase === 'revealed') && (
        <Feedback phase={phase} q={q} little={little} onNext={next} last={index + 1 >= questions.length} />
      )}
    </div>
  )
}

function Feedback({ phase, q, little, onNext, last }: { phase: Phase; q: Question; little: boolean; onNext: () => void; last: boolean }) {
  const good = phase === 'correct'
  const retry = phase === 'retry'
  const answer =
    q.kind === 'mcq' ? q.options[q.answer] : q.kind === 'build-sentence' ? q.words.join(' ') + '.' : 'answer' in q ? q.answer : 'word' in q ? q.word : ''
  const explain = q.kind === 'mcq' ? q.explain : ''
  if (retry)
    return (
      <div className="pop fixed inset-x-0 bottom-0 z-30 border-t-4 border-sun bg-[#fff8e1] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl font-display text-xl font-semibold text-[#8a6200]">{little ? 'Almost! Try again.' : 'Not quite. Have another go.'}</div>
        <div className="mx-auto max-w-3xl text-sm text-[#8a6200]/80">Mistakes help your brain grow. Ask Ollie if you need a hint.</div>
      </div>
    )
  return (
    <div className={`pop fixed inset-x-0 bottom-0 z-30 border-t-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${good ? 'border-leaf bg-[#e6f8ee]' : 'border-coral bg-[#fdeeea]'}`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <img src={`images/sheet/icons/${good ? 'correct' : 'help'}.png`} alt="" className="size-11" />
          <div>
            <div className={`font-display text-xl font-semibold ${good ? 'text-leaf-dark' : 'text-coral-dark'}`}>{good ? (little ? 'Great job!' : 'Correct!') : "Let's learn this one"}</div>
            {!good && answer && (
              <div className="text-sm font-semibold text-ink">
                The answer is <span className="font-black">{answer}</span>
              </div>
            )}
            {explain && <div className="mt-0.5 text-sm text-ink-soft">{explain}</div>}
          </div>
        </div>
        <button onClick={onNext} className="btn-game w-full sm:w-44" style={good ? { ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' } : undefined}>
          {last ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}

/** Remount the runner for each activity (and each visit), so chaining "Next activity" starts fresh. */
export function KeyedRunner() {
  const { activityId } = useParams()
  const loc = useLocation()
  return <ActivityRunner key={`${activityId}-${loc.key}`} />
}
