// Product analytics (PostHog, US cloud) for the parent feedback test.
// Privacy: no child names or typed text are sent. Session recordings mask every input.
// The project key is a public, write-only ingestion key (safe to ship in the browser).
import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY || POSTHOG_PUBLIC_KEY()
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
// Local development stays out of the reports unless explicitly enabled.
const ENABLED = !!KEY && (!import.meta.env.DEV || import.meta.env.VITE_POSTHOG_DEV === '1')

function POSTHOG_PUBLIC_KEY() {
  return 'phc_CoZRwrLSVYcChweCKUwCVV89GhxTVjJhDrSrFz9VTrCq' // PostHog project "English Adventure" (US cloud)
}

let started = false

export function initAnalytics() {
  if (!ENABLED || started) return
  started = true
  posthog.init(KEY, {
    api_host: HOST,
    defaults: '2025-05-24',
    person_profiles: 'identified_only', // anonymous visitors; no personal profiles
    capture_pageview: false, // sent manually per screen (hash routes)
    capture_pageleave: true,
    autocapture: true,
    respect_dnt: true,
    session_recording: {
      maskAllInputs: true,
      // Every text node passes through maskTextFn, which blanks out any learner's name.
      maskTextSelector: '*',
      maskTextFn: (text: string) => {
        let out = text
        for (const n of learnerNames()) if (n.length > 1) out = out.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '•••')
        return out
      },
    },
  })
  // Team/test browsers: open the site once with ?internal=1 (or ?internal=0 to undo).
  // They are tagged internal=true and excluded from dashboard numbers by the project's test filter.
  try {
    const flag = new URLSearchParams(location.search).get('internal')
    if (flag === '1') localStorage.setItem('ea-internal', '1')
    if (flag === '0') localStorage.removeItem('ea-internal')
    posthog.register({ internal: localStorage.getItem('ea-internal') === '1' })
  } catch {
    /* storage blocked */
  }
}

const SCREENS: [RegExp, string][] = [
  [/^\/$/, 'Welcome'],
  [/^\/who$/, 'Choose learner'],
  [/^\/play$/, 'Child: Map'],
  [/^\/play\/missions$/, 'Child: Missions'],
  [/^\/play\/progress$/, 'Child: Progress'],
  [/^\/play\/me$/, 'Child: Profile & shop'],
  [/^\/play\/world\//, 'Child: World'],
  [/^\/activity\//, 'Child: Activity'],
  [/^\/parent$/, 'Parent: Overview'],
  [/^\/parent\/history$/, 'Parent: Activity history'],
  [/^\/parent\/skills$/, 'Parent: Skills'],
  [/^\/parent\/reports$/, 'Parent: Reports'],
  [/^\/parent\/settings$/, 'Parent: Settings'],
  [/^\/parent\/add$/, 'Parent: Add learner'],
  [/^\/teacher$/, 'Teacher dashboard'],
]

export function screenName(path: string) {
  return SCREENS.find(([re]) => re.test(path))?.[1] ?? path
}

export function areaOf(path: string) {
  return path.startsWith('/parent') ? 'parent' : path.startsWith('/teacher') ? 'teacher' : path === '/' ? 'welcome' : 'child'
}

/** One pageview per screen. The hash route is sent as the path so PostHog reports read naturally. */
export function trackScreen(path: string) {
  if (!started) return
  posthog.capture('$pageview', {
    $current_url: `${location.origin}${location.pathname}#${path}`,
    $pathname: path,
    screen: screenName(path),
    area: areaOf(path),
  })
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (!started) return
  posthog.capture(event, props)
}

/** Attach non-identifying learner context to every following event. */
export function setLearnerContext(ctx: { track: string; grade?: number; age?: number; curriculum: string; sample: boolean } | null) {
  if (!started) return
  if (!ctx) return posthog.unregister('learner_track')
  posthog.register({ learner_track: ctx.track, learner_grade: ctx.grade ?? null, learner_age: ctx.age ?? null, learner_curriculum: ctx.curriculum, learner_is_sample: ctx.sample })
}

function learnerNames(): string[] {
  try {
    const raw = localStorage.getItem('english-adventure-demo-v1')
    const kids = raw ? (JSON.parse(raw).state?.children as { name: string }[] | undefined) : undefined
    return (kids ?? []).map((c) => c.name.trim()).filter(Boolean)
  } catch {
    return []
  }
}
