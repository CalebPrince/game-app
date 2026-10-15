import { useEffect, useRef, useState } from 'react'
import { BookOpen, Eraser, Mic, MicOff, Play, RotateCcw, Square } from 'lucide-react'
import { VOICE, type Question } from '../../lib/content'
import type { Difficulty, ItemResult } from '../../lib/types'
import { Art, SpeakButton } from '../../components/ui'
import { compareSpeech, recognizer, speak } from '../../lib/speech'
import { reviewWriting } from '../../lib/writing'

export type Phase = 'answering' | 'retry' | 'correct' | 'revealed'

interface Props {
  q: Question
  little: boolean
  phase: Phase
  onSubmit: (correct: boolean) => void
  onItems: (items: ItemResult[], practiceOnly?: boolean) => void
  voiceConsent: boolean
  difficulty: Difficulty
}

const locked = (p: Phase) => p === 'correct' || p === 'revealed'
const tileState = (isAnswer: boolean, chosen: boolean, phase: Phase) => {
  if (phase === 'correct' && chosen) return 'correct'
  if (phase === 'revealed' && isAnswer) return 'correct'
  if ((phase === 'retry' || phase === 'revealed') && chosen && !isAnswer) return 'wrong'
  if (chosen) return 'selected'
  return undefined
}

export function QuestionView(p: Props) {
  const { q } = p
  switch (q.kind) {
    case 'pick-letter':
    case 'pick-word':
    case 'pick-picture':
      return <Pick {...p} q={q} />
    case 'trace':
      return <Trace {...p} q={q} />
    case 'build-word':
    case 'fill-blanks':
      return <BuildWord {...p} q={q} />
    case 'dictation':
      return <Dictation {...p} q={q} />
    case 'build-sentence':
      return <BuildSentence {...p} q={q} />
    case 'mcq':
      return <MCQ {...p} q={q} />
    case 'speak':
      return <Speak {...p} q={q} />
    case 'write':
      return <Write {...p} q={q} />
  }
}

function Title({ children, say }: { children: React.ReactNode; say?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-center">
      <h2 className="font-display text-2xl font-semibold md:text-3xl">{children}</h2>
      {say && <SpeakButton text={say} />}
    </div>
  )
}

