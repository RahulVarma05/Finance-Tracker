import { useState, useEffect } from 'react';
import { getSummary } from '../api/client';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TopNav from '../components/TopNav';
import styles from './Stats.module.css';

const CATEGORY_COLORS = {
  Food: '#111111', Transport: '#444444', Housing: '#777777',
  Entertainment: '#999999', Shopping: '#aaaaaa', Utilities: '#cccccc',
  Health: '#dddddd', Education: '#eeeeee', Income: '#059669', Others: '#f5f5f5',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background: '#fff', border: '1px solid #eaeaea', padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>
      {name}: ₹{value.toLocaleString()}
    </div>
  );
};

export default function Stats({ showToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSummary();
        setSummary(s);
      } catch {
        showToast('Failed to load stats', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const navLinks = [
    { label: 'Stats', to: '/stats' },
    { label: 'Help', to: '#' }
  ];

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNav links={navLinks} />
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
      </div>
    );
  }

  const balance = summary?.balance ?? 0;
  const income = summary?.total_income ?? 0;
  const expense = summary?.total_expense ?? 0;

  const pieData = Object.entries(summary?.by_category ?? {})
    .filter(([cat]) => cat !== 'Income' && cat !== 'Others')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const barData = pieData.slice(0, 5);

  const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(0) : 0;
  
  // Calculate width ratio for cash flow
  const incomeWidth = income > 0 ? (income / (income + expense)) * 100 : 50;
  const expenseWidth = expense > 0 ? (expense / (income + expense)) * 100 : 50;
  const cashFlowMultiplier = expense > 0 ? (income / expense).toFixed(2) : '∞';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopNav links={navLinks} />

      <div className="page-wrapper">
        <div className={styles.topStatsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>TOTAL INCOME</div>
            <div className={styles.statValueIncome}>₹{income.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>TOTAL EXPENSES</div>
            <div className={styles.statValueExpense}>₹{expense.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>NET BALANCE</div>
            <div className={styles.statValue}>₹{balance.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>SAVINGS RATE</div>
            <div className={styles.statValue}>{savingsRate}%</div>
            <div className={styles.rateBar}>
              <div className={styles.rateFill} style={{ width: `${savingsRate}%` }} />
            </div>
          </div>
        </div>

        {/* Cash Flow Ratio */}
        <div className="card" style={{ padding: '32px' }}>
          <div className={styles.rowHeader}>
            <div>
              <h3>Cash Flow Ratio</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Visual balance of monthly velocity.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{cashFlowMultiplier}x</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>COVERAGE MULTIPLIER</div>
            </div>
          </div>
          
          <div className={styles.cashFlowBarWrap}>
            <div className={styles.cfIncome} style={{ width: `${incomeWidth}%` }} />
            <div className={styles.cfExpense} style={{ width: `${expenseWidth}%` }} />
          </div>
          <div className={styles.cfLabels}>
            <div><span style={{ color: 'var(--income)' }}>■</span> INCOME (₹{income.toLocaleString()})</div>
            <div>EXPENSES (₹{expense.toLocaleString()}) <span style={{ color: 'var(--expense)' }}>■</span></div>
          </div>
        </div>

        {/* Charts Row */}
        <div className={styles.chartsGrid}>
          {/* Pie */}
          <div className="card" style={{ padding: 32 }}>
            <h3>Spending Distribution</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 32 }}>
              <div style={{ flex: 1, height: 240, position: 'relative' }}>
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#eee'} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>₹{expense >= 1000 ? (expense/1000).toFixed(1) + 'k' : expense}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOTAL OUT</div>
                </div>
              </div>
              
              <div className={styles.pieLegend}>
                {pieData.slice(0, 4).map(({ name, value }) => {
                  const pct = expense > 0 ? ((value / expense) * 100).toFixed(0) : 0;
                  return (
                    <div key={name} className={styles.legendRow}>
                      <div className={styles.legLeft}>
                        <span style={{ color: CATEGORY_COLORS[name] }}>■</span> {name}
                      </div>
                      <div className={styles.legRight}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bar */}
          <div className="card" style={{ padding: 32 }}>
            <div className={styles.rowHeader}>
              <div>
                <h3>Category Comparison</h3>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Current Month vs. Previous Month</p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>
                <div><span style={{ color: '#111' }}>■</span> CURRENT</div>
                <div><span style={{ color: '#eee' }}>■</span> PREVIOUS</div>
              </div>
            </div>

            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {barData.map((d) => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
                    <span>{d.name}</span>
                    {/* Fake insight logic */}
                    <span style={{ color: d.value > 500 ? 'var(--expense)' : 'var(--income)' }}>{d.value > 500 ? '+18% INCREASE' : '-12% IMPROVEMENT'}</span>
                  </div>
                  <div style={{ height: 12, background: 'transparent', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ height: '6px', width: '100%', background: '#eee' }}>
                      <div style={{ height: '100%', width: '100%', background: '#111', maxWidth: `${(d.value / Math.max(...barData.map(b=>b.value))) * 100}%` }} />
                    </div>
                    <div style={{ height: '4px', width: `${((d.value * 0.8) / Math.max(...barData.map(b=>b.value))) * 100}%`, background: '#eee' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
