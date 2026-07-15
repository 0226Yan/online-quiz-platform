import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useQuiz } from '../context/QuizContext';
import api from '../api/api';

const Home = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useQuiz();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const startQuiz = async () => {
    dispatch({ type: 'START_LOADING' });
    try {
      const res = await api.get('/quiz/questions');
      dispatch({ type: 'SET_QUESTIONS', payload: res.data.data.questions });
      navigate('/quiz');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Failed to load questions' });
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="card text-center" style={{ maxWidth: 520, margin: '4rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Quiz Game
          </h1>
          <p className="text-muted mb-3">
            Welcome, <strong>{user?.username}</strong>! Test your knowledge with timed questions.
            Answer quickly — speed earns bonus points!
          </p>

          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>How it works:</p>
            <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
              <li>6–10 multiple-choice questions, 4 options each</li>
              <li>Each question has a countdown timer</li>
              <li>+1 point per correct answer</li>
              <li>Bonus up to +1 point total for answering quickly</li>
              <li>Once submitted, answers cannot be changed</li>
            </ul>
          </div>

          {state.error && (
            <p className="error-msg mb-2">{state.error}</p>
          )}

          <button
            className="btn-primary"
            onClick={startQuiz}
            disabled={state.status === 'loading'}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {state.status === 'loading' ? (
              <>
                <Spinner size={18} inline />
                Loading…
              </>
            ) : '▶ Start Quiz'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
