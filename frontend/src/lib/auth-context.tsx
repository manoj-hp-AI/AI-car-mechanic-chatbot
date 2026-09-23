'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from './api';
import { Role, UserProfile } from './types';

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isLoading: boolean;
  loginCustomer: (username: string, password: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authModalOpen: boolean;
  authModalTab: 'customer-login' | 'customer-register' | 'admin-login';
  openAuthModal: (tab?: 'customer-login' | 'customer-register' | 'admin-login') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer-login' | 'customer-register' | 'admin-login'>('customer-login');

  const refreshUser = async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.getMe();
      setUser(profile);
      setRole(profile.role);
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginCustomer = async (username: string, password: string) => {
    const data = await api.loginCustomer({ username, password });
    tokenStorage.setTokens(data.access, data.refresh);
    setRole('CUSTOMER');
    await refreshUser();
    setAuthModalOpen(false);
  };

  const loginAdmin = async (username: string, password: string) => {
    const data = await api.loginAdmin({ username, password });
    tokenStorage.setTokens(data.access, data.refresh);
    setRole('ADMIN');
    await refreshUser();
    setAuthModalOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.location.href = '/admin';
    }
  };

  const register = async (formData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }) => {
    await api.register(formData);
    // After registration, auto-login customer
    await loginCustomer(formData.username, formData.password);
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setUser(null);
    setRole(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const openAuthModal = (tab: 'customer-login' | 'customer-register' | 'admin-login' = 'customer-login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginCustomer,
        loginAdmin,
        register,
        logout,
        refreshUser,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
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
