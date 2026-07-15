import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import DarkModeToggle from '../components/DarkModeToggle';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const Register = () => {
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
      const res = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      const { token, user } = res.data.data;
      localStorage.removeItem('adminSession');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-container">
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div className="flex-between mb-2">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🧠 QuizGame</h1>
          <DarkModeToggle />
        </div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Create your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="coolplayer42" {...register('username')} />
            {errors.username && <p className="error-msg">{errors.username.message}</p>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters" {...register('password')} />
            {errors.password && <p className="error-msg">{errors.password.message}</p>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="Repeat password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <p className="error-msg mb-2">{serverError}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
