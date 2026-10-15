import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, BarChart3, BookOpenCheck, ChevronDown, FileText, Home, Plus, Settings, ShieldCheck } from 'lucide-react'
import { useStore } from '../../lib/store'
import { Avatar } from '../../components/ui'
import { learnerLabel } from '../../lib/skills'
import type { Child } from '../../lib/types'

export const useParentChild = () => useOutletContext<{ child: Child | undefined }>().child

const NAV = [
  { to: '/parent', end: true, label: 'Overview', I: Home },
  { to: '/parent/history', label: 'Activity History', I: BookOpenCheck },
  { to: '/parent/skills', label: 'Skills', I: BarChart3 },
  { to: '/parent/reports', label: 'Reports', I: FileText },
  { to: '/parent/settings', label: 'Settings & Privacy', I: Settings },
]

function ChildSwitcher({ dark }: { dark?: boolean }) {
  const children = useStore((s) => s.children)
  const id = useStore((s) => s.parentChildId)
  const set = useStore((s) => s.setParentChild)
  const nav = useNavigate()
  const child = children.find((c) => c.id === id)
  return (
    <label className={`relative flex items-center gap-3 rounded-2xl p-2 pr-3 ${dark ? 'bg-white/10 text-white' : 'bg-white shadow-[0_2px_0_#dbe5f3]'}`}>
      {child && <Avatar avatar={child.avatar} size={40} showItem={false} />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-semibold">{child?.name ?? 'No learner'}</div>
        <div className={`truncate text-xs ${dark ? 'text-white/70' : 'text-ink-soft'}`}>{child ? learnerLabel(child) : 'Add a learner'}</div>
      </div>
      <ChevronDown className="size-4 opacity-70" />
      <select
        aria-label="Switch child"
        value={id}
        onChange={(e) => (e.target.value === '__add' ? nav('/parent/add') : set(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {children.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value="__add">+ Add a learner</option>
      </select>
    </label>
  )
}

export function ParentShell() {
  const nav = useNavigate()
  const children = useStore((s) => s.children)
  const id = useStore((s) => s.parentChildId)
  const child = children.find((c) => c.id === id) ?? children[0]

  return (
    <div className="min-h-dvh bg-[#f2f7fe] md:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-navy p-4 text-white md:flex">
        <button onClick={() => nav('/')} className="flex items-center gap-2.5 px-2 py-1 text-left">
          <img src="images/sheet/icons/learning.png" alt="" className="size-10" />
          <div>
            <div className="font-display text-lg leading-none font-bold">
              <span className="text-sun">English</span> Adventure
            </div>
            <div className="text-xs text-white/60">Parent Portal</div>
          </div>
        </button>
        <nav className="mt-6 grid gap-1">
          {NAV.map(({ to, end, label, I }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive ? 'bg-leaf text-white shadow-[0_3px_0_#15834f]' : 'text-white/75 hover:bg-white/10'}`}>
              <I className="size-[18px]" /> {label}
            </NavLink>
          ))}
          <NavLink to="/parent/add" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${isActive ? 'bg-leaf text-white' : 'text-white/75 hover:bg-white/10'}`}>
            <Plus className="size-[18px]" /> Add a learner
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button onClick={() => nav('/')} className="mb-3 flex items-center gap-2 px-1 text-xs font-bold text-white/60 hover:text-white">
            <ArrowLeft className="size-3.5" /> Back to start
          </button>
          <div className="mb-2 flex items-center gap-1.5 px-1 text-xs text-white/60">
            <ShieldCheck className="size-3.5" /> No ads. No chat between children.
          </div>
          <div className="mb-1 px-1 text-xs font-bold tracking-wide text-white/50 uppercase">Switch child</div>
          <ChildSwitcher dark />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="no-print sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <button onClick={() => nav('/')} className="grid size-9 place-items-center rounded-full bg-sky" aria-label="Back to start">
              <ArrowLeft className="size-4" />
            </button>
            <div className="font-display text-lg font-bold">Parent Portal</div>
            <div className="ml-auto w-48">
              <ChildSwitcher />
            </div>
          </div>
          <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${isActive ? 'bg-leaf text-white' : 'bg-sky text-ink-soft'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-5 pb-28 md:px-8 md:py-8">
          <Outlet context={{ child }} />
        </main>
      </div>
    </div>
  )
}
