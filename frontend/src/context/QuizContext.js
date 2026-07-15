import React, { createContext, useContext, useReducer } from 'react';

const QuizContext = createContext();

// Generate a short, sufficiently-unique attempt id. Used by the backend to
// deduplicate accidental re-submits (double clicks, retries, etc.).
const generateAttemptId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'active' | 'submitting' | 'completed'
  questions: [],
  currentIndex: 0,
  answers: [],
  attemptId: null,
  score: null,
  bonusPoints: null,
  totalScore: null,
  scoreId: null,
  review: [],
  error: null,
};

const quizReducer = (state, action) => {
  switch (action.type) {
    case 'START_LOADING':
      return { ...initialState, status: 'loading' };

    case 'SET_QUESTIONS':
      return {
        ...state,
        status: 'active',
        questions: action.payload,
        currentIndex: 0,
        answers: [],
        // New attempt → new attemptId, so the next submit cannot collide with
        // an old (already-saved) attempt.
        attemptId: generateAttemptId(),
      };

    case 'ANSWER_QUESTION': {
      const { selectedAnswer, timeRemaining } = action.payload;
      const question = state.questions[state.currentIndex];
      if (!question) {
        // Defensive: should never happen, but avoids crashing if UI/state desyncs.
        return state;
      }
      const newAnswer = {
        questionId: question._id,
        selectedAnswer,
        timeRemaining,
      };
      // Prevent `currentIndex` from moving past the questions array.
      // Otherwise `QuizPage` may try to render `questions[currentIndex]` as `undefined`.
      const nextIndex = Math.min(state.currentIndex + 1, state.questions.length - 1);
      return {
        ...state,
        answers: [...state.answers, newAnswer],
        currentIndex: nextIndex,
      };
    }

    case 'SUBMITTING':
      return { ...state, status: 'submitting' };

    case 'COMPLETE_QUIZ':
      return {
        ...state,
        status: 'completed',
        score: action.payload.score,
        bonusPoints: action.payload.bonusPoints,
        totalScore: action.payload.totalScore,
        scoreId: action.payload.scoreId,
        review: action.payload.review || [],
      };

    case 'SET_ERROR':
      return { ...state, status: 'idle', error: action.payload };

    case 'RESET_QUIZ':
      return { ...initialState };

    default:
      return state;
  }
};

export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
