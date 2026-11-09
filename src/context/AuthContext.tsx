import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  CONFIGURED_OWNER_EMAIL,
  type User,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  configuredOwnerEmail: string;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setAuthError(null);
    });

    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(
    user &&
    user.email &&
    user.email.toLowerCase() === CONFIGURED_OWNER_EMAIL.toLowerCase()
  );

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Échec de la connexion via Google.';
      setAuthError(message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Logout failed:', err);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOwner,
        configuredOwnerEmail: CONFIGURED_OWNER_EMAIL,
        authError,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
