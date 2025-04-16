"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useAuth } from "@/components/AuthProvider";
import { setCookie } from "cookies-next";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the login function from AuthProvider
      await login(formData.username, formData.password);
      
      // If login is successful, AuthProvider handles redirection via its own logic
      // No need for manual redirection here unless AuthProvider's redirection fails
      toast({
        title: "Login successful",
        description: "Welcome back! You should be redirected shortly...",
      });

    } catch (error: any) {
      console.error("Login page submission error:", error);

      let userMessage = "An unexpected error occurred during login.";

      // Check if the error is an Axios error with a response
      if (axios.isAxiosError(error) && error.response) {
        // If it's a 401 Unauthorized error, show the specific message
        if (error.response.status === 401) {
          userMessage = "Incorrect username or password. Please try again.";
        } else {
          // For other server errors, try to get a detail message or use a generic one
          userMessage = error.response.data?.detail || 
                        `Login failed with status: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        // Handle non-Axios errors (e.g., network issues, AuthProvider internal errors)
        userMessage = error.message || userMessage; 
      }
      
      toast({
        title: "Login Failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <AnimatedBackground className="fixed inset-0" />
      <Card className="w-full max-w-md relative z-10 bg-slate-900/60 backdrop-blur-xl border-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-100">Welcome back</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-200">Username or Email</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  placeholder="username or email"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:text-blue-400">
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 