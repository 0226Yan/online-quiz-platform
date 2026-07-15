const QUESTION_KEY = 'demo_questions';
const ATTEMPT_KEY = 'demo_attempts';
const USER_KEY = 'demo_registered_users';

const defaultUsers = [
  {
    id: 'user-1',
    username: 'demo_user',
    email: 'demo@example.com',
    password: '123456',
    role: 'user',
  },
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  },
];

const defaultQuestions = [
  {
    _id: 'q1',
    text: 'Which technology is used to build the frontend of this project?',
    options: ['React', 'Laravel', 'Django', 'Flutter'],
    correctIndex: 0,
    timeLimit: 25,
    isActive: true,
  },
  {
    _id: 'q2',
    text: 'Which database is used by this project?',
    options: ['MySQL', 'MongoDB', 'Oracle', 'SQLite'],
    correctIndex: 1,
    timeLimit: 25,
    isActive: true,
  },
  {
    _id: 'q3',
    text: 'Which HTTP method is commonly used to create data?',
    options: ['GET', 'POST', 'DELETE', 'HEAD'],
    correctIndex: 1,
    timeLimit: 20,
    isActive: true,
  },
  {
    _id: 'q4',
    text: 'What is JWT mainly used for in this application?',
    options: ['Styling', 'Authentication', 'Image editing', 'Database backup'],
    correctIndex: 1,
    timeLimit: 30,
    isActive: true,
  },
  {
    _id: 'q5',
    text: 'Which React hook supports reducer-based state management?',
    options: ['useState', 'useEffect', 'useReducer', 'useRef'],
    correctIndex: 2,
    timeLimit: 30,
    isActive: true,
  },
  {
    _id: 'q6',
    text: 'What happens when the question timer reaches zero?',
    options: [
      'The quiz restarts',
      'The answer is recorded as unanswered',
      'The correct answer is selected',
      'The timer starts again',
    ],
    correctIndex: 1,
    timeLimit: 30,
    isActive: true,
  },
  {
    _id: 'q7',
    text: 'Which status code normally means a resource was created?',
    options: ['200', '201', '400', '404'],
    correctIndex: 1,
    timeLimit: 20,
    isActive: true,
  },
  {
    _id: 'q8',
    text: 'Which library is used to send frontend HTTP requests?',
    options: ['Axios', 'Mongoose', 'Express', 'Zod'],
    correctIndex: 0,
    timeLimit: 25,
    isActive: true,
  },
];

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const ok = (data, status = 200) =>
  Promise.resolve({
    status,
    data: {
      success: true,
      data,
    },
  });

const fail = (message, status = 400) =>
  Promise.reject({
    response: {
      status,
      data: {
        success: false,
        error: message,
      },
    },
  });

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const getQuestions = () => {
  const saved = read(QUESTION_KEY, null);

  if (saved) {
    return saved;
  }

  write(QUESTION_KEY, defaultQuestions);
  return clone(defaultQuestions);
};

const requireUser = () => {
  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  return user && token ? user : null;
};

const requireAdmin = () => {
  const user = requireUser();
  return user?.role === 'admin' ? user : null;
};

const questionPayload = (data) => ({
  text: String(data.text || '').trim(),
  options: Array.isArray(data.options)
    ? data.options.map((option) => String(option).trim()).slice(0, 4)
    : [],
  correctIndex: Number(data.correctIndex),
  timeLimit: Math.min(120, Math.max(5, Number(data.timeLimit) || 30)),
  isActive: data.isActive !== false,
});

const validateQuestion = (question) => {
  if (!question.text) {
    return 'Question text is required';
  }

  if (
    question.options.length !== 4 ||
    question.options.some((option) => !option)
  ) {
    return 'Four options are required';
  }

  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex > 3
  ) {
    return 'Correct answer must be between 0 and 3';
  }

  return null;
};

/* GET */

