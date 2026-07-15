import React from 'react';
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider } from './context/QuizContext';

import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';

const Router =
  process.env.REACT_APP_DEMO_MODE === 'true'
    ? HashRouter
    : BrowserRouter;

const App = () => (
  <ThemeProvider>
    <QuizProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/quiz"
              element={<QuizPage />}
            />

            <Route
              path="/results"
              element={<ResultsPage />}
            />

            <Route
              path="/history"
              element={<HistoryPage />}
            />

            <Route
              path="/leaderboard"
              element={<LeaderboardPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute adminOnly />
            }
          >
            <Route
              path="/admin"
              element={<AdminPage />}
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Router>
    </QuizProvider>
  </ThemeProvider>
);

export default App;