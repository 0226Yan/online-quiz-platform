import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/api';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/quiz/history')
      .then((res) => setHistory(res.data.data.history))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>📋 My Quiz History</h1>

        {loading && <Spinner label="Loading your history…" />}
        {error && <div className="banner banner-error" role="alert">{error}</div>}

        {!loading && history.length === 0 && (
          <div className="card text-center">
            <p className="text-muted">No quiz attempts yet. Start playing!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map((attempt, i) => (
            <div key={attempt._id} className="card" style={{ padding: '1rem' }}>
              <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                <div>
                  <span style={{ fontWeight: 600 }}>
                    Attempt #{history.length - i}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                    {new Date(attempt.completedAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {attempt.totalScore.toFixed(2)} pts
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {attempt.score}/{attempt.answers.length} correct
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                    +{attempt.bonusPoints.toFixed(2)} bonus
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expanded === i && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attempt.answers.map((a, j) => {
                    const q = a.questionId;
                    const timedOut = a.selectedAnswer === -1;
                    return (
                      <div key={j} style={{
                        padding: '0.75rem',
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        borderLeft: `3px solid ${a.isCorrect ? 'var(--success)' : timedOut ? 'var(--warning)' : 'var(--danger)'}`,
                      }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {q ? q.text : 'Question deleted'}
                        </p>
                        {q && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {timedOut ? (
                              <>⏱ Timed out — Correct: <strong>{q.options[q.correctIndex]}</strong></>
                            ) : (
                              <>
                                Your answer: <strong style={{ color: a.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                                  {q.options[a.selectedAnswer]}
                                </strong>
                                {!a.isCorrect && <> &nbsp;• Correct: <strong>{q.options[q.correctIndex]}</strong></>}
                                &nbsp;• Time left: <strong>{a.timeRemaining}s</strong>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
