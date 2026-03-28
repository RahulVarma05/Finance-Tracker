import { useState, useRef } from 'react'
import { predictTransaction, addTransaction } from '../api/client'
import styles from './AddTransaction.module.css'

const CATEGORIES = ['Food','Transport','Housing','Entertainment','Shopping','Utilities','Health','Education','Income','Others']

const CATEGORY_ICONS = {
  Food:'🍽', Transport:'🚗', Housing:'🏠', Entertainment:'🎬',
  Shopping:'🛍', Utilities:'💡', Health:'💊', Education:'📚',
  Income:'💰', Others:'📦',
}

export default function AddTransaction({ showToast }) {
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState('')
  const [saved, setSaved]         = useState(false)

  // Voice
  const [recording, setRecording] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const mediaRef                  = useRef(null)
  const chunksRef                 = useRef([])

  const reset = () => {
    setText(''); setAmount(''); setCategory('')
    setPrediction(null); setSaved(false)
  }

  // ── Text predict ──────────────────────────────────────────────────────────
  const handlePredict = async () => {
    if (!text.trim()) return
    setLoading(true)
    setPrediction(null)
    try {
      const result = await predictTransaction(text)
      setPrediction(result)
      setAmount(result.amount ?? '')
      setCategory(result.category)
    } catch {
      showToast('Backend not reachable. Is api.py running?', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Save confirmed transaction ────────────────────────────────────────────
  const handleSave = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { showToast('Enter a valid amount', 'error'); return }
    setLoading(true)
    try {
      await addTransaction({
        text: prediction.text,
        category,
        amount: amt,
        confidence: prediction.confidence,
      })
      setSaved(true)
      showToast(`Saved — ${category} ₹${amt.toLocaleString('en-IN')}`, 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current  = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = handleVoiceStop
      mr.start()
      setRecording(true)
    } catch {
      showToast('Microphone access denied', 'error')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach(t => t.stop())
    setRecording(false)
  }

  const handleVoiceStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('file', blob, 'recording.webm')
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/voice', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      setText(result.text)
      setPrediction(result)
      setAmount(result.amount ?? '')
      setCategory(result.category)
    } catch {
      showToast('Voice processing failed. Make sure Whisper is installed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (conf) => {
    if (conf >= 0.80) return 'var(--accent)'
    if (conf >= 0.50) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div className="page-wrapper page-enter">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Add Transaction</h1>
          <p className={styles.pageSub}>Type or speak — ML will classify automatically</p>
        </div>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${!voiceMode ? styles.modeBtnActive : ''}`}
            onClick={() => { setVoiceMode(false); reset() }}
          >⌨ Type</button>
          <button
            className={`${styles.modeBtn} ${voiceMode ? styles.modeBtnActive : ''}`}
            onClick={() => { setVoiceMode(true); reset() }}
          >🎙 Voice</button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Input Panel */}
        <div className="card">
          {!voiceMode ? (
            <>
              <h3 className={styles.panelTitle}>Transaction Description</h3>
              <div className="form-group">
                <textarea
                  className={`form-input ${styles.textarea}`}
                  placeholder="e.g. paid 500 at swiggy, uber ride 250, salary credited 45000..."
                  value={text}
                  onChange={e => { setText(e.target.value); if (saved) reset() }}
                  rows={4}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePredict() } }}
                />
              </div>
              <div className={styles.btnRow}>
                <button className="btn btn-ghost" onClick={reset} disabled={!text && !prediction}>
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePredict}
                  disabled={loading || !text.trim()}
                  style={{ flex: 1 }}
                >
                  {loading ? <><span className="spinner" /> Analyzing...</> : '✦ Analyze with ML'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.voicePanel}>
              <div
                className={`${styles.voiceOrb} ${recording ? styles.voiceOrbActive : ''}`}
                onClick={recording ? stopRecording : startRecording}
              >
                <span className={styles.voiceIcon}>{recording ? '⏹' : '🎙'}</span>
                {recording && <div className={styles.voiceRing} />}
              </div>
              <p className={styles.voiceStatus}>
                {loading ? 'Processing audio...' :
                 recording ? 'Recording... tap to stop' :
                 'Tap to start recording'}
              </p>
              {loading && <span className="spinner" />}
            </div>
          )}
        </div>

        {/* Result Panel */}
        {prediction && (
          <div className={`card ${styles.resultCard}`}>
            <div className={styles.resultHeader}>
              <h3 className={styles.panelTitle}>ML Prediction</h3>
              <div
                className={styles.confidenceBar}
                style={{ '--conf': `${prediction.confidence * 100}%`, '--conf-color': getConfidenceColor(prediction.confidence) }}
              >
                <div className={styles.confidenceFill} />
                <span className={styles.confidenceLabel}>{(prediction.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className={styles.predictionGrid}>
              <div className={styles.predField}>
                <span className={styles.predLabel}>Input text</span>
                <span className={styles.predValue}>{prediction.text}</span>
              </div>
              <div className={styles.predField}>
                <span className={styles.predLabel}>Status</span>
                <span className={`badge badge-${prediction.confidence >= 0.8 ? 'high' : prediction.confidence >= 0.5 ? 'medium' : 'low'}`}>
                  {prediction.status}
                </span>
              </div>
            </div>

            <div className="divider" />

            {/* Editable fields */}
            <div className={styles.editGrid}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            {saved ? (
              <div className={styles.savedState}>
                <span className={styles.savedIcon}>✓</span>
                <span>Saved successfully!</span>
                <button className="btn btn-secondary btn-sm" onClick={reset}>Add another</button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSave}
                disabled={loading || !amount}
              >
                {loading ? <><span className="spinner" /> Saving...</> : `Save ${category} — ₹${parseFloat(amount || 0).toLocaleString('en-IN')}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className={styles.tips}>
        <h4 className={styles.tipsTitle}>💡 Tips for better predictions</h4>
        <div className={styles.tipsList}>
          {[
            ['Natural language', '"paid 500 at swiggy" or "uber ride to office 250"'],
            ['Corrections', '"paid 300 wait no 400" — model handles corrections'],
            ['Negations', '"bill is 3000 not 3200" — model ignores negated amounts'],
            ['Voice', 'Speak naturally — Whisper transcribes, ML classifies'],
          ].map(([title, desc]) => (
            <div key={title} className={styles.tip}>
              <strong>{title}</strong>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
