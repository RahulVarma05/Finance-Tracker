import { useState } from 'react';
import styles from './Auth.module.css';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) return;
    
    setLoading(true);
    setError(null);
    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const body = isRegistering ? { email, name, password } : { email, password };
      
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.detail || 'An error occurred.');
      } else {
        localStorage.setItem('userId', data.user.email);
        localStorage.setItem('userName', data.user.name.split(' ')[0]);
        onLogin();
      }
    } catch (err) {
      setError('Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.leftPane}>
        <div className={styles.compassIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="7" r="4"></circle>
            <path d="M10.5 10.5L5 21"></path>
            <path d="M13.5 10.5L19 21"></path>
            <path d="M8 15h8"></path>
          </svg>
        </div>
        
        <div className={styles.brandingBox}>
          <div className={styles.logoRow}>
            <h2>Nova Ledger</h2>
            <div className={styles.logoLine}></div>
          </div>
          <h1>Precision<br />in Every<br />Decimal.</h1>
          <p>
            The architectural standard for modern asset<br />
            management and high-fidelity financial reporting.
          </p>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.formContainer}>
          <div className={styles.headerRow}>
            <h1>{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p>
              {isRegistering 
                ? 'Register your credentials to set up a new ledger.' 
                : 'Please enter your credentials to access the ledger.'}
            </p>
          </div>

          {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' }}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {isRegistering && (
              <div className={styles.inputGroup}>
                <label>FULL NAME</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}
          
            <div className={styles.inputGroup}>
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="name@firm.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <div className={styles.pwdLabelRow}>
                <label>PASSWORD</label>
                {!isRegistering && <a href="#" className={styles.forgot}>FORGOT?</a>}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.secureBadge}>
              <div className={styles.secureBars}>
                <div className={styles.scBar}></div>
                <div className={styles.scBar}></div>
                <div className={styles.scBar}></div>
                <div className={styles.scBarGhost}></div>
              </div>
              <span>SECURE CONNECTION ACTIVE</span>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Processing...' : (isRegistering ? 'Register and Continue →' : 'Sign In to Dashboard →')}
            </button>
          </form>

          <div className={styles.registerPrompt}>
            {isRegistering ? (
              <>Already have an account? <button onClick={() => setIsRegistering(false)}>Sign In</button></>
            ) : (
              <>Don't have an account? <button onClick={() => setIsRegistering(true)}>Register</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
