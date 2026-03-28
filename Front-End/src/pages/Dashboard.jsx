import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSummary, getTransactions } from '../api/client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import styles from './Dashboard.module.css'

const CATEGORY_COLORS = {
  Food: '#f59e0b', Transport: '#3b82f6', Housing: '#6b7280',
  Entertainment: '#8b5cf6', Shopping: '#ec4899', Utilities: '#06b6d4',
  Health: '#10b981', Education: '#f97316', Income: '#2d5a3d', Others: '#9ca3af',
}

const CATEGORY_ICONS = {
  Food: '🍽', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Shopping: '🛍', Utilities: '💡', Health: '💊', Education: '📚',
  Income: '💰', Others: '📦',
}

function formatAmount(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

function getCategoryClass(cat) {
  return `cat-${cat?.toLowerCase() || 'others'}`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className={styles.tooltip}>
      <span>{CATEGORY_ICONS[name] || '📦'} {name}</span>
      <strong>₹{value.toLocaleString('en-IN')}</strong>
    </div>
  )
}

export default function Dashboard({ showToast }) {
  const [summary, setSummary]         = useState(null)
  const [recent, setRecent]           = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, txns] = await Promise.all([getSummary(), getTransactions(5, 0)])
        setSummary(s)
        setRecent(txns)
      } catch {
        showToast('Failed to load dashboard data', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    )
  }

  const balance = summary?.balance ?? 0
  const income  = summary?.total_income ?? 0
  const expense = summary?.total_expense ?? 0
  const count   = summary?.transaction_count ?? 0

  // Pie chart data — expenses only
  const pieData = Object.entries(summary?.by_category ?? {})
    .filter(([cat]) => cat !== 'Income')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Bar chart — top 6 expense categories
  const barData = pieData.slice(0, 6)

  const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(0) : 0

  return (
    <div className="page-wrapper page-enter">
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>{count} transactions tracked</p>
        </div>
        <Link to="/add" className="btn btn-primary">
          + Add Transaction
        </Link>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
          <div className={styles.summaryLabel}>Net Balance</div>
          <div className={styles.summaryAmount} style={{ color: balance >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {balance >= 0 ? '' : '-'}₹{Math.abs(balance).toLocaleString('en-IN')}
          </div>
          <div className={styles.summaryFooter}>
            Savings rate: <strong>{savingsRate}%</strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Income</div>
          <div className={styles.summaryAmount} style={{ color: 'var(--accent)' }}>
            ₹{income.toLocaleString('en-IN')}
          </div>
          <div className={styles.summaryFooter} style={{ color: 'var(--accent)' }}>
            ↑ Credited
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Expenses</div>
          <div className={styles.summaryAmount} style={{ color: 'var(--danger)' }}>
            ₹{expense.toLocaleString('en-IN')}
          </div>
          <div className={styles.summaryFooter} style={{ color: 'var(--danger)' }}>
            ↓ Spent
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Transactions</div>
          <div className={styles.summaryAmount}>{count}</div>
          <div className={styles.summaryFooter}>All time</div>
        </div>
      </div>

      {/* Charts Row */}
      {pieData.length > 0 && (
        <div className={styles.chartsRow}>
          {/* Pie Chart */}
          <div className="card">
            <h3 className={styles.sectionTitle}>Spending Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className={styles.legend}>
              {pieData.slice(0, 5).map(({ name, value }) => (
                <div key={name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: CATEGORY_COLORS[name] }} />
                  <span className={styles.legendName}>{name}</span>
                  <span className={styles.legendVal}>{formatAmount(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card">
            <h3 className={styles.sectionTitle}>Category Spending</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Transactions</h3>
          <Link to="/history" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction to see it here</p>
          </div>
        ) : (
          <div className={styles.txList}>
            {recent.map(tx => (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txIcon}>
                  <span>{CATEGORY_ICONS[tx.category] || '📦'}</span>
                </div>
                <div className={styles.txInfo}>
                  <div className={styles.txText}>{tx.text}</div>
                  <div className={styles.txMeta}>
                    <span className={`badge ${getCategoryClass(tx.category)}`}>{tx.category}</span>
                    <span className={styles.txDate}>{tx.date?.split(' ')[0]}</span>
                  </div>
                </div>
                <div className={`${styles.txAmount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
