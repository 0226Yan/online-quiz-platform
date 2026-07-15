import React, { useState } from 'react';
import Timer from './Timer';

const QuestionCard = ({ question, questionNumber, totalQuestions, onAnswer }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);

  React.useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(question.timeLimit);
  }, [question._id, question.timeLimit]);

  React.useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [question._id, submitted]);

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer({ selectedAnswer: selected !== null ? selected : -1, timeRemaining: timeLeft });
  };

  const handleExpire = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer({ selectedAnswer: -1, timeRemaining: 0 });
  };

  return (
    <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="flex-between mb-2">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Question {questionNumber} of {totalQuestions}
        </span>
        <Timer key={question._id} timeLimit={question.timeLimit} onExpire={handleExpire} />
      </div>

      <div style={{
        height: 4,
        background: 'var(--border)',
        borderRadius: 2,
        marginBottom: '1.25rem',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${(questionNumber / totalQuestions) * 100}%`,
          background: 'var(--primary)',
          transition: 'width 0.3s',
        }} />
      </div>

      <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', lineHeight: 1.5 }}>
        {question.text}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={submitted}
            style={{
              textAlign: 'left',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: `2px solid ${selected === idx ? 'var(--primary)' : 'var(--border)'}`,
              background: selected === idx ? 'var(--primary)' : 'var(--bg-card)',
              color: selected === idx ? 'white' : 'var(--text)',
              fontWeight: selected === idx ? 600 : 400,
              transition: 'all 0.15s',
              cursor: submitted ? 'default' : 'pointer',
            }}
          >
            <span style={{ fontWeight: 700, marginRight: '0.5rem', opacity: 0.7 }}>
              {String.fromCharCode(65 + idx)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={submitted}
        style={{ width: '100%', padding: '0.75rem' }}
      >
        {submitted ? 'Submitted' : selected !== null ? 'Submit Answer' : 'Skip (time out)'}
      </button>
    </div>
  );
};

export default QuestionCard;