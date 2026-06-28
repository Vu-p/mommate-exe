import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { isAdminApp } from '../config/appMode';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  token: string;
  phoneNumber?: string;
  avatar?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  identityNumber?: string;
  identityName?: string;
  identityIssuedAt?: string;
  identityImages?: string[];
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isPublicAuthPage = () => {
  if (typeof window === 'undefined') return false;
  return ['/login', '/auth', '/signup'].includes(window.location.pathname);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (isAdminApp && parsed.role !== 'admin') {
          // Ignore non-admin in admin app
        } else if (!isAdminApp && parsed.role === 'admin') {
          // Ignore admin in user app
        } else {
          setUser(parsed);
        }
      } catch (e) {
        // Ignored
      }
    }
    if (!userInfo && !isPublicAuthPage()) {
      api.post('/auth/refresh').then(({ data }) => {
        if (isAdminApp && data.role !== 'admin') {
          setLoading(false);
          return;
        }
        if (!isAdminApp && data.role === 'admin') {
          setLoading(false);
          return;
        }
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      }).catch(() => undefined).finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...userData };
      localStorage.setItem('userInfo', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    void api.post('/auth/logout').catch(() => undefined);
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
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
