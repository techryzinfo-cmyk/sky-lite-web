'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api.client';
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
    const savedSuperAdmin = localStorage.getItem('superAdmin');
    const token = Cookies.get('token') || localStorage.getItem('token');
    const saToken = Cookies.get('saToken') || localStorage.getItem('saToken');
    
    let isTokenExpired = false;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            isTokenExpired = true;
          }
        }
      } catch (e) {
        console.error('Failed to parse token expiration', e);
      }
    }

    if (isTokenExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('saToken');
      localStorage.removeItem('superAdmin');
      Cookies.remove('token');
      Cookies.remove('saToken');
      setUser(null);
      router.push('/login');
    } else if (
  savedUser &&
  savedUser !== 'undefined' &&
  savedUser !== 'null' &&
  token
) {
  try {
    setUser(JSON.parse(savedUser));
  } catch {
    localStorage.removeItem('user');
  }
}else if (
  savedSuperAdmin &&
  savedSuperAdmin !== 'undefined' &&
  savedSuperAdmin !== 'null' &&
  saToken
) {
  try {
    setUser(JSON.parse(savedSuperAdmin));
  } catch {
    localStorage.removeItem('superAdmin');
  }
}
    setLoading(false);
  }, []);

  // const login = async (credentials: any) => {
  //   try {
  //     const response = await api.post('/auth/login', credentials);
  //     const { token, refreshToken, user: userData } = response.data;
      
  //     localStorage.setItem('token', token);
  //     localStorage.setItem('refreshToken', refreshToken);
  //     localStorage.setItem('user', JSON.stringify(userData));
      
  //     // Set cookie for middleware
  //     Cookies.set('token', token, { expires: 7 }); // 7 days
      
  //     setUser(userData);
  //     router.push('/dashboard');
  //   } catch (error) {
  //     throw error;
  //   }
  // };


  const login = async (credentials: any) => {
  try {
    // First try normal Admin/Member login
    const response = await api.post('/auth/login', credentials);

    const { token, refreshToken, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));

    Cookies.set('token', token, { expires: 7 });

    setUser(userData);

    router.push('/dashboard');
  } catch (error: any) {

    // If normal login fails, try SuperAdmin login
    if (error?.response?.status === 401) {

      try {
        const saRes = await api.post('/superadmin/auth/login', credentials);

        const { saToken, superAdmin } = saRes.data;

        localStorage.setItem('saToken', saToken);
        localStorage.setItem('superAdmin', JSON.stringify(superAdmin));

        Cookies.set('saToken', saToken, { expires: 7 });

        router.push('/superadmin/dashboard');

        return;
      } catch (saError) {
        throw saError;
      }
    }

    throw error;
  }
};




  const register = async (data: any) => {
    try {
      await api.post('/auth/register', data);
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
