import { useState } from 'react'
import { predictTransaction, addTransaction } from '../api/client'
import styles from './Setup.module.css'

export default function Setup({ onIncomeAdded, showToast }) {
  const [text, setText]       = useState('')
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [step, setStep]       = useState(1) // 1=input, 2=confirm

  const SUGGESTIONS = [
    'salary credited 45000',
    'freelance payment received 15000',
    'monthly stipend 8000',
    'received bonus 10000',
  ]

  const handlePredict = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const result = await predictTransaction(text)
      setPreview(result)
      if (result.amount) setAmount(result.amount)
      setStep(2)
    } catch {
      showToast('Could not connect to backend. Is api.py running?', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const finalAmount = parseFloat(amount)
    if (!finalAmount || finalAmount <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }
    setLoading(true)
    try {
      await addTransaction({
        text: preview.text,
        category: 'Income',
        amount: finalAmount,
        confidence: preview.confidence,
      })
      showToast('Income added! Welcome to FinTrack 🎉', 'success')
      onIncomeAdded()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>

        {/* Left decorative panel */}
        <div className={styles.left}>
          <div className={styles.logoMark}>₹</div>
          <h1 className={styles.headline}>
            Your money,<br />
            <em>understood.</em>
          </h1>
          <p className={styles.sub}>
            FinTrack uses ML to automatically categorize your transactions and extract amounts — even from messy, natural language inputs.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>96.7%</span>
              <span className={styles.statLabel}>Category accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>99.2%</span>
              <span className={styles.statLabel}>Amount accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>10</span>
              <span className={styles.statLabel}>Categories</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.right}>
          <div className={styles.card}>
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepDot} ${step >= 1 ? styles.stepActive : ''}`}>1</div>
              <div className={styles.stepLine}></div>
              <div className={`${styles.stepDot} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
            </div>

            {step === 1 && (
              <>
                <h2 className={styles.cardTitle}>Add your income first</h2>
                <p className={styles.cardSub}>
                  Start by telling us your income — salary, freelance, or any credit. This helps us track your balance accurately.
                </p>

                <div className="form-group">
                  <label className="form-label">Describe your income</label>
                  <textarea
                    className={`form-input ${styles.textarea}`}
                    placeholder="e.g. salary credited 45000, received freelance payment 12000..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={3}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePredict()}
                  />
                </div>

                <div className={styles.suggestions}>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      className={styles.suggestion}
                      onClick={() => setText(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handlePredict}
                  disabled={loading || !text.trim()}
                >
                  {loading ? <><span className="spinner" /> Analyzing...</> : 'Analyze with ML →'}
                </button>
              </>
            )}

            {step === 2 && preview && (
              <>
                <h2 className={styles.cardTitle}>Confirm your income</h2>
                <p className={styles.cardSub}>Review what our ML model detected. Edit the amount if needed.</p>

                <div className={styles.previewBox}>
                  <div className={styles.previewRow}>
                    <span className={styles.previewLabel}>Transaction</span>
                    <span className={styles.previewValue}>{preview.text}</span>
                  </div>
                  <div className={styles.previewRow}>
                    <span className={styles.previewLabel}>Category</span>
                    <span className="badge badge-income">Income ✓</span>
                  </div>
                  <div className={styles.previewRow}>
                    <span className={styles.previewLabel}>Confidence</span>
                    <span className={`badge badge-${preview.confidence >= 0.8 ? 'high' : 'medium'}`}>
                      {preview.status}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className={styles.btnRow}>
                  <button className="btn btn-ghost" onClick={() => { setStep(1); setPreview(null) }}>
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSave}
                    disabled={loading || !amount}
                    style={{ flex: 1 }}
                  >
                    {loading ? <><span className="spinner" /> Saving...</> : 'Save & Continue →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
