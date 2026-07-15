import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import QuestionCard from '../components/QuestionCard';
import Spinner from '../components/Spinner';
import api from '../api/api';
import Navbar from '../components/Navbar';

const QuizPage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useQuiz();
  // Guards against React Strict Mode running the effect twice and against
  // accidental double-submits if the effect re-fires before status updates.
  const submittedRef = useRef(false);

  useEffect(() => {
    if (state.status === 'idle' || state.questions.length === 0) {
      navigate('/', { replace: true });
    }
  }, [state.status, state.questions.length, navigate]);

  useEffect(() => {
    if (
      state.status === 'active' &&
      state.answers.length === state.questions.length &&
      state.questions.length > 0 &&
      !submittedRef.current
    ) {
      submittedRef.current = true;
      submitQuiz();
    }
    // eslint-disable-next-line
  }, [state.answers.length]);

  const submitQuiz = async () => {
    dispatch({ type: 'SUBMITTING' });

    try {
      const res = await api.post('/quiz/submit', {
        answers: state.answers,
        attemptId: state.attemptId,
      });

      const { score, bonusPoints, totalScore, scoreId, review } = res.data.data;

      dispatch({
        type: 'COMPLETE_QUIZ',
        payload: { score, bonusPoints, totalScore, scoreId, review },
      });

      navigate('/results');
    } catch (err) {
      // Allow the user to retry if the submit failed.
      submittedRef.current = false;
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.error || 'Submission failed',
      });

      navigate('/');
    }
  };

  const handleAnswer = (answerData) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: answerData });
  };

  if (state.status === 'submitting') {
    return (
      <>
        <Navbar />

        <div className="center-container">
          <div className="text-center">
            <Spinner size={48} />
            <p style={{ marginTop: '1rem' }}>Submitting your answers…</p>
          </div>
        </div>
      </>
    );
  }

  if (state.status !== 'active' || state.questions.length === 0) {
    return null;
  }

  const currentQuestion = state.questions[state.currentIndex];

  if (!currentQuestion) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="page-container" style={{ paddingTop: '2rem' }}>
        <QuestionCard
          key={currentQuestion._id}
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={state.questions.length}
          onAnswer={handleAnswer}
        />
      </div>
    </>
  );
};

export default QuizPage;