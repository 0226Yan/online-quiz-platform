import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import Navbar from '../components/Navbar';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useQuiz();

  if (state.status !== 'completed') {
    navigate('/', { replace: true });
    return null;
  }

  const { score, bonusPoints, totalScore, questions, review } = state;
  const totalQuestions = review?.length || questions.length;

  const playAgain = () => {
    dispatch({ type: 'RESET_QUIZ' });
    navigate('/');
  };

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div className="card text-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {score === totalQuestions ? '🏆' : score >= totalQuestions / 2 ? '🎉' : '📚'}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Quiz Complete!
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            margin: '1.5rem 0',
          }}>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{score}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Correct</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                +{bonusPoints?.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speed Bonus</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                {totalScore?.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Score</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={playAgain} style={{ padding: '0.65rem 1.5rem' }}>
              Play Again
            </button>
            <Link to="/leaderboard">
              <button className="btn-outline" style={{ padding: '0.65rem 1.5rem' }}>Leaderboard</button>
            </Link>
            <Link to="/history">
              <button className="btn-outline" style={{ padding: '0.65rem 1.5rem' }}>My History</button>
            </Link>
          </div>
        </div>

        {/* Answer review */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Answer Review</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {review.map((item, i) => {
            const timedOut = item.selectedAnswer === -1;
            const isCorrect = item.isCorrect;
            const yourAnswer = !timedOut ? item.options[item.selectedAnswer] : null;
            const correctAnswer = item.options[item.correctIndex];

            return (
              <div key={item.questionId || i} className="card" style={{ padding: '1rem' }}>
                <div className="flex-between mb-1">
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Q{i + 1}. {item.text}
                  </span>
                  <span className={`badge ${isCorrect ? 'badge-green' : timedOut ? 'badge-yellow' : 'badge-red'}`}>
                    {isCorrect ? '✓ Correct' : timedOut ? '⏱ Timed Out' : '✗ Wrong'}
                  </span>
                </div>

                {timedOut ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No answer selected. Correct: <strong>{correctAnswer}</strong>
                  </p>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Your answer:{' '}
                    <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      {yourAnswer}
                    </strong>
                    {!isCorrect && (
                      <>
                        {' '}• Correct:{' '}
                        <strong style={{ color: 'var(--success)' }}>
                          {correctAnswer}
                        </strong>
                      </>
                    )}
                    {' '}• Time left: <strong>{item.timeRemaining}s</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ResultsPage;
