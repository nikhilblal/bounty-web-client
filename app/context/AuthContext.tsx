'use client';

import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  error: undefined 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, loading, error] = useAuthState(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};