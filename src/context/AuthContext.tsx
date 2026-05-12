'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (updatedFields?: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, refreshToken, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set cookie for middleware
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      setUser(userData);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/auth/register', data);
      // Backend register doesn't return tokens, so user needs to login
      router.push('/login?registered=true');
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = (updatedFields?: Partial<User>) => {
    if (updatedFields) {
      const merged = { ...user, ...updatedFields } as User;
      localStorage.setItem('user', JSON.stringify(merged));
      setUser(merged);
    } else {
      const saved = localStorage.getItem('user');
      if (saved) setUser(JSON.parse(saved));
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // fire-and-forget — clear client state regardless
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
