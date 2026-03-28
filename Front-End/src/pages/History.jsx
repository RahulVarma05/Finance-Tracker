import { useState, useEffect } from 'react'
import { getTransactions, deleteTransaction, updateTransaction } from '../api/client'
import styles from './History.module.css'

const CATEGORIES = ['Food','Transport','Housing','Entertainment','Shopping','Utilities','Health','Education','Income','Others']

const CATEGORY_ICONS = {
  Food:'🍽', Transport:'🚗', Housing:'🏠', Entertainment:'🎬',
  Shopping:'🛍', Utilities:'💡', Health:'💊', Education:'📚',
  Income:'💰', Others:'📦',
}

function getCategoryClass(cat) {
  return `cat-${cat?.toLowerCase() || 'others'}`
}

export default function History({ showToast }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [editId, setEditId]             = useState(null)
  const [editCat, setEditCat]           = useState('')
  const [deleteId, setDeleteId]         = useState(null)
  const [filter, setFilter]             = useState('all') // all | income | expense
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const PAGE_SIZE = 20

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTransactions(100, 0)
      setTransactions(data)
    } catch {
      showToast('Failed to load transactions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Filter + search
  const filtered = transactions.filter(tx => {
    const matchType   = filter === 'all' || tx.type === filter
    const matchSearch = !search || tx.text.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      setDeleteId(null)
      showToast('Transaction deleted', 'success')
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  const handleUpdate = async (id) => {
    try {
      await updateTransaction(id, editCat)
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: editCat, type: editCat === 'Income' ? 'income' : 'expense' } : t))
      setEditId(null)
      showToast('Category updated', 'success')
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="page-wrapper page-enter">
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>History</h1>
          <p className={styles.pageSub}>{transactions.length} total transactions</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.stripStat}>
          <span className={styles.stripLabel}>Income</span>
          <span className={styles.stripVal} style={{ color: 'var(--accent)' }}>₹{totalIncome.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.stripDivider} />
        <div className={styles.stripStat}>
          <span className={styles.stripLabel}>Expenses</span>
          <span className={styles.stripVal} style={{ color: 'var(--danger)' }}>₹{totalExpense.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.stripDivider} />
        <div className={styles.stripStat}>
          <span className={styles.stripLabel}>Balance</span>
          <span className={styles.stripVal} style={{ color: totalIncome - totalExpense >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={`form-input ${styles.searchInput}`}
            placeholder="Search transactions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className={styles.filterTabs}>
          {['all', 'income', 'expense'].map(f => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
              onClick={() => { setFilter(f); setPage(0) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No transactions found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first transaction'}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Confidence</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(tx => (
                <tr key={tx.id} className={styles.tableRow}>
                  <td className={styles.dateCell}>{tx.date?.split(' ')[0]}</td>
                  <td className={styles.textCell}>{tx.text}</td>
                  <td>
                    {editId === tx.id ? (
                      <div className={styles.editCat}>
                        <select
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: 13 }}
                          value={editCat}
                          onChange={e => setEditCat(e.target.value)}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(tx.id)}>✓</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button>
                      </div>
                    ) : (
                      <span className={`badge ${getCategoryClass(tx.category)}`}>
                        {CATEGORY_ICONS[tx.category]} {tx.category}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.confWrap}>
                      <div className={styles.confBar}>
                        <div
                          className={styles.confFill}
                          style={{
                            width: `${tx.confidence * 100}%`,
                            background: tx.confidence >= 0.8 ? 'var(--accent)' : tx.confidence >= 0.5 ? 'var(--warning)' : 'var(--danger)'
                          }}
                        />
                      </div>
                      <span className={styles.confLabel}>{(tx.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={tx.type === 'income' ? styles.amountIncome : styles.amountExpense}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {deleteId === tx.id ? (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx.id)}>Delete</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditId(tx.id); setEditCat(tx.category) }}
                            title="Edit category"
                          >✎</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteId(tx.id)}
                            title="Delete"
                            style={{ color: 'var(--danger)' }}
                          >✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
          <span className={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      )}
    </div>
  )
}
