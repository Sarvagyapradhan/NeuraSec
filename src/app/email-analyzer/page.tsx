'use client'; // Add this if using client-side state/interactions later

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { MailCheck, AlertTriangle, ShieldX, Shield, Upload } from 'lucide-react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Define the type for the analysis result
type AnalysisResultType = {
  verdict: 'Safe' | 'Suspicious' | 'Phishing';
  score: number;
  explanation: string;
};

const EmailAnalyzerPage = () => {
  const [emailContent, setEmailContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);

  const handleAnalyze = () => {
    if (!emailContent.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis with timeout
    setTimeout(() => {
      // Mock result for demo purposes
      const mockResult: AnalysisResultType = {
        verdict: Math.random() > 0.7 ? 'Safe' : Math.random() > 0.5 ? 'Suspicious' : 'Phishing',
        score: Math.random(),
        explanation: "This email has been analyzed using our AI security model. The content was processed for known phishing patterns, suspicious links, and malicious payload indicators."
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500 bg-clip-text text-transparent">
          Email Analyzer
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
          Our AI-powered security tool scans email content to detect phishing attempts, malicious links, and other security threats.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-slate-100">Email Content</CardTitle>
              <CardDescription className="text-slate-400">Paste the email body here, including headers if possible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste email content here..."
                rows={15}
                className="resize-none bg-slate-900/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
              />
              <Button 
                className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-2"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !emailContent.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Analyze Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-slate-100">Analysis Results</CardTitle>
              <CardDescription className="text-slate-400">The AI assessment will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-400">Processing email content...</p>
                </div>
              ) : !analysisResult ? (
                <div className="text-center space-y-4 p-8">
                  <Upload className="h-16 w-16 text-slate-500 mx-auto" />
                  <p className="text-slate-400">Submit an email to see the analysis.</p>
                </div>
              ) : (
                <motion.div 
                  className="text-center space-y-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-24 h-24 mx-auto">
                    {analysisResult.verdict === 'Safe' && (
                      <>
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                        <MailCheck className="h-24 w-24 text-green-500 mx-auto" />
                      </>
                    )}
                    {analysisResult.verdict === 'Suspicious' && (
                      <>
                        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                        <AlertTriangle className="h-24 w-24 text-yellow-500 mx-auto" />
                      </>
                    )}
                    {analysisResult.verdict === 'Phishing' && (
                      <>
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                        <ShieldX className="h-24 w-24 text-red-500 mx-auto" />
                      </>
                    )}
                  </div>
                  
                  <div>
                    <Badge className={`
                      text-sm font-medium px-3 py-1 
                      ${analysisResult.verdict === 'Safe' ? 'bg-green-500/10 text-green-400' : 
                       analysisResult.verdict === 'Suspicious' ? 'bg-yellow-500/10 text-yellow-400' : 
                       'bg-red-500/10 text-red-400'}
                    `}>
                      {analysisResult.verdict}
                    </Badge>
                    
                    <div className="mt-4">
                      <h3 className="text-xl font-medium text-slate-100">Confidence Score</h3>
                      <div className="mt-2 relative h-3 w-64 mx-auto bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`
                            absolute top-0 left-0 h-full rounded-full
                            ${analysisResult.verdict === 'Safe' ? 'bg-green-500' : 
                             analysisResult.verdict === 'Suspicious' ? 'bg-yellow-500' : 
                             'bg-red-500'}
                          `}
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisResult.score * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        ></motion.div>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{(analysisResult.score * 100).toFixed(0)}% confidence</p>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 mx-auto max-w-md">
                    {analysisResult.explanation}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => setAnalysisResult(null)}
                  >
                    Reset Analysis
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailAnalyzerPage;
