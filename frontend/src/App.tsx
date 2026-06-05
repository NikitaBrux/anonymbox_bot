import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { webapp, applyTheme } from './lib/tg'
import { HomeScreen } from './screens/HomeScreen'
import { CreateSessionScreen } from './screens/CreateSessionScreen'
import { AudienceScreen } from './screens/AudienceScreen'
import { SpeakerScreen } from './screens/SpeakerScreen'
import { ShareScreen } from './screens/ShareScreen'

export default function App() {
  useEffect(() => {
    applyTheme()
    webapp?.ready()
    webapp?.expand()
  }, [])

  return (
    <div className="max-w-[430px] mx-auto">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateSessionScreen />} />
        <Route path="/session/:sessionId" element={<AudienceScreen />} />
        <Route path="/session/:sessionId/speaker" element={<SpeakerScreen />} />
        <Route path="/session/:sessionId/share" element={<ShareScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
