import React, { createContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { getSessionToken, setSessionToken } from '../services/api';

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    const started = revision.current;
    setSessionToken(getSessionToken());
    const expire = () => { revision.current++; setUser(null); setLoading(false); };
    window.addEventListener('qissaghar:session-expired', expire);
    authService.getMe().then((data) => {
      if (active && started === revision.current) setUser(data.user || null);
    }).catch(() => {
      if (active && started === revision.current) setUser(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.removeEventListener('qissaghar:session-expired', expire);
    };
  }, []);
  const authenticate = async (method, credentials) => {
    revision.current++;
    setError(null);
    try {
      const data = await authService[method](credentials);
      if (!data.success || !data.user) throw new Error('Unable to start your session.');
      setSessionToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to sign in. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };
  const logout = async () => {
    try {
      await authService.logout();
      revision.current++;
      setSessionToken(null);
      setUser(null);
      return true;
    } catch {
      toast.error('Sign out could not finish. Please reconnect and try again.');
      return false;
    }
  };
  return <AuthContext.Provider value={{
    user, token: getSessionToken(), isAuthenticated: Boolean(user), isAdmin: user?.role === 'admin',
    loading, error, login: (data) => authenticate('login', data),
    register: (data) => authenticate('register', data), logout,
    updateProfile: (data) => setUser((previous) => ({ ...previous, ...data }))
  }}>{children}</AuthContext.Provider>;
};
