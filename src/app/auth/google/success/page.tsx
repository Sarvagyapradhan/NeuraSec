"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      // Store the JWT token
      localStorage.setItem("auth_token", token);
      
      toast({
        title: "Login successful",
        description: "You have been authenticated with Google successfully",
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      toast({
        title: "Authentication failed",
        description: "Could not retrieve authentication token",
        variant: "destructive",
      });
      
      // Redirect to login
      router.push("/login");
    }
  }, [router, searchParams, toast]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we complete your sign in</p>
      </div>
    </div>
  );
} 