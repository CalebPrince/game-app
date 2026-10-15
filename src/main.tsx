import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { music } from './lib/music'
import './lib/sfx'
import { initAnalytics, trackScreen } from './lib/analytics'
import './index.css'
import { Welcome } from './screens/Welcome'
import { ChooseLearner } from './screens/ChooseLearner'
import { PlayShell } from './screens/play/PlayShell'
import { Home } from './screens/play/Home'
import { Missions } from './screens/play/Missions'
import { MyProgress } from './screens/play/MyProgress'
import { Me } from './screens/play/Me'
import { WorldView } from './screens/play/WorldView'
import { KeyedRunner } from './screens/activities/ActivityRunner'
import { ParentShell } from './screens/parent/ParentShell'
import { ParentOverview } from './screens/parent/Overview'
import { ParentHistory } from './screens/parent/History'
import { ParentSkills } from './screens/parent/Skills'
import { ParentReports } from './screens/parent/Reports'
import { ParentSettings } from './screens/parent/Settings'
import { AddLearner } from './screens/parent/AddLearner'
import { Teacher } from './screens/teacher/Teacher'

function MusicRoutes() {
  const { pathname } = useLocation()
  useEffect(() => music.setAllowed(!pathname.startsWith('/parent') && !pathname.startsWith('/teacher')), [pathname])
  useEffect(() => trackScreen(pathname), [pathname])
  return null
}

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MusicRoutes />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/who" element={<ChooseLearner />} />
        <Route path="/play" element={<PlayShell />}>
          <Route index element={<Home />} />
          <Route path="missions" element={<Missions />} />
          <Route path="progress" element={<MyProgress />} />
          <Route path="me" element={<Me />} />
          <Route path="world/:worldId" element={<WorldView />} />
        </Route>
        <Route path="/activity/:activityId" element={<KeyedRunner />} />
        <Route path="/parent" element={<ParentShell />}>
          <Route index element={<ParentOverview />} />
          <Route path="history" element={<ParentHistory />} />
          <Route path="skills" element={<ParentSkills />} />
          <Route path="reports" element={<ParentReports />} />
          <Route path="settings" element={<ParentSettings />} />
          <Route path="add" element={<AddLearner />} />
        </Route>
        <Route path="/teacher" element={<Teacher />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
