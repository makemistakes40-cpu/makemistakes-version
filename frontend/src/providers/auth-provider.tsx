'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'RECRUITER' | 'ADMIN';
  subscriptionTier: 'FREE' | 'PRO';
  hasCompletedProOnboarding?: boolean;
  xpPoints?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const response = await api.get<{ status: string; user: User }>('/auth/me');
      if (response.status === 'success' && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Access token may have expired, try rotating/refreshing using the refresh token cookie
      try {
        const refreshResponse = await api.post<{ status: string; user: User }>('/auth/refresh');
        if (refreshResponse.status === 'success' && refreshResponse.user) {
          setUser(refreshResponse.user);
        } else {
          setUser(null);
        }
      } catch (refreshErr) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Protected paths and redirect triggers
  useEffect(() => {
    if (!isLoading) {
      const isProtectedRoute = pathname.startsWith('/dashboard');
      const isAuthRoute = pathname === '/login' || pathname === '/signup';

      if (isProtectedRoute && !user) {
        router.push('/login');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ status: string; user: User }>('/auth/login', data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ status: string; user: User }>('/auth/register', data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('API logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
