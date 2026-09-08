'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (token) {
          const response = await apiClient.getMe();
          if (active && response.success) {
            setUser(response.data);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeAuth();
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await apiClient.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await apiClient.register(userData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    apiClient.logout().catch((logoutError) => {
      console.error('Logout request failed:', logoutError);
    });

    // Clear local access immediately even if the API is unavailable.
    setUser(null);
    apiClient.setToken(null);

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'administrator',
    isOwner: user?.role === 'owner',
    isManager: user?.role === 'manager',
    isTenant: user?.role === 'tenant',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
