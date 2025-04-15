"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, Lock, Activity, BrainCircuit, ChevronRight, Check } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCard } from "@/components/ui/animated-card";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  // Don't render landing page content if we're authenticated or still checking auth status
  if (loading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-12 w-12 text-blue-400 mb-4" />
          <h2 className="text-slate-400">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <AnimatedBackground className="relative z-10">
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              NeuraSec
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-400">
              Advanced AI-powered cybersecurity platform for comprehensive threat detection and protection
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started Free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="mb-8 text-center text-3xl font-bold text-slate-100">
              Comprehensive Security Features
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <AnimatedCard>
                <Shield className="mb-4 h-10 w-10 text-blue-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">Threat Detection</h3>
                <p className="text-slate-400">
                  Real-time AI-powered detection of cyber threats and vulnerabilities
                </p>
              </AnimatedCard>
              <AnimatedCard>
                <Lock className="mb-4 h-10 w-10 text-indigo-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">URL Scanner</h3>
                <p className="text-slate-400">
                  Analyze links and websites for phishing attempts and malware
                </p>
              </AnimatedCard>
              <AnimatedCard>
                <Activity className="mb-4 h-10 w-10 text-sky-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">Email Analyzer</h3>
                <p className="text-slate-400">
                  Identify suspicious emails and potential phishing attacks
                </p>
              </AnimatedCard>
              <AnimatedCard>
                <BrainCircuit className="mb-4 h-10 w-10 text-purple-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">File Scanner</h3>
                <p className="text-slate-400">
                  Scan files for malware, viruses, and other security threats
                </p>
              </AnimatedCard>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mb-16">
            <h2 className="mb-8 text-center text-3xl font-bold text-slate-100">
              Why Choose NeuraSec
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedCard>
                <div className="mb-8 space-y-4">
                  {[
                    "Advanced AI-powered threat detection",
                    "Comprehensive security analysis",
                    "Real-time monitoring and alerts",
                    "User-friendly interface"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 text-green-400" />
                      <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Sign Up Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </AnimatedCard>
              <AnimatedCard>
                <div className="mb-8 space-y-4">
                  {[
                    "Continuous learning and adaptation",
                    "Detailed security reports",
                    "Protection against zero-day exploits",
                    "Enterprise-grade security"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 text-green-400" />
                      <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login">
                  <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                    Learn More
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </AnimatedCard>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-100">
              Ready to secure your digital presence?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-slate-400">
              Join thousands of users who trust NeuraSec for their cybersecurity needs
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                Get Started Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
      </AnimatedBackground>
    </div>
  );
} 