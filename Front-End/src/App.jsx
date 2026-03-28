import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import AddTransaction from './pages/AddTransaction'
import History from './pages/History'
import Setup from './pages/Setup'
import { checkHasIncome } from './api/client'

export default function App() {
  const [hasIncome, setHasIncome] = useState(null) // null = loading
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

  useEffect(() => { refreshIncomeStatus() }, [])

  // Loading state
  if (hasIncome === null) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: 'var(--off-white)'
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--accent)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: 'white',
          fontFamily: 'var(--font-display)',
          animation: 'pulse 1.5s ease infinite'
        }}>₹</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading FinTrack...</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {hasIncome && <Navbar />}

      <Routes>
        {/* Setup page - shown only when no income */}
        <Route
          path="/setup"
          element={
            hasIncome
              ? <Navigate to="/" replace />
              : <Setup onIncomeAdded={() => { setHasIncome(true); }} showToast={showToast} />
          }
        />

        {/* Protected routes - redirect to setup if no income */}
        <Route
          path="/"
          element={
            !hasIncome
              ? <Navigate to="/setup" replace />
              : <Dashboard showToast={showToast} />
          }
        />
        <Route
          path="/add"
          element={
            !hasIncome
              ? <Navigate to="/setup" replace />
              : <AddTransaction showToast={showToast} />
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to={hasIncome ? '/' : '/setup'} replace />} />
      </Routes>

      {/* Global Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '!'}</span>
          {toast.message}
        </div>
      )}
    </BrowserRouter>
  )
}
