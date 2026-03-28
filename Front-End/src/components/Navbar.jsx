import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  { to: '/',               label: 'Dashboard',   icon: '◈' },
  { to: '/add',            label: 'Add',         icon: '+' },
  { to: '/history',        label: 'History',     icon: '≡' },
]

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>₹</span>
          <span className={styles.brandName}>FinTrack</span>
        </div>

        <div className={styles.links}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.linkIcon}>{icon}</span>
              <span className={styles.linkLabel}>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
