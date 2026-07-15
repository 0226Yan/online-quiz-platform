import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminSession');
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
        🧠 QuizGame
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/leaderboard" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Leaderboard
        </Link>
        <Link to="/history" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          History
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            Admin
          </Link>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Hi, {user?.username}
        </span>
        <DarkModeToggle />
        <button onClick={logout} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
