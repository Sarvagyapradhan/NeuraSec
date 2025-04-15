"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gift, ShieldCheck, Medal, Trophy, Star, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimatedBackground } from "@/components/ui/animated-background";

const rewards = [
  {
    id: 1,
    title: "Security Champion",
    description: "Complete 10 security scans",
    progress: 7,
    total: 10,
    icon: ShieldCheck,
    reward: "500 points"
  },
  {
    id: 2,
    title: "Threat Hunter",
    description: "Identify 5 critical vulnerabilities",
    progress: 3,
    total: 5,
    icon: Trophy,
    reward: "1000 points"
  },
  {
    id: 3,
    title: "Network Guardian",
    description: "Monitor network traffic for 30 days",
    progress: 18,
    total: 30,
    icon: Medal,
    reward: "750 points + Security Badge"
  },
  {
    id: 4,
    title: "Password Master",
    description: "Update all weak passwords",
    progress: 5,
    total: 5,
    icon: CheckCircle2,
    reward: "250 points",
    completed: true
  }
];

export default function RewardsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading rewards...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <AnimatedBackground className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 mb-4">Rewards & Challenges</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Complete security challenges to earn points and unlock special rewards</p>
          </div>
          
          <div className="mb-8">
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Your Points</h2>
                  <p className="text-slate-400">Level 3: Security Expert</p>
                </div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">1,750</div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Progress to Level 4</span>
                  <span className="text-blue-400">1750 / 2500</span>
                </div>
                <Progress value={70} className="h-2 bg-slate-800" indicatorColor="bg-blue-500" />
              </div>
            </Card>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Available Challenges</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id} className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <reward.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-1">{reward.title}</h3>
                      <p className="text-sm text-slate-400 mb-4">{reward.description}</p>
                      
                      {reward.completed ? (
                        <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
                          Completed
                        </Badge>
                      ) : (
                        <div className="w-full">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-blue-400">{reward.progress} / {reward.total}</span>
                          </div>
                          <Progress 
                            value={(reward.progress / reward.total) * 100} 
                            className="h-2 bg-slate-800"
                            indicatorColor="bg-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">
                    {reward.reward}
                  </Badge>
                </div>
                
                {!reward.completed && (
                  <Button className="w-full mt-4 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                    View Details
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </AnimatedBackground>
    </div>
  );
} 