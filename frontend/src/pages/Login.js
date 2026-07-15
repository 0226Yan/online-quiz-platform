import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import DarkModeToggle from '../components/DarkModeToggle';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { token, user } = res.data.data;

      localStorage.removeItem('adminSession');

      if (user.role === 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setServerError('Admin accounts must use the admin login page');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-container">
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div className="flex-between mb-2">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🧠 QuizGame</h1>
          <DarkModeToggle />
        </div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••" {...register('password')} />
            {errors.password && <p className="error-msg">{errors.password.message}</p>}
          </div>

          {serverError && <p className="error-msg mb-2">{serverError}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register">Register</Link>
        </p>
        <p className="text-center mt-1" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Admin user? <Link to="/admin/login">Admin login</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
