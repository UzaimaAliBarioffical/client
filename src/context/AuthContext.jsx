import React, { createContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: JSON.parse(localStorage.getItem('user'))?.role === 'admin',
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token || state.token,
        isAuthenticated: true,
        isAdmin: action.payload.user?.role === 'admin',
        loading: false,
        error: null
      };

    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: action.payload
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify auth session on initial load
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: data.user }
          });
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          dispatch({ type: 'AUTH_FAIL', payload: null });
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        dispatch({ type: 'AUTH_FAIL', payload: null });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };

    verifyUser();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await authService.login(credentials);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.token }
      });
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      dispatch({ type: 'AUTH_FAIL', payload: msg });
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await authService.register(userData);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.token }
      });
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAIL', payload: msg });
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
