"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  token: null,
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Refresh auth function to be called when needed
  const refreshAuth = async () => {
    try {
      setLoading(true);
      console.log("[AuthProvider] Refreshing authentication state");
      
      // First try to get from cookie (set by server, more secure)
      let authToken = getCookie("auth_token") as string | undefined;
      
      // Log the token source and status
      if (authToken) {
        console.log("[AuthProvider] Found token in cookie");
      }
      
      // If not in cookie, try localStorage (for client-side login)
      if (!authToken) {
        authToken = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
        
        if (authToken) {
          console.log("[AuthProvider] Found token in localStorage");
          
          // If found in localStorage but not in cookie, sync them
          console.log("[AuthProvider] Syncing localStorage token to cookie");
          setCookie("auth_token", authToken, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: false, // Allow JS access for our auth provider
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
          });
        }
      }
      
      if (authToken) {
        console.log("[AuthProvider] Setting up authorization header");
        setToken(authToken);
        
        // Configure axios with auth header
        axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
        
        try {
          // First check if token is valid
          console.log("[AuthProvider] Checking token validity");
          const checkResponse = await fetch(`/api/auth/check-token?token=${encodeURIComponent(authToken)}`, {
            headers: {
              "Authorization": `Bearer ${authToken}`
            }
          });
          
          const checkResult = await checkResponse.json();
          
          if (!checkResponse.ok || !checkResult.valid) {
            console.error("[AuthProvider] Token validation failed:", checkResult);
            throw new Error(`Token validation failed: ${checkResult.reason || "Invalid token"}`);
          }
          
          // If token is valid and we have user data, use it
          if (checkResult.user) {
            console.log("[AuthProvider] Setting user from token validation");
            setUser(checkResult.user);
            return; // Exit early since we have the user data
          }
          
          // If no user in check result, fetch user profile
          console.log("[AuthProvider] Fetching user profile");
          const response = await fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${authToken}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
          }
          
          const userData = await response.json();
          console.log("[AuthProvider] User profile fetched successfully");
          setUser(userData);
        } catch (profileError) {
          console.error("[AuthProvider] Failed to fetch user profile:", profileError);
          
          // Clear invalid auth data
          localStorage.removeItem("auth_token");
          deleteCookie("auth_token");
          setToken(null);
          setUser(null);
          
          // Redirect to login if we're on a protected page
          if (typeof window !== 'undefined' && 
              (window.location.pathname.startsWith('/dashboard') || 
               window.location.pathname.startsWith('/admin'))) {
            router.push('/login');
          }
        }
      } else {
        console.log("[AuthProvider] No auth token found");
        // Ensure user and token state are cleared
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("[AuthProvider] Auth refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is logged in on component mount
  useEffect(() => {
    refreshAuth();
    
    // Add event listener to refresh auth on storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log("[AuthProvider] Auth token changed in another tab, refreshing");
        refreshAuth();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      console.log("[AuthProvider] Attempting login with:", emailOrUsername);
      
      const response = await axios.post("/api/auth/login", {
        emailOrUsername,
        password,
      });
      
      console.log("[AuthProvider] Login response received:", response.status);

      // Extract token and user data from response
      const { token, user } = response.data;

      if (!token) {
        console.error("[AuthProvider] No token received in login response");
        throw new Error("Authentication failed - no token received");
      }

      // Store token in localStorage for persistence
      localStorage.setItem("auth_token", token);
      console.log("[AuthProvider] Token stored in localStorage");
      
      // Also ensure cookie is set
      setCookie("auth_token", token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Allow JS access
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
      });
      console.log("[AuthProvider] Token stored in cookie");

      // Update state
      setToken(token);
      
      // Set user data if available
      if (user) {
        setUser(user);
        console.log("[AuthProvider] User data set:", user.email);
      }

      // Configure axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("[AuthProvider] Set axios default Authorization header");

      console.log("[AuthProvider] Login successful, user authenticated");
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Wait just a moment before redirecting to ensure all state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to dashboard
      console.log("[AuthProvider] Redirecting to dashboard...");
      router.push("/dashboard");
      
      return;
    } catch (error: any) {
      console.error("[AuthProvider] Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("[AuthProvider] Logging out...");
    
    // Clear auth data
    localStorage.removeItem("auth_token");
    deleteCookie("auth_token");
    setToken(null);
    setUser(null);
    
    // Clear Authorization header
    delete axios.defaults.headers.common["Authorization"];

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });

    // Redirect to login
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        token,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 