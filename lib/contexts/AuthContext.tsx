import React, { createContext, useContext, useState, ReactNode } from 'react';

// User interface based on your model
interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  favoriteTeams: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
  initialState?: {
    user: User | null;
    isAuthenticated: boolean;
  };
}

// Create the context with undefined as default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialState?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState?.isAuthenticated || false);

  const login = async (email: string, password: string) => {
    // Mock login implementation
    const mockUser: User = {
      _id: 'user123',
      email: email,
      name: 'Sdiabate1337',
      avatar: 'https://i.pravatar.cc/150',
      favoriteTeams: ['Arsenal', 'Barcelona'],
      createdAt: new Date('2025-05-01T16:05:33Z'),
      updatedAt: new Date('2025-05-01T16:05:33Z')
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Make sure there's a default export or named exports
export default AuthContext;