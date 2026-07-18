import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import BetaNotice from './components/BetaNotice'
import ClearDataStatus from './components/ClearDataStatus'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Hub from './hub/Hub'
import TopicExplorer from './topics/TopicExplorer'
import MonthlyCheckin from './checkin/MonthlyCheckin'
import Roadmap from './pages/Roadmap'
import Checkup from './pages/Checkup'
import Learning from './pages/Learning'
import Plan from './pages/Plan'
import Plans from './pages/Plans'

/* Scroll to top on route change, or to a hash target if one is present. */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        window.scrollTo({ top: 0 })
      })
      return
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return null
}

function HomeBetaNotice() {
  const { pathname } = useLocation()
  return pathname === '/' || pathname === '/hub' ? <BetaNotice /> : null
}

export default function App() {
  return (
    <div className="app">
      <ScrollManager />
      <NavBar />
      <ClearDataStatus />
      <HomeBetaNotice />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/explore/:topicId" element={<TopicExplorer />} />
        <Route path="/checkin" element={<MonthlyCheckin />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/checkup" element={<Checkup />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/plan/:moduleId" element={<Plan />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}
