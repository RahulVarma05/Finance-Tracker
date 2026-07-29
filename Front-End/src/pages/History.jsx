import { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../api/client';
import TopNav from '../components/TopNav';
import styles from './History.module.css';

const CATEGORY_COLORS = {
  Food: '#111111', Transport: '#444444', Housing: '#777777',
  Entertainment: '#999999', Shopping: '#aaaaaa', Utilities: '#cccccc',
  Health: '#dddddd', Education: '#eeeeee', Income: '#059669', Others: '#f5f5f5',
};

export default function History({ showToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTransactions(200, 0);
      setTransactions(data);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(tx => {
    const matchType = filter === 'all' || tx.type === filter;
    const matchSearch = !search || tx.text.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Transaction deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const navLinks = [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopNav links={navLinks} />

      <div className="page-wrapper">
        
        {/* Global Archive Search & Filters */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>GLOBAL ARCHIVE</div>
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                placeholder="Search by text or category"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <div className={styles.filterTabs}>
              {['all', 'income', 'expense'].map(f => (
                <button
                  key={f}
                  className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className={styles.tableHeader}>
            <div style={{ width: '10%' }}>DATE</div>
            <div style={{ width: '25%' }}>DESCRIPTION</div>
            <div style={{ width: '15%' }}>CATEGORY</div>
            <div style={{ width: '15%' }}>REFERENCE</div>
            <div style={{ width: '15%' }}>ML CONFIDENCE</div>
            <div style={{ width: '12%', textAlign: 'right' }}>AMOUNT</div>
            <div style={{ width: '8%', textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className={styles.tableBody}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
            ) : paginated.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No records found</div>
            ) : (
              paginated.map(tx => (
                <div key={tx.id} className={styles.tableRow}>
                  <div style={{ width: '10%', fontSize: 13 }}>
                    {tx.date.split(' ')[0]}
                  </div>
                  <div style={{ width: '25%' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                      {tx.type === 'income' ? 'CREDIT' : 'DEBIT'}
                    </div>
                  </div>
                  <div style={{ width: '15%' }}>
                    <span className="badge" style={{ background: tx.type === 'income' ? 'var(--income)' : '#e0e0e0', color: tx.type === 'income' ? '#fff' : '#111' }}>
                      {tx.category}
                    </span>
                  </div>
                  <div style={{ width: '15%', fontSize: 11, color: 'var(--text-muted)' }}>
                    TXN-{String(tx.id).padStart(5, '0')}-A
                  </div>
                  <div style={{ width: '15%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 4, width: '100%', background: 'var(--border)', maxWidth: 80 }}>
                        <div style={{ height: '100%', width: `${tx.confidence * 100}%`, background: tx.confidence > 0.8 ? 'var(--income)' : 'var(--expense)' }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: tx.confidence > 0.8 ? 'var(--income)' : 'var(--expense)' }}>
                        {tx.confidence >= 0.8 ? 'Verified' : `${(tx.confidence*100).toFixed(0)}% Conf.`}
                      </div>
                    </div>
                  </div>
                  <div style={{ width: '12%', textAlign: 'right', fontWeight: 600, fontSize: 14, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </div>
                  <div style={{ width: '8%', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(tx.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--text-muted)' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination & Footer summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            SHOWING PAGE {page + 1} OF {totalPages}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(page-1)}>⟨</button>
            <button className="btn btn-primary btn-sm" style={{ padding: '0 16px' }}>{page + 1}</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page+1)}>⟩</button>
          </div>
        </div>

      </div>
    </div>
  );
}
