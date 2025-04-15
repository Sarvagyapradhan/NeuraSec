import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NeuraSec - AI Cybersecurity Platform",
  description: "Advanced AI-powered cybersecurity analysis and protection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          <main className="pt-16 min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
} 