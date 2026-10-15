import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Lock, Mic, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useParentChild } from './ParentShell'
import { NoChild } from './Overview'
import { useStore } from '../../lib/store'
import { Card } from '../../components/ui'
import type { Child, Curriculum } from '../../lib/types'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-leaf' : 'bg-[#cfd9e8]'}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${on ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export function ParentSettings() {
  const child = useParentChild()
  const update = useStore((s) => s.updateChild)
  const clear = useStore((s) => s.clearHistory)
  const del = useStore((s) => s.deleteChild)
  const nav = useNavigate()
  const [confirm, setConfirm] = useState<'clear' | 'delete' | null>(null)
  const [typed, setTyped] = useState('')
  if (!child) return <NoChild />
  const set = (patch: Partial<Child>) => update(child.id, patch)
  const setS = (patch: Partial<Child['settings']>) => update(child.id, { settings: { ...child.settings, ...patch } })

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Settings & Privacy</h1>
      <p className="text-ink-soft">Controls for {child.name}'s profile. Only parents and guardians can change these.</p>

      <Card className="mt-5">
        <h2 className="font-display text-xl font-semibold">Learner profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Name
            <input value={child.name} onChange={(e) => set({ name: e.target.value })} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold" />
          </label>
          {child.track === 'junior' ? (
            <label className="text-sm font-bold">
              Grade
              <select value={child.grade} onChange={(e) => set({ grade: +e.target.value as 6 | 7 | 8 | 9 })} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold">
                {[6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    Grade {g} (Basic {g})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-sm font-bold">
              Age
              <select value={child.age} onChange={(e) => set({ age: +e.target.value })} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold">
                {[4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    {g} years
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm font-bold sm:col-span-2">
            Curriculum
            <select value={child.curriculum} onChange={(e) => set({ curriculum: e.target.value as Curriculum })} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-semibold">
              <option value="nacca">Ghana NaCCA curriculum</option>
              <option value="intl">International (Cambridge-aligned)</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-soft">The curriculum sets the lesson sequence, learning outcomes and assessment objectives.</span>
          </label>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl font-semibold">Healthy learning</h2>
        <div className="mt-4 flex items-start gap-3">
          <Clock className="mt-0.5 size-5 text-brand" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold">Daily time limit</span>
              <span className="font-display text-lg font-semibold">{child.settings.dailyLimitMin} min</span>
            </div>
            <input type="range" min={10} max={90} step={5} value={child.settings.dailyLimitMin} onChange={(e) => setS({ dailyLimitMin: +e.target.value })} className="mt-2 w-full accent-[#1f6bff]" />
            <p className="text-xs text-ink-soft">When the limit is reached, the app shows a friendly "time for a break" screen.</p>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl font-semibold">Consent & AI</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Mic className="mt-0.5 size-5 text-speak" />
            <div className="flex-1">
              <div className="font-bold">Voice features (Speaking Studio)</div>
              <p className="text-sm text-ink-soft">Allows the microphone for read-aloud practice. Speech is processed to check pronunciation and is not stored as a recording in this demo.</p>
            </div>
            <Toggle on={child.settings.voiceConsent} onChange={(v) => setS({ voiceConsent: v })} label="Voice consent" />
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-vocab" />
            <div className="flex-1">
              <div className="font-bold">Learning companion (Ollie)</div>
              <p className="text-sm text-ink-soft">Ollie gives hints that guide thinking without giving away answers. Restricted to learning topics only.</p>
            </div>
            <Toggle on={child.settings.aiCompanion} onChange={(v) => setS({ aiCompanion: v })} label="Learning companion" />
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-sky p-3 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-leaf" />
            <p>No advertising. No public messaging between children. Children cannot create accounts or change these settings.</p>
          </div>
        </div>
      </Card>

      <Card className="mt-4 border-2 border-coral/30">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-coral-dark">
          <Lock className="size-5" /> Data controls
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setConfirm('clear')} className="flex-1 rounded-2xl border-2 border-line px-4 py-3 text-left text-sm hover:border-coral">
            <div className="font-bold">Clear learning records</div>
            <div className="text-ink-soft">Removes activity history, mastery and rewards. Keeps the profile.</div>
          </button>
          <button onClick={() => setConfirm('delete')} className="flex-1 rounded-2xl border-2 border-line px-4 py-3 text-left text-sm hover:border-coral">
            <div className="flex items-center gap-1.5 font-bold text-coral-dark">
              <Trash2 className="size-4" /> Delete {child.name}'s profile
            </div>
            <div className="text-ink-soft">Permanently removes the profile and all learning records.</div>
          </button>
        </div>
      </Card>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
          <div className="pop w-full max-w-sm rounded-3xl bg-white p-6">
            <AlertTriangle className="size-10 text-coral" />
            <h3 className="mt-2 font-display text-xl font-bold">{confirm === 'clear' ? 'Clear all learning records?' : `Delete ${child.name}'s profile?`}</h3>
            <p className="mt-1 text-sm text-ink-soft">This cannot be undone. Type {child.name}'s name to confirm.</p>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-3 w-full rounded-xl border border-line px-3 py-2.5" placeholder={child.name} />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setConfirm(null)
                  setTyped('')
                }}
                className="flex-1 rounded-xl bg-sky py-2.5 font-bold"
              >
                Cancel
              </button>
              <button
                disabled={typed.trim().toLowerCase() !== child.name.toLowerCase()}
                onClick={() => {
                  if (confirm === 'clear') clear(child.id)
                  else {
                    del(child.id)
                    nav('/parent')
                  }
                  setConfirm(null)
                  setTyped('')
                }}
                className="flex-1 rounded-xl bg-coral py-2.5 font-bold text-white disabled:opacity-40"
              >
                {confirm === 'clear' ? 'Clear' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
