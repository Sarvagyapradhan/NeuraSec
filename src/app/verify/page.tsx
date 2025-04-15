"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { setCookie } from "cookies-next";
import { useAuth } from "@/components/AuthProvider";

export default function VerifyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const { setAuthToken } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    // Get email from session storage
    const email = sessionStorage.getItem("verificationEmail");
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
    } else {
      // Redirect to login if no email in session
      router.push("/login");
    }
  }, [router]);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Determine the verification endpoint based on mode
      const endpoint = mode === "register" 
        ? "/api/auth/verify-registration" 
        : "/api/auth/verify-login";
      
      // Add console logs for debugging
      console.log(`Sending OTP verification to ${endpoint}`, {
        email: formData.email,
        otp: formData.otp
      });
      
      const response = await axios.post(endpoint, {
        email: formData.email,
        otp: formData.otp,
      });
      
      console.log("Verification response:", response.data);
      
      if (response.data?.access_token) {
        // Store the JWT token using the context's setAuthToken
        setAuthToken(response.data.access_token);
        
        toast({
          title: mode === "register" ? "Registration complete" : "Login successful",
          description: "You have been authenticated successfully",
        });
        
        // Clear verification email from session
        sessionStorage.removeItem("verificationEmail");
        
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: error.response?.data?.detail || "Invalid or expired OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      
      console.log("Resending OTP for email:", formData.email);
      
      const response = await axios.post("/api/auth/resend-otp", {
        email: formData.email,
      });
      
      console.log("Resend OTP response:", response.data);
      
      if (response.data) {
        toast({
          title: "OTP resent",
          description: "Please check your email for the new verification code",
        });
        
        // Set countdown for 30 seconds
        setCountdown(30);
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Failed to resend OTP",
        description: error.response?.data?.detail || "Too many requests. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify your account</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email {formData.email ? `(${formData.email})` : ""}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                name="otp"
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={formData.otp}
                onChange={handleChange}
              />
            </div>
            
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Didn&apos;t receive a code?</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
            >
              {countdown > 0
                ? `Resend OTP (${countdown}s)`
                : resendLoading
                ? "Sending..."
                : "Resend OTP"}
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => router.push(mode === "register" ? "/register" : "/login")}
          >
            Go back to {mode === "register" ? "registration" : "login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 