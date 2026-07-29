import { useState, useEffect, useRef } from 'react';
import { getTransactions, predictTransaction, addTransaction, getSummary, API_BASE_URL } from '../api/client';
import TopNav from '../components/TopNav';
import styles from './Dashboard.module.css';

export default function Dashboard({ showToast }) {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  
  // Transaction entry state
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const load = async () => {
    try {
      const txns = await getTransactions(6, 0);
      setRecent(txns);
      const summary = await getSummary();
      setBalance(summary.balance || 0);
    } catch {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePredictAndSave = async (inputText = text) => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    try {
      const pred = await predictTransaction(inputText);
      setPrediction(pred);
      
      let amt = parseFloat(pred.amount);
      if (!amt || amt <= 0) amt = 0; // fallback

      if (amt > 0) {
        // Auto-save the transaction
        await addTransaction({
          text: pred.text,
          category: pred.category,
          amount: amt,
          confidence: pred.confidence
        });
        showToast('Transaction recorded automatically.', 'success');
        setText('');
        setTimeout(() => setPrediction(null), 3000);
        load();
      } else {
        showToast('Could not detect amount. Please add manually from History.', 'warning');
      }
    } catch (err) {
      showToast('Error analyzing transaction.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = handleVoiceStop;
      mr.start();
      setRecording(true);
    } catch {
      showToast('Microphone access denied or not available.', 'error');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const handleVoiceStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('file', blob, 'recording.webm');
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/voice`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setText(result.text);
      handlePredictAndSave(result.text);
    } catch {
      showToast('Voice processing failed. Make sure Whisper/API is online.', 'error');
      setIsAnalyzing(false);
    }
  };

  const navLinks = [
    { label: 'Overview', to: '/' },
    { label: 'User Guide', to: '/guide' },
    { label: 'About Us', to: '/about' }
  ];

  return (
    <div className={styles.dashboard}>
      <TopNav links={navLinks} />

      <div className="page-wrapper">
        <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Good morning, {localStorage.getItem('userName') || 'User'}.</h1>
            <p className="text-muted">Ready to record today's financial movements?</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>AVAILABLE BALANCE</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>₹{balance.toLocaleString()}</div>
          </div>
        </header>

        {/* Input Block */}
        <div className={styles.inputSection}>
          <div className={styles.mainInputWrap} style={{ borderColor: recording ? 'var(--expense)' : 'var(--border)' }}>
            <span className={styles.inputPrefix}>⌘</span>
            <input
              type="text"
              placeholder={recording ? "Listening..." : "Paid 300 for dinner with team..."}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePredictAndSave(text) }}
              disabled={recording || isAnalyzing}
            />
            <span 
              className={styles.inputMic} 
              style={{ color: recording ? 'var(--expense)' : 'var(--text-secondary)' }}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? '⏹' : '🎙'}
            </span>
          </div>

          <div className={styles.inputActions}>
            <button 
              className={`btn btn-primary ${styles.analyzeBtn}`} 
              onClick={() => handlePredictAndSave(text)}
              disabled={isAnalyzing || !text.trim() || recording}
            >
              {isAnalyzing ? <span className="spinner" /> : 'Submit'}
            </button>
            
            {prediction && (
              <div className={styles.predictionBox}>
                <div className={styles.predIcon}>✦</div>
                <div className={styles.predInfo}>
                  <div className={styles.predCatLabel}>PREDICTED CATEGORY</div>
                  <div className={styles.predCatValue}>{prediction.category}</div>
                </div>
                <div className={styles.predStatusWrap}>
                  <div className={styles.predStatusBox}>
                    <div className={styles.predStatLabel}>CONFIDENCE</div>
                    <div className="badge badge-high">High</div>
                  </div>
                  <div className={styles.predStatusBox}>
                    <div className={styles.predStatLabel}>STATUS</div>
                    <div className={styles.textIncome}>✓ Ready</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h3>RECENT MOVEMENTS</h3>
            <a href="/history" className={styles.viewArchive}>VIEW LEDGER ARCHIVE</a>
          </div>

          <div className={styles.movementList}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner" />
              </div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 40, color: 'var(--text-muted)' }}>No movements today.</div>
            ) : (
              recent.map((tx) => (
                <div key={tx.id} className={styles.movementRow}>
                  <div className={styles.movementIcon}>
                    {tx.type === 'income' ? '💵' : '💳'}
                  </div>
                  <div className={styles.movementDetails}>
                    <div className={styles.movementTitle}>{tx.text}</div>
                    <div className={styles.movementMeta}>
                      <span className={styles.metaCat}>{tx.category.toUpperCase()}</span>
                      <span className={styles.metaCatDivider}>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                  <div className={styles.movementBadge}>
                    <span className="badge">{tx.type === 'income' ? 'Payroll / Incoming' : 'Expense'}</span>
                  </div>
                  <div className={`${styles.movementAmount} ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
