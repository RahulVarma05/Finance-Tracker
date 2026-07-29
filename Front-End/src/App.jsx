import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import History from './pages/History'
import Stats from './pages/Stats'
import Auth from './pages/Auth'
import { checkHasIncome } from './api/client'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('userId'))
  const [hasIncome, setHasIncome] = useState(null)
  const [toast, setToast]         = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const refreshIncomeStatus = async () => {
    try {
      const data = await checkHasIncome()
      setHasIncome(data.has_income)
    } catch {
      setHasIncome(false)
    }
  }

  useEffect(() => { 
    if (isAuthenticated) refreshIncomeStatus() 
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />
  }

  if (hasIncome === null) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: 'var(--bg-main)'
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--accent)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: 'white',
        }}>₹</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Nova Ledger...</p>
      </div>
    )
  }

  // Define layout wrapper
  const AppLayout = ({ children }) => (
    <div className="app-layout">
      {hasIncome && <Sidebar />}
      <main className="main-content">
        {children}
      </main>
    </div>
  )

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path="/setup"
            element={
              hasIncome
                ? <Navigate to="/" replace />
                : <Setup onIncomeAdded={() => setHasIncome(true)} showToast={showToast} />
            }
          />
          <Route
            path="/"
            element={
              !hasIncome
                ? <Navigate to="/setup" replace />
                : <Dashboard showToast={showToast} />
            }
          />
          {/* We will route Stats mapping here soon */}
          <Route
            path="/stats"
            element={
              !hasIncome
                ? <Navigate to="/setup" replace />
                : <Stats showToast={showToast} /> 
            }
          />
          <Route
            path="/savings"
            element={
              !hasIncome
                ? <Navigate to="/setup" replace />
                : <Dashboard showToast={showToast} /> /* replace with Savings */
            }
          />
          <Route
            path="/history"
            element={
              !hasIncome
                ? <Navigate to="/setup" replace />
                : <History showToast={showToast} />
            }
          />
          <Route path="*" element={<Navigate to={hasIncome ? '/' : '/setup'} replace />} />
        </Routes>
      </AppLayout>

      {toast && (
        <div className="toast">
          {toast.message}
        </div>
      )}
    </BrowserRouter>
  )
}
