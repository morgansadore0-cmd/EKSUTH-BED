import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, Role } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  hasRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
