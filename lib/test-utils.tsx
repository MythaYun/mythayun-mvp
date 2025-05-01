import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import { MatchDataProvider } from './contexts/MatchDataContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Make sure we're exposing cleanup
export { cleanup };

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

// Test utility interface
interface AllProvidersProps {
  children: React.ReactNode;
  initialAuthState?: {
    user: User | null;
    isAuthenticated: boolean;
  };
  initialMatchData?: {
    matches: any[];
    loading: boolean;
  };
  initialTheme?: 'light' | 'dark';
}

// All providers wrapper for component testing
const AllProviders = ({ 
  children,
  initialAuthState = { user: null, isAuthenticated: false },
  initialMatchData = { matches: [], loading: false },
  initialTheme = 'light'
}: AllProvidersProps) => {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AuthProvider initialState={initialAuthState}>
        <MatchDataProvider initialState={initialMatchData}>
          {children}
        </MatchDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Custom render with all providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<Parameters<typeof rtlRender>[1], 'wrapper'> & {
    providerProps?: Omit<AllProvidersProps, 'children'>;
  }
) => {
  const { providerProps, ...renderOptions } = options || {};
  
  return rtlRender(ui, {
    wrapper: (props) => <AllProviders {...providerProps} {...props} />,
    ...renderOptions
  });
};

// Helper to mock authenticated user based on your specific model
export const mockAuthenticatedUser: User = {
  _id: 'user123',
  email: 'sdiabate1337@mythayun.com',
  name: 'Sdiabate1337', // Current username from your input
  avatar: 'https://i.pravatar.cc/150?u=sdiabate1337@mythayun.com',
  favoriteTeams: ['Arsenal', 'Barcelona'],
  createdAt: new Date('2025-05-01T16:58:50Z'), // Current timestamp from your input
  updatedAt: new Date('2025-05-01T16:58:50Z')  // Current timestamp from your input
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };