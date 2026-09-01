import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  currentUser: any | null;
  userData: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (roles: Role[]) => boolean;
  loginMock: (role?: Role) => void;
  logoutMock: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  hasRole: () => false,
  loginMock: () => {},
  logoutMock: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock session
    const mockSession = localStorage.getItem('mock_auth_session');
    if (mockSession) {
      try {
        const parsed = JSON.parse(mockSession);
        setCurrentUser({ uid: parsed.id, email: parsed.email });
        setUserData(parsed);
      } catch(e) {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  const loginMock = (role: Role = 'SUPER_ADMIN') => {
    const mockData: User = {
      id: 'mock-user-123',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      role: role,
      staffId: 'DEMO-001',
      department: 'Administration',
      phone: '555-0192',
      status: 'ACTIVE',
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    localStorage.setItem('mock_auth_session', JSON.stringify(mockData));
    setCurrentUser({ uid: mockData.id, email: mockData.email });
    setUserData(mockData);
  };

  const logoutMock = () => {
    localStorage.removeItem('mock_auth_session');
    setCurrentUser(null);
    setUserData(null);
  };

  const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || userData?.role === 'ADMIN';

  const hasRole = (roles: Role[]) => {
    if (!userData) return false;
    if (userData.role === 'SUPER_ADMIN') return true;
    return roles.includes(userData.role);
  };

  const value = {
    currentUser,
    userData,
    loading,
    isSuperAdmin,
    isAdmin,
    hasRole,
    loginMock,
    logoutMock
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