const get = (url) => {
  if (url === '/auth/me') {
    const user = requireUser();

    return user
      ? ok({ user })
      : fail('Authentication required', 401);
  }

  if (url === '/quiz/questions') {
    const questions = getQuestions()
      .filter((question) => question.isActive)
      .slice(0, 8)
      .map(({ correctIndex, ...question }) => question);

    return ok({ questions });
  }

  if (url === '/quiz/history') {
    const user = requireUser();

    if (!user) {
      return fail('Authentication required', 401);
    }

    const history = read(ATTEMPT_KEY, [])
      .filter((attempt) => attempt.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.completedAt) -
          new Date(a.completedAt)
      );

    return ok({ history });
  }

  if (url === '/quiz/leaderboard') {
    const attempts = read(ATTEMPT_KEY, []);
    const players = {};

    attempts.forEach((attempt) => {
      const current = players[attempt.username] || {
        username: attempt.username,
        bestScore: 0,
        attempts: 0,
      };

      current.bestScore = Math.max(
        current.bestScore,
        attempt.totalScore
      );

      current.attempts += 1;
      players[attempt.username] = current;
    });

    const leaderboard = [
      {
        username: 'quiz_master',
        bestScore: 7.75,
        attempts: 4,
      },
      {
        username: 'fast_player',
        bestScore: 7.42,
        attempts: 3,
      },
      ...Object.values(players),
    ]
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 20);

    return ok({ leaderboard });
  }

  if (url === '/admin/questions') {
    if (!requireAdmin()) {
      return fail('Admin access required', 403);
    }

    return ok({
      questions: getQuestions(),
    });
  }

  return fail(`Unknown demo endpoint: GET ${url}`, 404);
};

/* POST */

const post = (url, data = {}) => {
  if (url === '/auth/login') {
    const registeredUsers = read(USER_KEY, []);
    const users = [...defaultUsers, ...registeredUsers];

    const account = users.find(
      (user) =>
        user.email.toLowerCase() ===
        String(data.email || '').trim().toLowerCase() &&
        user.password === String(data.password || '')
    );

    if (!account) {
      return fail('Invalid email or password', 401);
    }

    const user = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
    };

    return ok({
      token: `demo-token-${account.id}`,
      user,
    });
  }

  if (url === '/auth/register') {
    const users = read(USER_KEY, []);

    const email = String(data.email || '')
      .trim()
      .toLowerCase();

    if (
      [...defaultUsers, ...users].some(
        (user) => user.email.toLowerCase() === email
      )
    ) {
      return fail('Email is already registered');
    }

    const account = {
      id: `user-${Date.now()}`,
      username: String(data.username || '').trim(),
      email,
      password: String(data.password || ''),
      role: 'user',
    };

    users.push(account);
    write(USER_KEY, users);

    const user = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
    };

    return ok(
      {
        token: `demo-token-${account.id}`,
        user,
      },
      201
    );
  }

  if (url === '/quiz/submit') {
    const user = requireUser();

    if (!user) {
      return fail('Authentication required', 401);
    }

    const answers = Array.isArray(data.answers)
      ? data.answers
      : [];

    const questionMap = new Map(
      getQuestions().map((question) => [
        question._id,
        question,
      ])
    );

    let score = 0;
    let bonusTotal = 0;

    const processedAnswers = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        return null;
      }

      const timeRemaining = Math.max(
        0,
        Math.min(
          Number(answer.timeRemaining) || 0,
          question.timeLimit
        )
      );

      const selectedAnswer = Number(answer.selectedAnswer);

      const isCorrect =
        selectedAnswer === question.correctIndex;

      if (isCorrect) {
        score += 1;
        bonusTotal += timeRemaining / question.timeLimit;
      }

      return {
        questionId: clone(question),
        selectedAnswer,
        timeRemaining,
        isCorrect,
      };
    }).filter(Boolean);

    const bonusPoints = Number(
      Math.min(
        1,
        bonusTotal / Math.max(answers.length, 1)
      ).toFixed(2)
    );

    const totalScore = Number(
      (score + bonusPoints).toFixed(2)
    );

    const review = processedAnswers.map((answer) => ({
      questionId: answer.questionId._id,
      text: answer.questionId.text,
      options: answer.questionId.options,
      correctIndex: answer.questionId.correctIndex,
      selectedAnswer: answer.selectedAnswer,
      timeRemaining: answer.timeRemaining,
      isCorrect: answer.isCorrect,
    }));

    const attempt = {
      _id: `attempt-${Date.now()}`,
      userId: user.id,
      username: user.username,
      score,
      bonusPoints,
      totalScore,
      answers: processedAnswers,
      completedAt: new Date().toISOString(),
    };

    const attempts = read(ATTEMPT_KEY, []);
    attempts.push(attempt);
    write(ATTEMPT_KEY, attempts);

    return ok(
      {
        score,
        bonusPoints,
        totalScore,
        scoreId: attempt._id,
        review,
      },
      201
    );
  }

  if (url === '/admin/questions') {
    if (!requireAdmin()) {
      return fail('Admin access required', 403);
    }

    const question = questionPayload(data);
    const error = validateQuestion(question);

    if (error) {
      return fail(error);
    }

    const questions = getQuestions();

    const createdQuestion = {
      ...question,
      _id: `q-${Date.now()}`,
    };

    questions.unshift(createdQuestion);
    write(QUESTION_KEY, questions);

    return ok(
      {
        question: createdQuestion,
      },
      201
    );
  }

  if (url === '/admin/questions/bulk-import') {
    if (!requireAdmin()) {
      return fail('Admin access required', 403);
    }

    if (!Array.isArray(data.questions)) {
      return fail('A JSON array is required');
    }

    const questions = getQuestions();
    const existingTexts = new Set(
      questions.map((question) =>
        question.text.toLowerCase()
      )
    );

    let imported = 0;
    let skipped = 0;

    data.questions.forEach((item) => {
      const question = questionPayload(item);
      const error = validateQuestion(question);
      const key = question.text.toLowerCase();

      if (error || existingTexts.has(key)) {
        skipped += 1;
        return;
      }

      existingTexts.add(key);

      questions.unshift({
        ...question,
        _id: `q-${Date.now()}-${imported}`,
      });

      imported += 1;
    });

    write(QUESTION_KEY, questions);

    return ok(
      {
        imported,
        skipped,
        skippedReason: 'invalid or duplicate questions',
      },
      201
    );
  }

  return fail(`Unknown demo endpoint: POST ${url}`, 404);
};

