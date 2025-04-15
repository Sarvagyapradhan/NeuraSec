"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { setCookie, deleteCookie } from "cookies-next";

interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string, useOtp?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  setAuthToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  token: null,
  setAuthToken: () => {},
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

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        console.log("Authentication check - token exists:", !!storedToken);
        
        if (storedToken) {
          setToken(storedToken);
          
          // Configure axios with auth header
          axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          console.log("Set Authorization header for API requests");
          
          try {
            // Fetch user profile
            console.log("Fetching user profile from API...");
            const response = await axios.get("/api/auth/me");
            console.log("User profile received:", response.data?.email);
            
            // Set user data
            setUser(response.data);
            
            // Set cookie for server-side auth checks
            setCookie("auth_token", storedToken, { 
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
              sameSite: "strict",
              secure: process.env.NODE_ENV === "production"
            });
            
            console.log("Authentication successful, user state updated");
          } catch (error) {
            console.error("Authentication error - Failed to fetch user profile:", error);
            // Clear invalid auth data
            localStorage.removeItem("auth_token");
            deleteCookie("auth_token");
            setToken(null);
          }
        } else {
          console.log("No authentication token found in localStorage");
        }
      } catch (error) {
        console.error("Unexpected authentication error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function with option for OTP or direct login
  const login = async (emailOrUsername: string, password: string, useOtp = false) => {
    try {
      setLoading(true);
      
      if (useOtp) {
        // Original OTP-based login flow
        // Create form data for OAuth2
        const formData = new FormData();
        formData.append("username", emailOrUsername);
        formData.append("password", password);
        
        const response = await axios.post("/api/auth/login", formData);
        
        if (response.data) {
          toast({
            title: "Login initiated",
            description: "Please check your email for the verification code",
          });
          
          // Store email in session storage for verify page
          sessionStorage.setItem("verificationEmail", emailOrUsername);
          
          // Redirect to verify page
          router.push("/verify?mode=login");
        }
      } else {
        // Direct login without OTP
        // Ensure properly encoded form data
        const data = `username=${encodeURIComponent(emailOrUsername)}&password=${encodeURIComponent(password)}`;
        
        const response = await axios.post("/api/auth/direct-login", data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (response.data?.access_token) {
          // Store the JWT token
          setAuthToken(response.data.access_token);
          
          // Fetch user data if not included in response
          if (!response.data.user) {
            const userResponse = await axios.get("/api/auth/me");
            setUser(userResponse.data);
          } else {
            setUser(response.data.user);
          }
          
          toast({
            title: "Login successful",
            description: "You have been logged in successfully",
          });
          
          // Use window.location for a hard refresh to ensure auth state is updated
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update token when authentication is successful
  const setAuthToken = (newToken: string) => {
    // Save token to localStorage
    localStorage.setItem("auth_token", newToken);
    
    // Save token to cookie for server-side checks
    setCookie("auth_token", newToken, { 
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Update state
    setToken(newToken);
    
    // Set default authorization header
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    deleteCookie("auth_token");
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common["Authorization"];
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    
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
        setAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 