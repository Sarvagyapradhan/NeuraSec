"use client";

import { cn } from "@/lib/utils";
import { 
  Bell, 
  Command, 
  Crown, 
  Gift, 
  Home,
  Lock,
  Settings,
  Shield,
  User,
  ChevronDown,
  Mail,
  Link2,
  FileText,
  Network,
  MonitorCheck,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-blue-400",
  },
  {
    label: "Analyzers",
    icon: Shield,
    color: "text-indigo-400",
    subItems: [
      {
        label: "Email Analyzer",
        icon: Mail,
        href: "/email-analyzer",
        description: "Scan emails for threats",
        color: "text-blue-400",
      },
      {
        label: "URL Scanner",
        icon: Link2,
        href: "/url-scanner",
        description: "Check malicious URLs",
        color: "text-blue-400",
      },
      {
        label: "File Scanner",
        icon: FileText,
        href: "/file-scanner",
        description: "Analyze files for malware",
        color: "text-blue-400",
      },
      {
        label: "Network Monitor",
        icon: Network,
        href: "/network-monitor",
        description: "Monitor network security",
        color: "text-blue-400",
      },
      {
        label: "Password Checker",
        icon: Lock,
        href: "/password-checker",
        description: "Check password strength",
        color: "text-blue-400",
      },
      {
        label: "Security Report",
        icon: MonitorCheck,
        href: "/security-report",
        description: "View security insights",
        color: "text-blue-400",
      },
    ],
  },
  {
    label: "Rewards",
    icon: Gift,
    href: "/rewards",
    color: "text-blue-400",
  },
  {
    label: "Leaderboard",
    icon: Crown,
    href: "/leaderboard",
    color: "text-blue-400",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-blue-400",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.full_name) {
      return user.full_name.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : "U";
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="fixed top-0 w-full z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800/50">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link 
          href={user ? "/dashboard" : "/"} 
          className="flex items-center gap-2 font-semibold text-xl"
        >
          <div className="relative">
            <Shield className="h-8 w-8 text-blue-400" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          </div>
          <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 text-transparent bg-clip-text font-bold">
            NeuraSec
          </span>
        </Link>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Menu for authenticated users */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="group relative hidden md:flex items-center gap-2"
                >
                  <span className="text-slate-400 group-hover:text-slate-100">Features</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] bg-slate-900/95 border-slate-800/50">
                {routes.find(r => r.label === "Analyzers")?.subItems?.map((item, index) => (
                  <Link key={index} href={item.href}>
                    <DropdownMenuItem className="group cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4 text-blue-400" />
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-100 group-hover:text-blue-400 transition-colors">{item.label}</span>
                        <span className="text-xs text-slate-500">{item.description}</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* User is logged in - show profile dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 relative group"
                >
                  <Avatar className="h-8 w-8 border border-slate-700">
                    {user.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={user.full_name || user.email} 
                        className="object-cover" 
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:block text-slate-400 group-hover:text-blue-400 transition-colors">
                    {user.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] bg-slate-900/95 border-slate-800/50">
                <DropdownMenuLabel className="text-slate-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800/50" />
                <Link href={`/profile/${user.id}`}>
                  <DropdownMenuItem className="group">
                    <User className="mr-2 h-4 w-4 text-blue-400" />
                    <span className="text-slate-100 group-hover:text-blue-400 transition-colors">Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-slate-800/50" />
                <DropdownMenuItem className="group cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  <span className="text-red-400 group-hover:text-red-300 transition-colors">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* User is not logged in - show login/signup buttons */
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 