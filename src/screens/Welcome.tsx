import { useNavigate } from 'react-router-dom'
import { ChevronRight, GraduationCap, RotateCcw, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { Art } from '../components/ui'
import { kidArt } from '../lib/rewards'

export function Welcome() {
  const nav = useNavigate()
  const reset = useStore((s) => s.reset)
  return (
    <div className="min-h-dvh bg-[radial-gradient(120%_80%_at_20%_0%,#cfe5ff_0%,#eaf4ff_55%,#f6fbff_100%)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-4 pb-28 md:grid-cols-[1.35fr_1fr] md:items-center md:gap-10 md:px-8 md:pt-12">
        <div className="relative">
          <Art src="images/welcome-hero.webp" alt="Two children and a husky waving in front of a fairytale castle, with the English Adventure logo" className="aspect-[702/293] w-full rounded-[28px] object-cover shadow-[0_18px_40px_-20px_rgba(18,38,79,.55)] ring-4 ring-white" />
          <img src="images/sheet/mascots/star.png" alt="" className="bob absolute -top-5 -right-3 w-16 md:w-20" />
        </div>

        <div className="rise">
          <h1 className="font-display text-[2.6rem] leading-[1.02] font-bold text-ink md:text-6xl">
            Learn. Play.
            <br />
            <span className="text-brand">Grow.</span>
          </h1>
          <p className="mt-3 max-w-md text-lg text-ink-soft">English that feels like an adventure, from first letters at age 4 to essays in Grade 9. It adapts to every child, one word at a time.</p>

          <div className="mt-6 flex flex-col gap-3 sm:max-w-sm">
            <button onClick={() => nav('/who')} className="btn-game text-xl" style={{ ['--face' as string]: 'var(--color-sun)', ['--ledge' as string]: 'var(--color-sun-dark)', ['--ink' as string]: 'var(--color-ink)' }}>
              Start Learning <ChevronRight className="size-6" />
            </button>
            <button onClick={() => nav('/parent')} className="btn-game" style={{ ['--face' as string]: 'white', ['--ledge' as string]: '#c9d7ee', ['--ink' as string]: 'var(--color-brand)' }}>
              <Users className="size-5" /> Parent portal
            </button>
            <button onClick={() => nav('/teacher')} className="mx-auto inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-brand sm:mx-0">
              <GraduationCap className="size-4" /> I'm a teacher
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:col-span-2 md:mt-4">
          {[
            { t: 'Little Explorers', s: 'Ages 4 to 6', d: 'Letters, sounds, tracing and first words with spoken instructions. No reading needed to start.', k: ['boy-blue', 'girl-pink'], c: '#ffe9c2' },
            { t: 'Junior Explorers', s: 'Grades 6 to 9', d: 'Reading, grammar, vocabulary, speaking and writing. Ghana NaCCA or Cambridge-aligned.', k: ['girl-puffs', 'boy-glasses'], c: '#dcebff' },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4 overflow-hidden rounded-3xl bg-white p-4 pr-2 shadow-[0_2px_0_#dbe5f3]">
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl font-semibold">{x.t}</div>
                <div className="text-sm font-bold text-brand">{x.s}</div>
                <p className="mt-1 text-sm text-ink-soft">{x.d}</p>
              </div>
              <div className="flex shrink-0 items-end rounded-2xl px-1 pt-2" style={{ background: x.c }}>
                {x.k.map((k) => (
                  <img key={k} src={kidArt(k)} alt="" className="-mx-1 h-24 w-auto" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => reset()} className="inline-flex items-center gap-1.5 justify-self-start text-xs font-bold text-ink-faint hover:text-brand md:col-span-2">
          <RotateCcw className="size-3.5" /> Reset demo data
        </button>
      </div>
    </div>
  )
}