/* ---------- tap-to-pick: letters, words, pictures ---------- */
function Pick({ q, phase, onSubmit, little }: Props & { q: Extract<Question, { kind: 'pick-letter' | 'pick-word' | 'pick-picture' }> }) {
  const [chosen, setChosen] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => speak(q.say), 350)
    return () => clearTimeout(t)
  }, [q.say])
  const pics = q.kind === 'pick-picture'
  const cols = q.options.length <= 3 ? 'grid-cols-3' : q.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
  return (
    <div>
      <Title say={q.say}>{q.prompt}</Title>
      {q.kind === 'pick-word' && <p className="mt-1 text-center text-sm text-ink-soft">Tap the speaker to hear it again</p>}
      <div className={`mx-auto mt-8 grid max-w-xl gap-3 ${cols}`}>
        {q.options.map((o) => (
          <button
            key={o}
            disabled={locked(phase)}
            onClick={() => {
              setChosen(o)
              onSubmit(o === q.answer)
            }}
            data-state={tileState(o === q.answer, chosen === o, phase)}
            className={`tile grid aspect-square place-items-center ${phase === 'retry' && chosen === o ? 'shake' : ''}`}
          >
            {pics ? <Art src={`images/sheet/objects/${o}.png`} alt={o} className="h-[72%] w-[72%] object-contain" /> : <span className={`font-display font-semibold ${little ? 'text-6xl' : 'text-5xl'}`}>{o}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- letter tracing on a canvas ---------- */
function Trace({ q, phase, onSubmit }: Props & { q: Extract<Question, { kind: 'trace' }> }) {
  const guide = useRef<HTMLCanvasElement>(null)
  const ink = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)
  const S = 320
  const font = `600 250px Fredoka, Nunito, sans-serif`

  useEffect(() => {
    speak(VOICE.traceLetter(q.letter))
    let alive = true
    document.fonts.load(font).finally(() => {
      if (!alive || !guide.current) return
      const g = guide.current.getContext('2d')!
      g.clearRect(0, 0, S, S)
      g.font = font
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = '#e7eefa'
      g.fillText(q.letter, S / 2, S / 2 + 12)
      g.setLineDash([3, 12])
      g.lineCap = 'round'
      g.lineWidth = 5
      g.strokeStyle = '#8fb1f5'
      g.strokeText(q.letter, S / 2, S / 2 + 12)
    })
    return () => {
      alive = false
    }
  }, [q.letter]) // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: React.PointerEvent) => {
    const r = ink.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * S, ((e.clientY - r.top) / r.height) * S] as [number, number]
  }
  const line = (a: [number, number], b: [number, number]) => {
    const c = ink.current!.getContext('2d')!
    c.strokeStyle = '#1f6bff'
    c.lineWidth = 18
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(...a)
    c.lineTo(...b)
    c.stroke()
  }
  const clear = () => ink.current!.getContext('2d')!.clearRect(0, 0, S, S)

  const check = () => {
    // glyph pixels: the letter shape itself. zone: the glyph plus a forgiving margin.
    const off = document.createElement('canvas')
    off.width = off.height = S
    const o = off.getContext('2d', { willReadFrequently: true })!
    o.font = font
    o.textAlign = 'center'
    o.textBaseline = 'middle'
    o.fillText(q.letter, S / 2, S / 2 + 12)
    const glyph = o.getImageData(0, 0, S, S).data
    o.lineWidth = 34
    o.strokeText(q.letter, S / 2, S / 2 + 12)
    const zone = o.getImageData(0, 0, S, S).data
    // user ink, thickened, to measure how much of the glyph was covered
    const thick = document.createElement('canvas')
    thick.width = thick.height = S
    const t = thick.getContext('2d', { willReadFrequently: true })!
    t.filter = 'blur(6px)'
    t.drawImage(ink.current!, 0, 0)
    t.drawImage(ink.current!, 0, 0)
    const user = t.getImageData(0, 0, S, S).data
    const raw = ink.current!.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, S, S).data
    let g = 0, covered = 0, inkN = 0, inside = 0
    for (let i = 3; i < glyph.length; i += 16) {
      if (glyph[i] > 128) {
        g++
        if (user[i] > 40) covered++
      }
      if (raw[i] > 128) {
        inkN++
        if (zone[i] > 60) inside++
      }
    }
    const coverage = covered / Math.max(1, g)
    const accuracy = inside / Math.max(1, inkN)
    const ok = inkN > 20 && coverage >= 0.55 && accuracy >= 0.7
    if (!ok) clear()
    onSubmit(ok)
  }

  return (
    <div>
      <Title say={VOICE.traceLetter(q.letter)}>Trace the letter</Title>
      <div className="relative mx-auto mt-5 aspect-square w-full max-w-[340px] rounded-[28px] bg-white shadow-[0_4px_0_#dbe5f3]">
        <canvas ref={guide} width={S} height={S} className="absolute inset-0 h-full w-full" />
        <canvas
          ref={ink}
          width={S}
          height={S}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={(e) => {
            if (locked(phase)) return
            drawing.current = true
            last.current = pos(e)
            ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return
            const p = pos(e)
            line(last.current, p)
            last.current = p
          }}
          onPointerUp={() => {
            drawing.current = false
            last.current = null
          }}
        />
      </div>
      <div className="mx-auto mt-5 flex max-w-[340px] gap-3">
        <button onClick={clear} disabled={locked(phase)} className="btn-game flex-1" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-ink-soft)' }}>
          <Eraser className="size-5" /> Clear
        </button>
        <button onClick={check} disabled={locked(phase)} className="btn-game flex-[2]" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
          Done
        </button>
      </div>
    </div>
  )
}

