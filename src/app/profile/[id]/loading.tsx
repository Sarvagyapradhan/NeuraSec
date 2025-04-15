"use client";

import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-10">
      <div className="container mx-auto px-4">
        {/* Profile Header Loading State */}
        <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="text-center md:text-left">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </BackgroundGradient>

        {/* Stats Grid Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Activity Loading State */}
        <div className="mt-8">
          <div className="bg-zinc-900 rounded-2xl p-8">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full max-w-[200px] mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 