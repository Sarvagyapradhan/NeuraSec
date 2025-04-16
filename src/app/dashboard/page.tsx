"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Lock,
  Mail,
  Network,
  Shield,
  Zap,
  ChevronRight,
  LineChart,
  BarChart,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileWarning,
  User,
  Settings,
  FileText,
  Link as LinkIcon,
  Github,
  Linkedin,
  Database,
  Cpu,
  BrainCircuit,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCard } from "@/components/ui/animated-card";

const features = [
  {
    title: "Real-time Threat Detection",
    description: "Advanced AI-powered system that monitors and identifies potential security threats in real-time",
    icon: Shield,
    metric: "99.9%",
    label: "Detection Rate"
  },
  {
    title: "Zero-Day Vulnerability Protection",
    description: "Proactive defense against unknown vulnerabilities using behavioral analysis",
    icon: Lock,
    metric: "100+",
    label: "Threats Blocked"
  },
  {
    title: "Network Traffic Analysis",
    description: "Deep packet inspection and anomaly detection for comprehensive network security",
    icon: Activity,
    metric: "24/7",
    label: "Monitoring"
  },
  {
    title: "Security Intelligence",
    description: "Continuous learning system that adapts to new threat patterns",
    icon: Eye,
    metric: "500K+",
    label: "Patterns Analyzed"
  }
];

const securityMetrics = [
  {
    title: "Security Score",
    value: "92%",
    change: "+5%",
    status: "positive"
  },
  {
    title: "Threats Blocked",
    value: "2,847",
    change: "+12%",
    status: "positive"
  },
  {
    title: "Response Time",
    value: "1.2s",
    change: "-0.3s",
    status: "positive"
  }
];

const quickTools = [
  {
    title: "Security Scanner",
    description: "Run comprehensive security analysis",
    icon: Shield,
    action: "Scan Now"
  },
  {
    title: "Threat Monitor",
    description: "View active security threats",
    icon: Activity,
    action: "View Threats"
  },
  {
    title: "Network Analysis",
    description: "Analyze network traffic patterns",
    icon: BarChart,
    action: "Analyze"
  }
];

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();

  // Check authentication on load
  useEffect(() => {
    const checkAuthStatus = () => {
      console.log("Dashboard checking auth state");
      
      // Check for token in cookie directly (faster than waiting for useAuth)
      const cookieToken = getCookie("auth_token");
      const localToken = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
      
      console.log("Auth tokens:", { 
        cookieExists: !!cookieToken, 
        localStorageExists: !!localToken,
        authContextLoading: loading,
        authContextAuthenticated: isAuthenticated
      });
      
      // If we have a token in either cookie or localStorage, consider authenticated
      if (cookieToken || localToken) {
        console.log("Token found, setting authenticated state");
        setAuthState('authenticated');
        return;
      }
      
      // If authContext is done loading and says not authenticated
      if (!loading && !isAuthenticated) {
        console.log("No auth token found and context says not authenticated");
        setAuthState('unauthenticated');
        router.push("/login");
      } else if (!loading && isAuthenticated) {
        console.log("Auth context says authenticated");
        setAuthState('authenticated');
      }
    };
    
    checkAuthStatus();
  }, [loading, isAuthenticated, router]);
  
  // Show loading state
  if (authState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If definitely not authenticated, return null (will be redirected by useEffect)
  if (authState === 'unauthenticated') {
    return null;
  }

  // Main dashboard content
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <AnimatedBackground className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="mb-4 bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Welcome to NeuraSec Dashboard
            </h1>
            <p className="mx-auto max-w-2xl text-slate-400">
              Your advanced AI-powered security platform for real-time threat detection and response
            </p>
          </motion.div>

          {/* Security Metrics */}
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {securityMetrics.map((metric, index) => (
              <AnimatedCard key={index}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-400">{metric.title}</h3>
                  <Badge
                    variant={metric.status === "positive" ? "default" : "destructive"}
                    className="bg-blue-500/10 text-blue-400"
                  >
                    {metric.change}
                  </Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-100">{metric.value}</p>
              </AnimatedCard>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-100">Platform Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <AnimatedCard key={index}>
                  <feature.icon className="mb-4 h-8 w-8 text-blue-400" />
                  <h3 className="mb-2 font-semibold text-slate-100">{feature.title}</h3>
                  <p className="mb-4 text-sm text-slate-400">{feature.description}</p>
                  <div className="mt-auto">
                    <div className="text-2xl font-bold text-blue-400">{feature.metric}</div>
                    <div className="text-sm text-slate-500">{feature.label}</div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-100">About NeuraSec</h2>
            <AnimatedCard>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-slate-100">Our Mission</h3>
                  <p className="mb-4 text-slate-400">
                    NeuraSec is on a mission to democratize advanced cybersecurity, making enterprise-grade protection accessible to all. Our AI-powered platform continuously evolves to stay ahead of emerging threats.
                  </p>
                  <p className="text-slate-400">
                    With a team of security experts and AI researchers, we're building the future of proactive digital protection.
                  </p>
                </div>
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-slate-100">Technology</h3>
                  <p className="mb-4 text-slate-400">
                    Our platform leverages cutting-edge machine learning algorithms trained on vast datasets of known threats and vulnerabilities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-300">Neural network threat detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-300">Real-time threat intelligence database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-300">Edge computing for faster response</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
          
          {/* Resources */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-slate-100">Resources</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <AnimatedCard>
                <h3 className="mb-2 font-semibold text-slate-100">Documentation</h3>
                <p className="mb-4 text-sm text-slate-400">
                  Learn how to use all features of the NeuraSec platform
                </p>
                <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  View Docs
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </AnimatedCard>
              <AnimatedCard>
                <h3 className="mb-2 font-semibold text-slate-100">Security Blog</h3>
                <p className="mb-4 text-sm text-slate-400">
                  Stay updated with latest security trends and insights
                </p>
                <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  Read Articles
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </AnimatedCard>
              <AnimatedCard>
                <h3 className="mb-2 font-semibold text-slate-100">Help Center</h3>
                <p className="mb-4 text-sm text-slate-400">
                  Get support from our security experts for any issues
                </p>
                <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  Get Help
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </AnimatedCard>
            </div>
          </div>
        </main>
      </AnimatedBackground>
    </div>
  );
} 