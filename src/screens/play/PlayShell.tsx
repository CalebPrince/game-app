import { NavLink, Navigate, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { BarChart3, CalendarCheck, House, LogOut, Moon, UserRound } from 'lucide-react'
import { minutesToday, useChild, useStore } from '../../lib/store'
import { Avatar, Bar, CoinChip, MusicToggle, icon } from '../../components/ui'
import { learnerLabel } from '../../lib/skills'
import { level } from '../../lib/engine'
import type { Child } from '../../lib/types'

export const useActiveChild = () => useOutletContext<{ child: Child }>().child

export function PlayShell() {
  const nav = useNavigate()
  const id = useStore((s) => s.activeChildId)
  const child = useChild(id)
  const attempts = useStore((s) => s.attempts)
  if (!child) return <Navigate to="/who" replace />
  const lv = level(child.xp)
  const little = child.track === 'little'
  const used = minutesToday(attempts, child.id)
  const overLimit = used >= child.settings.dailyLimitMin

  const tabs = [
    { to: '/play', end: true, label: 'Home', img: 'home', I: House },
    { to: '/play/missions', label: 'Missions', img: 'calendar', I: CalendarCheck },
    { to: '/play/progress', label: 'Progress', img: 'progress', I: BarChart3 },
    { to: '/play/me', label: little ? 'Me' : 'Profile', img: 'profile', I: UserRound },
  ]

  return (
    <div className="min-h-dvh bg-sky">
      <header className="sticky top-0 z-30 bg-gradient-to-b from-brand to-[#3b82ff] text-white shadow-[0_6px_20px_-12px_rgba(18,73,196,.8)]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Avatar avatar={child.avatar} size={little ? 56 : 50} ring="rgba(255,255,255,.85)" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl leading-tight font-semibold">Hi {child.name}!</div>
            <div className="truncate text-xs font-semibold text-white/80">{learnerLabel(child)}</div>
            <div className="mt-1 flex max-w-56 items-center gap-2">
              <span className="font-display text-xs font-semibold whitespace-nowrap">Lv {lv.level}</span>
              <Bar value={lv.into / lv.per} color="var(--color-sun)" height={7} track="rgba(255,255,255,.25)" />
              <span className="text-[10px] font-bold whitespace-nowrap text-white/80">
                {lv.into}/{lv.per} XP
              </span>
            </div>
          </div>
          <CoinChip coins={child.coins} />
          <MusicToggle dark />
          <button onClick={() => nav('/who')} className="grid size-10 place-items-center rounded-full bg-white/15" aria-label="Switch learner">
            <LogOut className="size-5" />
          </button>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 md:flex">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${isActive ? 'bg-white text-brand' : 'text-white/85 hover:bg-white/10'}`}>
              <t.I className="size-[18px]" strokeWidth={2.5} /> {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-32 md:pb-16">
        <Outlet context={{ child }} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive ? 'text-brand' : 'text-ink-faint'}`}>
              {({ isActive }) => (
                <>
                  <img src={icon(t.img)} alt="" className={`size-8 transition ${isActive ? 'scale-110' : 'opacity-70 grayscale-[.4]'}`} />
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {overLimit && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-navy/70 p-6 backdrop-blur-sm">
          <div className="pop max-w-sm rounded-3xl bg-white p-6 text-center">
            <Moon className="mx-auto size-12 text-brand" />
            <h2 className="mt-2 font-display text-2xl font-bold">Time for a break!</h2>
            <p className="mt-2 text-ink-soft">
              You learned for {used} minutes today. Great work, {child.name}! Your adventure will be waiting tomorrow.
            </p>
            <p className="mt-2 text-xs text-ink-faint">Daily limit set by your parent: {child.settings.dailyLimitMin} minutes.</p>
            <button onClick={() => nav('/who')} className="btn-game mt-5 w-full">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
