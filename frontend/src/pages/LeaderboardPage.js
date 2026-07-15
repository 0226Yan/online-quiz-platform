import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/quiz/leaderboard')
      .then((res) => setLeaderboard(res.data.data.leaderboard))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>🏆 Leaderboard</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Best attempt per player (score + speed bonus), top 20
        </p>

        {loading && <Spinner label="Loading leaderboard…" />}
        {error && <div className="banner banner-error" role="alert">{error}</div>}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="card text-center">
            <p className="text-muted">No scores yet. Be the first to play!</p>
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Player</th>
                  <th style={thStyle}>Best Score</th>
                  <th style={thStyle}>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const isMe = entry.username === currentUser?.username;
                  return (
                    <tr
                      key={entry.username}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isMe ? 'rgba(99,102,241,0.06)' : undefined,
                      }}
                    >
                      <td style={tdStyle}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: isMe ? 700 : 400 }}>
                        {entry.username} {isMe && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>(you)</span>}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary)' }}>
                        {entry.bestScore.toFixed(2)}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{entry.attempts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' };
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.92rem' };

export default LeaderboardPage;
