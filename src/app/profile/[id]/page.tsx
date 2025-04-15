"use client";

import { Shield, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const profileId = typeof params.id === 'string' ? params.id : params.id?.[0];
  
  // Check if this is the current user's profile
  const isOwnProfile = user?.id.toString() === profileId;
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white">Loading profile...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BackgroundGradient className="rounded-[22px] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name || user.email}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Shield className="w-12 h-12 text-white" />
              )}
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-black flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{user.full_name || 'User Profile'}</h1>
            <p className="text-zinc-400 text-sm">{user.email}</p>
            {user.role && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                {user.role.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </BackgroundGradient>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Email</h3>
          <p className="text-xl text-primary">{user.email}</p>
        </Card>
        <Card className="bg-zinc-900/50 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Account ID</h3>
          <p className="text-xl text-primary">{user.id}</p>
        </Card>
        <Card className="bg-zinc-900/50 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Role</h3>
          <p className="text-xl text-primary">{user.role || 'User'}</p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
        <Card className="bg-zinc-900/50 rounded-lg p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Full Name</h3>
              <p className="text-lg text-zinc-400">{user.full_name || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Email Verified</h3>
              <p className="text-lg text-green-500">Verified</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Created At</h3>
              <p className="text-lg text-zinc-400">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Last Login</h3>
              <p className="text-lg text-zinc-400">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 