"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth as useMockAuth } from "@/lib/mock-auth";
import { Loader2 } from "lucide-react";

// Choose between real and mock auth based on environment
const useAuth = process.env.NEXT_PUBLIC_IS_DEVELOPMENT === 'true' ? useMockAuth : useClerkAuth;

export default function ProfileRedirect() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      router.push(`/profile/${userId}`);
    }
  }, [userId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto" />
        <div className="text-xl font-medium text-slate-100">Loading profile...</div>
        <p className="text-sm text-slate-400">Redirecting to your personal profile</p>
      </div>
    </div>
  );
} 