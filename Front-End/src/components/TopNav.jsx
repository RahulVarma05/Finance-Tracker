import { NavLink } from 'react-router-dom';

export default function TopNav({ links }) {
  // `links` should be array: [{ label: 'Overview', to: '/' }]
  return (
    <div className="topnav">
      <div className="topnav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="topnav-right">
        <button className="btn btn-primary" style={{ fontSize: '13px' }} onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Sign Out</button>
      </div>
    </div>
  );
}
