'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Mock authentication context
interface MockAuthContextProps {
  userId: string;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
}

const defaultAuthContext: MockAuthContextProps = {
  userId: 'mock-user-id',
  isLoaded: true,
  isSignedIn: true,
  getToken: async () => 'mock-token',
  signOut: async () => {},
};

const MockAuthContext = createContext<MockAuthContextProps>(defaultAuthContext);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  return (
    <MockAuthContext.Provider value={defaultAuthContext}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Mock for useAuth hook
export function useAuth() {
  return {
    userId: 'mock-user-id',
    isLoaded: true,
    isSignedIn: true,
    getToken: async () => 'mock-token',
    signOut: async () => {},
    sessionId: 'mock-session-id',
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    orgPermissions: [],
  };
}

// Mock for UserButton component
export function UserButton() {
  return (
    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
      <span>U</span>
    </div>
  );
}

// Export other mock components as needed
export function SignIn() {
  return <div>Sign In</div>;
}

export function SignUp() {
  return <div>Sign Up</div>;
} 