/* ---------- build a word / fill missing letters with letter tiles ---------- */
const TILE_COLORS = ['#ff9a1f', '#1f6bff', '#1fae6a', '#8a5cf6', '#ef4f7a', '#129fc4', '#e8a600']
function BuildWord({ q, phase, onSubmit, little }: Props & { q: Extract<Question, { kind: 'build-word' | 'fill-blanks' }> }) {
  const word = q.word
  const blanks = q.kind === 'fill-blanks' ? q.blanks : word.split('').map((_, i) => i)
  const [slots, setSlots] = useState<(number | null)[]>(blanks.map(() => null)) // index into pool
  const say = q.kind === 'fill-blanks' ? q.say : word
  useEffect(() => {
    const t = setTimeout(() => speak(q.kind === 'fill-blanks' ? VOICE.fillBlanks(q.say, q.sentence) : VOICE.buildWordIntro), 300)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase === 'retry') setTimeout(() => setSlots(blanks.map(() => null)), 700)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const used = new Set(slots.filter((s): s is number => s !== null))
  const place = (pi: number) => {
    const at = slots.indexOf(null)
    if (at === -1 || locked(phase)) return
    speak(q.pool[pi])
    const n = [...slots]
    n[at] = pi
    setSlots(n)
  }
  const full = slots.every((s) => s !== null)
  const built = () => {
    const chars = word.split('')
    blanks.forEach((b, i) => (chars[b] = slots[i] !== null ? q.pool[slots[i]!] : '_'))
    return chars.join('')
  }
  const reveal = phase === 'revealed'
  const slot = word.length > 6 ? 'h-14 w-9 text-3xl md:h-16 md:w-12 md:text-4xl' : 'h-16 w-12 text-4xl md:w-14'

  return (
    <div className="text-center">
      {q.kind === 'build-word' ? (
        <>
          <button onClick={() => speak(word)} className="relative mx-auto block" aria-label="Hear the word">
            <Art src={q.picture!} alt="" className={`mx-auto object-contain drop-shadow-xl ${little ? 'h-44' : 'h-36'}`} />
            <span className="absolute top-0 -right-10 grid size-11 place-items-center rounded-full bg-white text-brand shadow ring-2 ring-line">
              <Play className="size-5 fill-current" />
            </span>
          </button>
          <h2 className="mt-3 font-display text-2xl font-semibold">{q.prompt}</h2>
        </>
      ) : (
        <>
          <Title say={VOICE.fillBlanks(say, q.sentence)}>Complete the word</Title>
          <p className="mx-auto mt-2 max-w-md text-ink-soft italic">"{q.sentence.replace(new RegExp(word, 'i'), '_____')}"</p>
        </>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-1.5 md:gap-2">
        {word.split('').map((ch, i) => {
          const bi = blanks.indexOf(i)
          if (bi === -1)
            return (
              <span key={i} className={`grid place-items-center rounded-2xl bg-white font-display font-semibold text-ink-soft ${slot}`}>
                {ch}
              </span>
            )
          const pi = slots[bi]
          return (
            <button
              key={i}
              onClick={() => {
                if (locked(phase) || pi === null) return
                const n = [...slots]
                n[bi] = null
                setSlots(n)
              }}
              className={`grid place-items-center rounded-2xl border-[3px] border-dashed font-display font-semibold ${slot} ${
                phase === 'correct' ? 'border-leaf bg-[#e3f7ec] text-leaf-dark' : phase === 'retry' ? 'shake border-coral bg-[#fde8e4]' : pi !== null ? 'border-brand bg-brand-soft text-brand' : 'border-ink-faint/50 bg-white'
              }`}
            >
              {reveal ? ch : pi !== null ? q.pool[pi] : ''}
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2.5">
        {q.pool.map((ch, pi) => (
          <button
            key={pi}
            disabled={used.has(pi) || locked(phase)}
            onClick={() => place(pi)}
            className="btn-game h-16 w-14 rounded-2xl p-0 text-3xl disabled:opacity-25"
            style={{ ['--face' as string]: TILE_COLORS[pi % TILE_COLORS.length], ['--ledge' as string]: `color-mix(in oklab, ${TILE_COLORS[pi % TILE_COLORS.length]} 70%, black)` }}
          >
            {ch}
          </button>
        ))}
      </div>

      {!locked(phase) && (
        <button disabled={!full} onClick={() => onSubmit(built().toLowerCase() === word.toLowerCase())} className="btn-game mx-auto mt-8 w-full max-w-sm text-xl" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
          Check
        </button>
      )}
    </div>
  )
}

/* ---------- dictation ---------- */
function Dictation({ q, phase, onSubmit }: Props & { q: Extract<Question, { kind: 'dictation' }> }) {
  const [v, setV] = useState('')
  useEffect(() => {
    const t = setTimeout(() => speak(VOICE.dictation(q.word, q.sentence)), 300)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div className="text-center">
      <Title say={VOICE.dictation(q.word, q.sentence)}>Spell the word you hear</Title>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Meaning: <span className="font-semibold text-ink">{q.definition}</span>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (v.trim()) onSubmit(v.trim().toLowerCase() === q.word.toLowerCase())
        }}
        className="mx-auto mt-6 max-w-sm"
      >
        <input
          value={phase === 'revealed' ? q.word : v}
          onChange={(e) => setV(e.target.value)}
          disabled={locked(phase)}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-2xl border-[3px] bg-white px-4 py-4 text-center font-display text-3xl font-semibold tracking-wider outline-none ${
            phase === 'correct' ? 'border-leaf' : phase === 'retry' ? 'shake border-coral' : 'border-line focus:border-brand'
          }`}
          placeholder="type here"
        />
        {!locked(phase) && (
          <button type="submit" disabled={!v.trim()} className="btn-game mt-5 w-full text-xl" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
            Check
          </button>
        )}
      </form>
    </div>
  )
}

/* ---------- put words in order ---------- */
function BuildSentence({ q, phase, onSubmit }: Props & { q: Extract<Question, { kind: 'build-sentence' }> }) {
  const [order] = useState(() => {
    let s = [...q.words].sort(() => Math.random() - 0.5)
    if (s.join(' ') === q.words.join(' ')) s = [...s.slice(1), s[0]]
    return s
  })
  const [picked, setPicked] = useState<number[]>([])
  useEffect(() => {
    if (phase === 'retry') setTimeout(() => setPicked([]), 700)
  }, [phase])
  useEffect(() => speak(VOICE.sentenceIntro), [])
  const sentence = picked.map((i) => order[i]).join(' ')
  return (
    <div className="text-center">
      {q.picture && <Art src={q.picture} alt="" className="mx-auto h-36 object-contain drop-shadow-xl" />}
      <Title say={q.words.join(' ')}>Make the sentence</Title>
      <div className={`mx-auto mt-5 flex min-h-[84px] max-w-xl flex-wrap items-center justify-center gap-2 rounded-3xl border-[3px] border-dashed bg-white p-3 ${phase === 'correct' ? 'border-leaf' : phase === 'retry' ? 'shake border-coral' : 'border-line'}`}>
        {(phase === 'revealed' ? q.words.map((_, i) => order.indexOf(q.words[i])) : picked).map((i, k) => (
          <button key={k} onClick={() => !locked(phase) && setPicked(picked.filter((x) => x !== i))} className="rounded-xl bg-brand-soft px-3 py-2 font-display text-2xl font-semibold text-brand">
            {order[i]}
          </button>
        ))}
        {picked.length === 0 && phase !== 'revealed' && <span className="text-ink-faint">Tap the words below</span>}
        {(picked.length === q.words.length || phase === 'revealed') && <span className="font-display text-2xl font-semibold">.</span>}
      </div>
      <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2.5">
        {order.map((w, i) => (
          <button
            key={i}
            disabled={picked.includes(i) || locked(phase)}
            onClick={() => {
              speak(w)
              setPicked([...picked, i])
            }}
            className="tile px-4 py-3 font-display text-2xl font-semibold disabled:opacity-25"
          >
            {w}
          </button>
        ))}
      </div>
      {!locked(phase) && (
        <button disabled={picked.length !== q.words.length} onClick={() => onSubmit(sentence === q.words.join(' '))} className="btn-game mx-auto mt-8 w-full max-w-sm text-xl" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
          Check
        </button>
      )}
    </div>
  )
}

/* ---------- multiple choice, optionally with a passage or audio ---------- */
function MCQ({ q, phase, onSubmit }: Props & { q: Extract<Question, { kind: 'mcq' }> }) {
  const [sel, setSel] = useState<number | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [showPassage, setShowPassage] = useState(true)
  useEffect(() => {
    if (phase === 'retry') setSel(null)
  }, [phase])
  return (
    <div className={q.passage ? 'grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-start' : ''}>
      {q.passage && (
        <div className="rounded-3xl bg-white p-4 shadow-[0_3px_0_#dbe5f3] md:sticky md:top-28">
          <button onClick={() => setShowPassage(!showPassage)} className="flex w-full items-center gap-2 text-left">
            <BookOpen className="size-5 text-read" />
            <span className="flex-1 font-display text-lg font-semibold">{q.passage.title}</span>
            <span className="text-xs font-bold text-brand md:hidden">{showPassage ? 'Hide' : 'Show'}</span>
          </button>
          <div className={`${showPassage ? '' : 'hidden'} md:block`}>
            {q.passage.art && <Art src={q.passage.art} alt="" className="mt-3 aspect-[16/9] w-full rounded-2xl object-cover" />}
            <p className="mt-3 text-[15px] leading-relaxed">{q.passage.text}</p>
            <button onClick={() => speak(q.passage!.text, { rate: 0.95 })} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <Play className="size-4 fill-current" /> Listen to the passage
            </button>
          </div>
        </div>
      )}
      <div>
        {q.audio && (
          <button onClick={() => speak(q.audio!, { rate: 0.92 })} className="mx-auto mb-5 flex items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 font-display text-lg font-semibold shadow-[0_3px_0_#dbe5f3]">
            <span className="grid size-12 place-items-center rounded-full bg-listen text-white">
              <Play className="size-6 fill-current" />
            </span>
            Play the announcement
          </button>
        )}
        <h2 className="font-display text-xl font-semibold md:text-2xl">{q.prompt}</h2>
        <div className="mt-4 grid gap-2.5">
          {q.options.map((o, i) => (
            <button
              key={i}
              disabled={locked(phase)}
              onClick={() => setSel(i)}
              data-state={phase === 'answering' || phase === 'retry' ? (sel === i ? 'selected' : chosen === i && phase === 'retry' ? 'wrong' : undefined) : tileState(i === q.answer, chosen === i, phase)}
              className="tile flex items-center gap-3 px-4 py-3 text-left font-semibold"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-current text-xs font-black opacity-70">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
        </div>
        {!locked(phase) && (
          <button
            disabled={sel === null}
            onClick={() => {
              setChosen(sel)
              onSubmit(sel === q.answer)
            }}
            className="btn-game mt-5 w-full text-lg"
          >
            Check
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- read aloud with speech recognition ---------- */
function Speak({ q, onItems, voiceConsent }: Props & { q: Extract<Question, { kind: 'speak' }> }) {
  const [state, setState] = useState<'idle' | 'listening' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ReturnType<typeof compareSpeech> | null>(null)
  const [tries, setTries] = useState(0)
  const [err, setErr] = useState('')
  const rec = useRef<ReturnType<typeof recognizer>>(null)
  const supported = typeof window !== 'undefined' && !!(window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).webkitSpeechRecognition
  const canUseMic = supported && voiceConsent

  const start = () => {
    const r = recognizer()
    if (!r) return
    rec.current = r
    setState('listening')
    setErr('')
    r.onresult = (e) => {
      const alts = Array.from(e.results[0] as ArrayLike<{ transcript: string }>).map((a) => a.transcript)
      const best = alts.map((t) => compareSpeech(q.text, t)).sort((a, b) => b.score - a.score)[0]
      setResult(best)
      setTries((t) => t + 1)
      setState('done')
    }
    r.onerror = (e) => {
      setErr(e.error === 'not-allowed' ? 'Microphone access was blocked. You can still practise by reading aloud.' : 'I could not hear that. Try again a little louder.')
      setState('error')
    }
    r.onend = () => setState((s) => (s === 'listening' ? 'idle' : s))
    r.start()
  }

  const good = (result?.score ?? 0) >= 0.75
  return (
    <div className="text-center">
      <Title say={q.text}>Read this sentence aloud</Title>
      <div className="mx-auto mt-6 max-w-xl rounded-3xl bg-white p-6 shadow-[0_3px_0_#dbe5f3]">
        <p className="font-display text-2xl leading-snug font-semibold md:text-3xl">
          {result
            ? q.text.split(' ').map((w, i) => {
                const ok = result.words[i]?.ok
                return (
                  <span key={i} className={ok ? 'text-leaf-dark' : 'text-coral underline decoration-wavy'}>
                    {w}{' '}
                  </span>
                )
              })
            : q.text}
        </p>
      </div>

      {canUseMic ? (
        <>
          <button onClick={state === 'listening' ? () => rec.current?.stop() : start} className={`mx-auto mt-8 grid size-24 place-items-center rounded-full text-white shadow-[0_6px_0_rgba(0,0,0,.15)] transition ${state === 'listening' ? 'animate-pulse bg-coral' : 'bg-speak'}`} aria-label={state === 'listening' ? 'Stop' : 'Start speaking'}>
            {state === 'listening' ? <Square className="size-9 fill-current" /> : <Mic className="size-11" />}
          </button>
          <p className="mt-3 text-sm font-semibold text-ink-soft">{state === 'listening' ? 'Listening... read the sentence now' : 'Tap the microphone and read the sentence'}</p>
          {err && <p className="mt-2 text-sm font-semibold text-coral">{err}</p>}
          {result && (
            <div className="pop mx-auto mt-5 max-w-md rounded-2xl bg-white p-4 text-left">
              <div className="font-display text-lg font-semibold">{good ? 'Clear and confident!' : 'Good try! Some words were hard to hear.'}</div>
              <p className="text-sm text-ink-soft">
                {Math.round(result.score * 100)}% of the words came through clearly. {good ? '' : 'Tap the speaker to listen, then try once more, slowly.'} Different accents are welcome: Ollie listens for the words, not the accent.
              </p>
              <div className="mt-3 flex gap-2">
                {!good && tries < 3 && (
                  <button onClick={start} className="btn-game flex-1 py-2" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-ink)' }}>
                    <RotateCcw className="size-4" /> Try again
                  </button>
                )}
                <button onClick={() => onItems([{ correct: good, tries: Math.max(0, tries - 1), hint: false, difficulty: 1, tag: good ? undefined : 'clarity and fluency' }])} className="btn-game flex-1 py-2">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#fff8e1] p-4 text-left text-sm">
          <div className="flex items-center gap-2 font-bold">
            <MicOff className="size-4" /> {voiceConsent ? 'This browser cannot listen to speech.' : 'Voice features are switched off by your parent.'}
          </div>
          <p className="mt-1 text-ink-soft">Listen to the sentence, then read it aloud yourself. This counts as practice, so your rewards still count.</p>
          <button onClick={() => onItems([{ correct: true, tries: 0, hint: true, difficulty: 1 }], true)} className="btn-game mt-3 w-full py-2">
            I read it aloud
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- writing with checklist feedback ---------- */
function Write({ q, onItems, difficulty }: Props & { q: Extract<Question, { kind: 'write' }> }) {
  const [text, setText] = useState('')
  const [review, setReview] = useState<ReturnType<typeof reviewWriting> | null>(null)
  const [round, setRound] = useState(0)
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const get = () => {
    setReview(reviewWriting(text, q.genre, q.minWords))
    setRound((r) => r + 1)
  }
  const finish = () => {
    const r = review ?? reviewWriting(text, q.genre, q.minWords)
    onItems(r.checks.map((c) => ({ correct: c.ok, tries: round > 1 ? 1 : 0, hint: false, difficulty, tag: c.ok ? undefined : c.label.toLowerCase() })))
  }
  return (
    <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
      <div>
        <div className="rounded-3xl bg-gradient-to-br from-[#fff1f5] to-white p-4 shadow-[0_3px_0_#f3d3de]">
          <div className="text-xs font-bold tracking-wide text-write uppercase">{q.genre} writing</div>
          <p className="mt-1 font-display text-lg leading-snug font-semibold">{q.prompt}</p>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={11} placeholder="Start writing here..." className="mt-3 w-full resize-y rounded-3xl border-[3px] border-line bg-white p-4 text-[16px] leading-relaxed outline-none focus:border-brand" />
        <div className="mt-1 flex justify-between text-xs font-bold text-ink-soft">
          <span>
            {words} / {q.minWords} words
          </span>
          {round > 0 && <span>Feedback round {round}</span>}
        </div>
        <div className="mt-3 flex gap-3">
          <button onClick={get} disabled={words < 5} className="btn-game flex-1" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-brand)' }}>
            Get feedback
          </button>
          <button onClick={finish} disabled={!review} className="btn-game flex-1" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
            Hand in
          </button>
        </div>
      </div>
      <div>
        {review ? (
          <div className="pop rounded-3xl bg-white p-4 shadow-[0_3px_0_#dbe5f3]">
            <div className="flex items-center gap-2">
              <img src="images/sheet/mascots/owl.png" alt="" className="w-12" />
              <div>
                <div className="font-display text-lg font-semibold">Ollie's feedback</div>
                <div className="text-sm text-ink-soft">
                  {review.passed} of {review.total} goals met. {review.passed === review.total ? 'Excellent work!' : 'Improve one or two, then hand in.'}
                </div>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {review.checks.map((c) => (
                <li key={c.id} className={`rounded-2xl px-3 py-2 text-sm ${c.ok ? 'bg-[#e6f8ee]' : 'bg-[#fff4e0]'}`}>
                  <div className="font-bold">
                    {c.ok ? '✓' : '•'} {c.label}
                  </div>
                  {!c.ok && <div className="text-ink-soft">{c.tip}</div>}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-line p-5 text-sm text-ink-soft">
            <div className="font-display text-lg font-semibold text-ink">Writing goals</div>
            <p className="mt-1">When you are ready, tap Get feedback. Ollie checks your length, sentences, capital letters, punctuation, linking words and word choice, plus goals for this kind of writing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