/* PUT */

const put = (url, data = {}) => {
  const match = url.match(
    /^\/admin\/questions\/([^/]+)$/
  );

  if (!match) {
    return fail(`Unknown demo endpoint: PUT ${url}`, 404);
  }

  if (!requireAdmin()) {
    return fail('Admin access required', 403);
  }

  const questions = getQuestions();
  const index = questions.findIndex(
    (question) => question._id === match[1]
  );

  if (index === -1) {
    return fail('Question not found', 404);
  }

  const updatedQuestion = questionPayload(data);
  const error = validateQuestion(updatedQuestion);

  if (error) {
    return fail(error);
  }

  questions[index] = {
    ...questions[index],
    ...updatedQuestion,
  };

  write(QUESTION_KEY, questions);

  return ok({
    question: questions[index],
  });
};

/* PATCH */

const patch = (url) => {
  const match = url.match(
    /^\/admin\/questions\/([^/]+)\/toggle$/
  );

  if (!match) {
    return fail(`Unknown demo endpoint: PATCH ${url}`, 404);
  }

  if (!requireAdmin()) {
    return fail('Admin access required', 403);
  }

  const questions = getQuestions();
  const question = questions.find(
    (item) => item._id === match[1]
  );

  if (!question) {
    return fail('Question not found', 404);
  }

  question.isActive = !question.isActive;
  write(QUESTION_KEY, questions);

  return ok({ question });
};

/* DELETE */

const remove = (url) => {
  const match = url.match(
    /^\/admin\/questions\/([^/]+)$/
  );

  if (!match) {
    return fail(`Unknown demo endpoint: DELETE ${url}`, 404);
  }

  if (!requireAdmin()) {
    return fail('Admin access required', 403);
  }

  const questions = getQuestions();
  const remainingQuestions = questions.filter(
    (question) => question._id !== match[1]
  );

  if (remainingQuestions.length === questions.length) {
    return fail('Question not found', 404);
  }

  write(QUESTION_KEY, remainingQuestions);

  return ok({
    message: 'Question deleted',
  });
};

const demoApi = {
  get,
  post,
  put,
  patch,
  delete: remove,
};

export default demoApi;