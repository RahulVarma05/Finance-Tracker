import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'DASHBOARD', icon: '⊞' },
  { to: '/stats', label: 'STATS', icon: '📈' },
  { to: '/history', label: 'TRANSACTIONS', icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <h2>Nova Ledger</h2>
          <span className={styles.brandSub}>STARK PRECISION</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{icon}</span>
              <span className={styles.label}>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

    </aside>
  );
}
