import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { useActiveChild } from './PlayShell'
import { useStore } from '../../lib/store'
import { KIDS, SHOP, badgeDef, itemArt, kidArt } from '../../lib/rewards'
import { learnerLabel } from '../../lib/skills'
import { Card, icon } from '../../components/ui'

const ALL_BADGES = ['first-steps', 'perfect', 'streak-3', 'brave-try', 'level-5']

export function Me() {
  const child = useActiveChild()
  const update = useStore((s) => s.updateChild)
  const buy = useStore((s) => s.buy)
  const equip = useStore((s) => s.equip)
  const [msg, setMsg] = useState('')
  const skillBadges = child.badges.filter((b) => b.startsWith('skill-'))
  const badges = [...ALL_BADGES, ...skillBadges]

  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-[300px_1fr]">
      <Card className="flex flex-col items-center bg-gradient-to-b from-[#fff6dc] to-white text-center md:sticky md:top-36 md:self-start">
        <div className="flex items-end gap-2">
          <img src={kidArt(child.avatar.base)} alt="" className="h-56 w-auto" />
          {child.avatar.item && (
            <div className="pop mb-3 grid size-20 shrink-0 place-items-center rounded-full bg-white shadow-[0_3px_0_#f0dfae]" title="Equipped item">
              <img src={itemArt(child.avatar.item)} alt="" className="w-14" />
            </div>
          )}
        </div>
        <div className="mt-2 font-display text-3xl font-bold">{child.name}</div>
        <div className="text-sm font-semibold text-ink-soft">{learnerLabel(child)}</div>
        <div className="mt-4 w-full">
          <div className="mb-2 text-left text-xs font-bold tracking-wide text-ink-faint uppercase">Choose your explorer</div>
          <div className="grid grid-cols-6 gap-1.5">
            {KIDS.map((k) => (
              <button key={k} onClick={() => update(child.id, { avatar: { ...child.avatar, base: k } })} className={`overflow-hidden rounded-xl border-2 bg-white ${child.avatar.base === k ? 'border-brand' : 'border-line'}`} aria-label={`Choose ${k}`}>
                <img src={`images/sheet/heads/${k}.png`} alt="" className="aspect-square w-full bg-[#ffe7a6] object-cover" />
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">My Badges</h2>
          <span className="text-sm font-bold text-ink-soft">{child.badges.length} earned</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {badges.map((b) => {
            const d = badgeDef(b)
            const has = child.badges.includes(b)
            return (
              <div key={b} className="flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-[0_3px_0_#dbe5f3]" title={d.desc}>
                <div className="relative">
                  <img src={d.art} alt="" className={`size-14 ${has ? '' : 'opacity-25 grayscale'}`} />
                  {!has && <Lock className="absolute inset-0 m-auto size-5 text-ink-soft" />}
                </div>
                <div className="mt-1 text-xs leading-tight font-bold">{d.name}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Explorer Shop</h2>
          <span className="flex items-center gap-1 font-display font-semibold">
            <img src={icon('coin')} alt="" className="size-6" /> {child.coins}
          </span>
        </div>
        <p className="text-sm text-ink-soft">Spend the coins you earn from learning.</p>
        {msg && <div className="pop mt-2 rounded-xl bg-sun/25 px-3 py-2 text-sm font-bold">{msg}</div>}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button onClick={() => equip(child.id, undefined)} className={`flex flex-col items-center justify-center rounded-2xl border-2 bg-white p-3 text-sm font-bold ${!child.avatar.item ? 'border-brand' : 'border-transparent'}`}>
            <span className="grid size-16 place-items-center text-ink-faint">None</span>
            No item
          </button>
          {SHOP.map((it) => {
            const owned = child.owned.includes(it.id)
            const worn = child.avatar.item === it.id
            return (
              <button
                key={it.id}
                onClick={() => {
                  if (owned) return equip(child.id, it.id)
                  if (child.coins < it.price) return setMsg(`You need ${it.price - child.coins} more coins for the ${it.name}. Keep learning!`)
                  if (buy(child.id, it.id, it.price)) setMsg(`You got the ${it.name}!`)
                }}
                className={`relative flex flex-col items-center rounded-2xl border-2 bg-white p-3 text-center shadow-[0_3px_0_#dbe5f3] ${worn ? 'border-brand' : 'border-transparent'}`}
              >
                <img src={itemArt(it.id)} alt="" className="size-16 object-contain" />
                <div className="mt-1 text-sm leading-tight font-bold">{it.name}</div>
                <div className="mt-1 text-xs font-bold">
                  {owned ? (
                    <span className="inline-flex items-center gap-1 text-leaf">
                      <Check className="size-3.5" /> {worn ? 'Wearing' : 'Owned'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <img src={icon('coin')} alt="" className="size-4" /> {it.price}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
