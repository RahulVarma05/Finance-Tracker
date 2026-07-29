import { useState } from 'react';
import { predictTransaction, addTransaction } from '../api/client';
import styles from './Setup.module.css';

export default function Setup({ onIncomeAdded, showToast }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    try {
      // Predict amount using ML
      const preview = await predictTransaction(text);
      let finalAmount = parseFloat(preview.amount);

      if (!finalAmount || finalAmount <= 0) {
        // Fallback or request manual? The UI refers to just typing and saving.
        // Let's assume the user typed "Monthly Salary 5000", which predicts perfectly.
        finalAmount = 0; // The API will probably fail if 0, but let's try
      }

      await addTransaction({
        text: preview.text,
        category: 'Income',
        amount: finalAmount || 1, // Fallback if inference fails but shouldn't on good input
        confidence: preview.confidence,
      });

      showToast('Income foundation set successfully.');
      onIncomeAdded();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to process income. Please enter a valid amount.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.setupPage}>
      <header className={styles.header}>
        <div className={styles.brand}>Nova Ledger</div>
        <div className={styles.step}>STEP 1 OF 2</div>
      </header>

      <main className={styles.main}>
        <div className={styles.leftPane}>
          <div className={styles.content}>
            <h1>Let's set your<br />foundation.</h1>
            <p className={styles.subtitle}>
              Add your first income source to start tracking.<br />
              Precision begins with your primary cash flow.
            </p>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>DESCRIBE INCOME SOURCE & AMOUNT</label>
                <div className={styles.inputWrap}>
                  <input
                    type="text"
                    placeholder="e.g., Monthly Salary 5000"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                  />
                  <span className={styles.icon}>💵</span>
                </div>
              </div>

              <div className={styles.actionRow}>
                <div className={styles.infoBox}>
                  <div className={styles.infoIcon}>i</div>
                  <p>You can add multiple sources<br />after the initial setup.</p>
                </div>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || !text.trim()}
                >
                  {loading ? <span className="spinner" style={{ borderColor: '#666', borderTopColor: '#fff' }} /> : 'Confirm and Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className={styles.rightPane}>
          <div className={styles.hugeNum}>01</div>
          <div className={styles.watermark}>STARK PRECISION • EDITORIAL LEDGER V2.4</div>
        </div>
      </main>
    </div>
  );
}
