import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { KIDS } from '../../lib/rewards'
import { Card } from '../../components/ui'
import type { Child, Curriculum, Track } from '../../lib/types'

export function AddLearner() {
  const add = useStore((s) => s.addChild)
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [track, setTrack] = useState<Track>('junior')
  const [grade, setGrade] = useState<6 | 7 | 8 | 9>(6)
  const [age, setAge] = useState(5)
  const [curriculum, setCurriculum] = useState<Curriculum>('nacca')
  const [base, setBase] = useState<string>(KIDS[0])
  const [voice, setVoice] = useState(false)
  const [limit, setLimit] = useState(30)

  const create = () => {
    const c: Child = {
      id: `c${Date.now()}`, name: name.trim(), track, grade: track === 'junior' ? grade : undefined, age: track === 'little' ? age : undefined, curriculum,
      avatar: { base }, xp: 0, coins: 20, stars: 0, badges: [], owned: [], mastery: {},
      settings: { dailyLimitMin: limit, voiceConsent: voice, aiCompanion: true }, createdAt: new Date().toISOString(), missionsClaimed: [],
    }
    add(c)
    nav('/parent')
  }

  const choice = (active: boolean) => `rounded-2xl border-2 p-3 text-left transition ${active ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/40'}`

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Add a learner</h1>
      <p className="text-ink-soft">Set up a profile for your child. You can change everything later in Settings.</p>
      <Card className="mt-5 space-y-5">
        <label className="block text-sm font-bold">
          Child's first name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-base font-semibold" placeholder="e.g. Esi" />
          <span className="mt-1 block text-xs font-normal text-ink-soft">A first name or nickname is enough. We never ask for a child's surname or contact details.</span>
        </label>

        <div>
          <div className="text-sm font-bold">Learning experience</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button onClick={() => setTrack('little')} className={choice(track === 'little')}>
              <div className="font-display text-lg font-semibold">Little Explorers</div>
              <div className="text-sm text-ink-soft">Ages 4 to 6. Letters, sounds and first words, with audio guidance.</div>
            </button>
            <button onClick={() => setTrack('junior')} className={choice(track === 'junior')}>
              <div className="font-display text-lg font-semibold">Junior Explorers</div>
              <div className="text-sm text-ink-soft">Grades 6 to 9. Reading, grammar, writing, speaking and more.</div>
            </button>
          </div>
        </div>

        {track === 'junior' ? (
          <div>
            <div className="text-sm font-bold">Grade</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {([6, 7, 8, 9] as const).map((g) => (
                <button key={g} onClick={() => setGrade(g)} className={`${choice(grade === g)} text-center font-display text-lg font-semibold`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-bold">Age</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[4, 5, 6].map((g) => (
                <button key={g} onClick={() => setAge(g)} className={`${choice(age === g)} text-center font-display text-lg font-semibold`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-bold">Curriculum</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button onClick={() => setCurriculum('nacca')} className={choice(curriculum === 'nacca')}>
              <div className="font-semibold">Ghana NaCCA</div>
              <div className="text-xs text-ink-soft">Aligned to the Ghana basic school English curriculum</div>
            </button>
            <button onClick={() => setCurriculum('intl')} className={choice(curriculum === 'intl')}>
              <div className="font-semibold">International</div>
              <div className="text-xs text-ink-soft">Cambridge-aligned progression</div>
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm font-bold">Choose a character</div>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {KIDS.map((k) => (
              <button key={k} onClick={() => setBase(k)} className={`overflow-hidden rounded-2xl border-2 bg-[#fff6dc] ${base === k ? 'border-brand' : 'border-transparent'}`}>
                <img src={`images/sheet/heads/${k}.png`} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Daily time limit: {limit} min
            <input type="range" min={10} max={90} step={5} value={limit} onChange={(e) => setLimit(+e.target.value)} className="mt-2 w-full accent-[#1f6bff]" />
          </label>
          <label className="flex items-start gap-2 rounded-2xl bg-sky p-3 text-sm">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="mt-1 size-4 accent-[#1fae6a]" />
            <span>
              <span className="font-bold">I consent to voice features</span> for speaking practice. You can change this any time.
            </span>
          </label>
        </div>

        <button disabled={!name.trim()} onClick={create} className="btn-game w-full text-lg" style={{ ['--face' as string]: 'var(--color-leaf)', ['--ledge' as string]: 'var(--color-leaf-dark)' }}>
          Create profile
        </button>
      </Card>
    </div>
  )
}
