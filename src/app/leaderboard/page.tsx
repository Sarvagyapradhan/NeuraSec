"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Trophy, Medal, Star, User, Search, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedBackground } from "@/components/ui/animated-background";

// Sample leaderboard data
const leaderboardData = [
  { id: 1, name: "Alexandra Smith", points: 8750, rank: 1, badge: "Platinum", avatar: "AS", change: "up" },
  { id: 2, name: "Marcus Johnson", points: 7320, rank: 2, badge: "Gold", avatar: "MJ", change: "same" },
  { id: 3, name: "Olivia Chen", points: 6890, rank: 3, badge: "Gold", avatar: "OC", change: "up" },
  { id: 4, name: "Robert Williams", points: 5430, rank: 4, badge: "Silver", avatar: "RW", change: "down" },
  { id: 5, name: "Sophia Martinez", points: 4970, rank: 5, badge: "Silver", avatar: "SM", change: "up" },
  { id: 6, name: "James Brown", points: 4320, rank: 6, badge: "Silver", avatar: "JB", change: "down" },
  { id: 7, name: "Emma Wilson", points: 3750, rank: 7, badge: "Bronze", avatar: "EW", change: "same" },
  { id: 8, name: "David Lee", points: 3210, rank: 8, badge: "Bronze", avatar: "DL", change: "up" },
  { id: 9, name: "Isabella Garcia", points: 2890, rank: 9, badge: "Bronze", avatar: "IG", change: "down" },
  { id: 10, name: "Michael Taylor", points: 2450, rank: 10, badge: "Bronze", avatar: "MT", change: "same" },
];

export default function LeaderboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
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
          <p className="text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Find the current user's rank (for demo purposes, let's assume it's rank 5)
  const currentUserRank = 5;
  
  // Filter leaderboard data based on search query
  const filteredData = searchQuery 
    ? leaderboardData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboardData;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <AnimatedBackground className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 mb-4">Security Leaderboard</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Compete with other users to reach the top of the security rankings</p>
          </div>
          
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-full">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm">Your Rank</h3>
                    <div className="text-3xl font-bold text-slate-100">#{currentUserRank}</div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-800/50 p-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Star className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm">Your Points</h3>
                    <div className="text-3xl font-bold text-slate-100">4,970</div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-800/50 p-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-full">
                    <Medal className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm">Next Milestone</h3>
                    <div className="text-xl font-bold text-slate-100">Gold Badge (2,350 pts away)</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <Tabs defaultValue="global" className="mb-8">
            <div className="flex justify-between items-center">
              <TabsList className="bg-slate-900/50">
                <TabsTrigger value="global" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
                  Global
                </TabsTrigger>
                <TabsTrigger value="friends" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
                  Friends
                </TabsTrigger>
                <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
                  Monthly
                </TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-8 bg-slate-900/50 border-slate-800 text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="global" className="mt-6">
              <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800/50">
                        <th className="px-6 py-4 text-sm font-medium text-slate-400">Rank</th>
                        <th className="px-6 py-4 text-sm font-medium text-slate-400">User</th>
                        <th className="px-6 py-4 text-sm font-medium text-slate-400">Badge</th>
                        <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Points</th>
                        <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((user) => (
                        <tr 
                          key={user.id} 
                          className={`border-b border-slate-800/30 hover:bg-slate-800/20 ${
                            user.rank === currentUserRank ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            {user.rank <= 3 ? (
                              <div className="flex items-center">
                                {user.rank === 1 && <Crown className="h-5 w-5 text-yellow-400 mr-1" />}
                                {user.rank === 2 && <Medal className="h-5 w-5 text-slate-300 mr-1" />}
                                {user.rank === 3 && <Medal className="h-5 w-5 text-amber-600 mr-1" />}
                                <span className="font-bold text-slate-100">#{user.rank}</span>
                              </div>
                            ) : (
                              <span className={user.rank === currentUserRank ? 'font-bold text-blue-400' : 'text-slate-300'}>
                                #{user.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3 bg-slate-800 border border-slate-700">
                                <AvatarFallback className="text-slate-300 text-sm">
                                  {user.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <span className={user.rank === currentUserRank ? 'font-semibold text-blue-400' : 'text-slate-200'}>
                                {user.name}
                                {user.rank === currentUserRank && ' (You)'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`
                              ${user.badge === 'Platinum' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                              ${user.badge === 'Gold' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                              ${user.badge === 'Silver' ? 'bg-slate-300/10 text-slate-300' : ''}
                              ${user.badge === 'Bronze' ? 'bg-amber-600/10 text-amber-600' : ''}
                            `}>
                              {user.badge}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-200">
                            {user.points.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.change === 'up' && <ArrowUp className="h-4 w-4 text-green-400 inline" />}
                            {user.change === 'down' && <ArrowDown className="h-4 w-4 text-red-400 inline" />}
                            {user.change === 'same' && <span className="text-slate-500">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="friends">
              <div className="flex items-center justify-center h-32 text-slate-400">
                Add friends to see them on the leaderboard
              </div>
            </TabsContent>
            
            <TabsContent value="monthly">
              <div className="flex items-center justify-center h-32 text-slate-400">
                Monthly rankings reset in 15 days
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedBackground>
    </div>
  );
} 