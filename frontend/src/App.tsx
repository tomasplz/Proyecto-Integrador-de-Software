import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { ToastProvider } from './components/toast-provider'
import { SedeProvider } from './lib/sede-context'
import { Sidebar } from './components/sidebar'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Teachers from './pages/Teachers'
import Schedule from './pages/Schedule'
import Classrooms from './pages/Classrooms'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="schedule-mgmt-theme">
      <ToastProvider>
        <SedeProvider>
          <Router>
            <div className="flex h-screen w-screen overflow-hidden bg-background">
              <Sidebar />
              <main className="flex-1 overflow-auto w-full min-w-0">
                <div className="h-full w-full">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/teachers" element={<Teachers />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/classrooms" element={<Classrooms />} />
                  </Routes>
                </div>
              </main>
            </div>
          </Router>
        </SedeProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
