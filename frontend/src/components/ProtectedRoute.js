import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../api/api';

const ProtectedRoute = ({ adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const adminSession = localStorage.getItem('adminSession') === 'true';
  const [status, setStatus] = useState(token ? 'checking' : 'unauthenticated');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!token) {
        setStatus('unauthenticated');
        setUser(null);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const currentUser = res.data.data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        if (isMounted) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminSession');
        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'checking') {
    return null;
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !adminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
