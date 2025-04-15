'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, ShieldX, Link2, Shield, ExternalLink, ServerCrash, Clock, Tag, Star, Calendar, RefreshCw, Database, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define the type for the analysis result (align with backend)
type AnalysisResultType = {
  verdict: 'Safe' | 'Suspicious' | 'Malicious' | 'Error';
  score: number;
  url: string;
  explanation: string;
  details?: {
    category: string;
    status: 'ok' | 'warning' | 'critical';
    description: string;
  }[];
  analysisId?: string;
  categories?: string[]; // URL categories from VirusTotal
  reputation?: number; // URL reputation from VirusTotal
  lastAnalysisDate?: string; // When VirusTotal last analyzed the URL
  timesSubmitted?: number; // How many times the URL was submitted to VirusTotal
  fromCache?: boolean; // Whether this result came from cache
  communityFeedback?: {
    hasFeedback: boolean;
    majorityVerdict?: string;
    totalFeedbacks?: number;
    feedbackStats?: Array<{
      user_verdict: string;
      count: number;
    }>;
  };
};

export default function URLScannerPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state variables for polling
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);
  
  // New state variables for feedback
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  
  // Max polling attempts and interval
  const MAX_POLL_ATTEMPTS = 30; 
  const POLL_INTERVAL_MS = 3000; 

  // Helper to format dates for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(); // Format as "MM/DD/YYYY, HH:MM:SS AM/PM" in local format
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Function to validate URL format
  const validateUrl = (urlString: string): boolean => {
    try {
      // Add protocol if missing
      let urlToCheck = urlString.trim();
      if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
        urlToCheck = 'https://' + urlToCheck;
      }
      
      // Use URL constructor to validate
      const url = new URL(urlToCheck);
      
      // Accept any valid URL (including localhost URLs)
      return !!url.hostname;
    } catch (e) {
      return false;
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!analysisResult || !feedbackVerdict) return;
    
    setIsSubmittingFeedback(true);
    
    try {
      const response = await fetch('/api/url-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: analysisResult.url,
          originalVerdict: analysisResult.verdict,
          userVerdict: feedbackVerdict,
          comment: feedbackComment
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }
      
      const result = await response.json();
      
      // Update the analysis result with the new feedback stats
      setAnalysisResult(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          communityFeedback: {
            hasFeedback: true,
            majorityVerdict: result.majorityVerdict,
            totalFeedbacks: result.totalFeedbacks,
            feedbackStats: result.feedbackStats
          }
        };
      });
      
      setHasSubmittedFeedback(true);
      toast.success('Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error((err as Error).message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Reset feedback state when analyzing a new URL
  useEffect(() => {
    if (isAnalyzing) {
      setHasSubmittedFeedback(false);
      setFeedbackVerdict(null);
      setFeedbackComment('');
    }
  }, [isAnalyzing]);

  // Extract the poll function for useEffect dependencies
  const pollForResults = useCallback(async () => {
    if (!url || pollCount >= MAX_POLL_ATTEMPTS) {
      // Stop polling if we've reached max attempts or have no URL
      setIsPolling(false);
      if (pollCount >= MAX_POLL_ATTEMPTS) {
        // Update the UI to show polling timed out
        setAnalysisResult(prev => {
          if (!prev) return null;
          return {
            ...prev,
            explanation: prev.explanation + " Automatic polling has timed out. Try scanning again later."
          };
        });
      }
      return;
    }
    
    setPollCount(count => count + 1);
    console.log(`Polling attempt ${pollCount + 1}/${MAX_POLL_ATTEMPTS} for URL: ${url}`);
    
    try {
      // Same fetch logic as handleAnalyze but without updating isAnalyzing state
      const response = await fetch('/api/scan-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      
      // Check if we still have a "queued" status
      const isStillQueued = result.details?.some((d: {category: string, status: string, description: string}) => 
        d.category === "Analysis Status" && 
        d.description?.includes("awaiting full analysis")
      );
      
      if (!isStillQueued) {
        // We have a complete result, stop polling and update UI
        setIsPolling(false);
        setAnalysisResult(result);
        // Show a success toast
        toast.success("Analysis complete!");
      } else if (pollCount < MAX_POLL_ATTEMPTS) {
        // Schedule next poll
        const timer = setTimeout(pollForResults, POLL_INTERVAL_MS);
        setPollTimer(timer);
      } else {
        // Max polls reached
        setIsPolling(false);
      }
    } catch (err) {
      console.error("Poll fetch error:", err);
      setIsPolling(false);
    }
  }, [url, pollCount, MAX_POLL_ATTEMPTS]);

  // Clear polling timer on unmount or URL change
  useEffect(() => {
    return () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [pollTimer]);

  // Start polling when needed
  useEffect(() => {
    // Check if result indicates a queued scan
    const needsPolling = analysisResult?.details?.some((d: {category: string, status: string, description: string}) => 
      d.category === "Analysis Status" && 
      d.description?.includes("awaiting full analysis")
    );
    
    if (needsPolling && !isPolling && pollCount < MAX_POLL_ATTEMPTS) {
      setIsPolling(true);
      setPollCount(0);
      // Start polling
      const timer = setTimeout(pollForResults, POLL_INTERVAL_MS);
      setPollTimer(timer);
    }
  }, [analysisResult, isPolling, pollCount, pollForResults]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    // Client-side URL validation
    if (!validateUrl(url.trim())) {
      setError('Please enter a valid URL');
      toast.error('Invalid URL format. Please enter a valid URL.');
      setAnalysisResult({
        verdict: 'Error',
        score: 0,
        url: url,
        explanation: "The URL format appears to be invalid. Please enter a valid URL with a proper domain name.",
      });
      return;
    }

    // Clear any existing polling
    if (pollTimer) {
      clearTimeout(pollTimer);
      setPollTimer(null);
    }
    setIsPolling(false);
    setPollCount(0);
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const response = await fetch('/api/scan-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error:", result);
        setError(result.error || 'Failed to analyze URL. Please try again.');
        toast.error(result.error || "Analysis failed");
        setAnalysisResult({
          verdict: 'Error',
          score: 0,
          url: url,
          explanation: result.error || 'An error occurred during analysis.',
        });
      } else {
        setAnalysisResult(result as AnalysisResultType);
        
        // If the result contains an error message, show it
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        }
      }

    } catch (err) {
      console.error("Fetch Error:", err);
      setError('An unexpected error occurred. Check your connection or try again later.');
      toast.error("Analysis failed due to a network error.");
      setAnalysisResult({
        verdict: 'Error',
        score: 0,
        url: url,
        explanation: 'An unexpected error occurred. Could not reach the analysis service.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictStyles = (verdict: AnalysisResultType['verdict']) => {
    switch (verdict) {
      case 'Safe':
        return { icon: CheckCircle, color: 'green', badgeClass: 'bg-green-500/10 text-green-400', iconClass: 'text-green-500', blurClass: 'bg-green-500/20' };
      case 'Suspicious':
        return { icon: AlertTriangle, color: 'yellow', badgeClass: 'bg-yellow-500/10 text-yellow-400', iconClass: 'text-yellow-500', blurClass: 'bg-yellow-500/20' };
      case 'Malicious':
        return { icon: ShieldX, color: 'red', badgeClass: 'bg-red-500/10 text-red-400', iconClass: 'text-red-500', blurClass: 'bg-red-500/20' };
      case 'Error':
        return { icon: ServerCrash, color: 'gray', badgeClass: 'bg-slate-500/10 text-slate-400', iconClass: 'text-slate-500', blurClass: 'bg-slate-500/20' };
      default:
        return { icon: Link2, color: 'gray', badgeClass: 'bg-slate-500/10 text-slate-400', iconClass: 'text-slate-500', blurClass: 'bg-slate-500/20' };
    }
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
          URL Scanner
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
          Check any URL for phishing attempts, malware, and other security threats before visiting.
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
              <CardTitle className="text-slate-100">Enter URL</CardTitle>
              <CardDescription className="text-slate-400">Paste a website URL to check its security status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  className="bg-slate-900/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500 italic">Example: https://website.com</p>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
              
              <Button 
                className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-2"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                    Scanning URL...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Analyze URL
                  </>
                )}
              </Button>
              
              <div className="rounded-lg bg-slate-800/30 p-4 space-y-3">
                <h3 className="font-medium text-slate-200 flex items-center">
                  <Link2 className="h-4 w-4 mr-2 text-blue-400" />
                  Common Signs of Phishing URLs
                </h3>
                <ul className="text-sm text-slate-400 space-y-2 pl-6 list-disc">
                  <li>Misspelled domain names (e.g., amazon-secure.com)</li>
                  <li>Unusual subdomains (e.g., login.secure-payment.example.com)</li>
                  <li>Non-HTTPS connections for sensitive sites</li>
                  <li>URLs with excessive numbers or special characters</li>
                </ul>
              </div>
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
              <CardTitle className="text-slate-100">Scan Results</CardTitle>
              <CardDescription className="text-slate-400">
                The URL security assessment will appear here.
                {isPolling && (
                  <span className="ml-2 inline-flex items-center text-blue-400">
                    <span className="animate-pulse">Polling for updates...</span>
                    <span className="ml-2 animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-400">Analyzing URL security...</p>
                </div>
              ) : !analysisResult ? (
                <div className="text-center space-y-4 p-8">
                  <Link2 className="h-16 w-16 text-slate-500 mx-auto" />
                  <p className="text-slate-400">Enter a URL to check its security status.</p>
                </div>
              ) : (
                <motion.div 
                  className="text-center space-y-6 w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {(() => {
                    const styles = getVerdictStyles(analysisResult.verdict);
                    const IconComponent = styles.icon;
                    return (
                  <div className="relative w-24 h-24 mx-auto">
                        <div className={`absolute inset-0 ${styles.blurClass} rounded-full blur-xl`}></div>
                        <IconComponent className={`h-24 w-24 ${styles.iconClass} mx-auto`} />
                  </div>
                    );
                  })()}
                  
                  <div>
                    <div className="flex items-center justify-center gap-2">
                    <Badge className={`
                      text-sm font-medium px-3 py-1 
                        ${getVerdictStyles(analysisResult.verdict).badgeClass}
                    `}>
                      {analysisResult.verdict}
                    </Badge>
                      
                      {analysisResult.fromCache && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Cached
                        </Badge>
                      )}
                      
                      {analysisResult.communityFeedback?.hasFeedback && 
                       analysisResult.communityFeedback.totalFeedbacks && 
                       analysisResult.communityFeedback.totalFeedbacks > 0 && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {analysisResult.communityFeedback.totalFeedbacks} Feedback
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4 overflow-hidden max-w-xs mx-auto">
                      <div className="flex items-center gap-2 justify-center">
                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <p className="truncate text-slate-300 font-mono text-sm">{analysisResult.url}</p>
                      </div>
                    </div>
                    
                    {analysisResult.verdict !== 'Error' && (
                    <div className="mt-4">
                      <h3 className="text-xl font-medium text-slate-100">Risk Assessment</h3>
                      <div className="mt-2 relative h-3 w-64 mx-auto bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`
                            absolute top-0 left-0 h-full rounded-full
                              ${getVerdictStyles(analysisResult.verdict).color === 'green' ? 'bg-green-500' :
                              getVerdictStyles(analysisResult.verdict).color === 'yellow' ? 'bg-yellow-500' :
                             'bg-red-500'}
                          `}
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisResult.score * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        ></motion.div>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{(analysisResult.score * 100).toFixed(0)}% risk score</p>
                    </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 mx-auto max-w-md">
                    {analysisResult.explanation}
                    
                    {/* Show polling indicator or manual scan button as appropriate */}
                    {analysisResult.details?.some((d: {category: string, status: string, description: string}) => 
                      d.category === "Analysis Status" && 
                      d.description?.includes("awaiting full analysis")
                    ) && (
                      <>
                        {isPolling ? (
                          <div className="mt-3 text-sm text-blue-400 flex items-center justify-center gap-2">
                            <span className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
                            <span>Auto-updating ({pollCount}/{MAX_POLL_ATTEMPTS})</span>
                          </div>
                        ) : (
                          <Button
                            onClick={handleAnalyze}
                            className="mt-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 text-xs py-1"
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? 'Scanning...' : 'Scan Again Manually'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Community feedback section */}
                  {analysisResult.communityFeedback?.hasFeedback && 
                   analysisResult.communityFeedback.feedbackStats && 
                   analysisResult.communityFeedback.feedbackStats.length > 0 && (
                    <div className="p-4 bg-slate-800/30 rounded-lg max-w-md mx-auto">
                      <h3 className="text-sm font-medium text-slate-200 mb-2 flex items-center justify-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-purple-400" />
                        Community Feedback
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {analysisResult.communityFeedback.feedbackStats.map((stat, i) => (
                          <div 
                            key={i} 
                            className={`rounded p-2 flex flex-col items-center justify-center ${
                              stat.user_verdict === 'Safe' ? 'bg-green-500/10 text-green-400' :
                              stat.user_verdict === 'Suspicious' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                            }`}
                          >
                            <span className="font-medium">{stat.user_verdict}</span>
                            <span className="text-slate-400">{stat.count} vote{stat.count !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add a feedback button to collect user feedback */}
                  {analysisResult.verdict !== 'Error' && !isPolling && (
                    <div className="mt-4">
                  <Button 
                    variant="outline" 
                        size="sm"
                        className="text-sm bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-slate-700/50"
                        onClick={() => setFeedbackDialogOpen(true)}
                        disabled={hasSubmittedFeedback}
                      >
                        {hasSubmittedFeedback ? 'Feedback Submitted' : 'Provide Feedback'}
                  </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800/50 text-slate-100">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription className="text-slate-400">
              Do you think this URL is incorrectly classified? Let us know.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-1">Current verdict:</p>
              <Badge className={`
                text-sm font-medium px-3 py-1
                ${analysisResult?.verdict === 'Safe' ? 'bg-green-500/10 text-green-400' :
                  analysisResult?.verdict === 'Suspicious' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'}
              `}>
                {analysisResult?.verdict || 'Unknown'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block">In your opinion, this URL is:</Label>
                <RadioGroup value={feedbackVerdict || ''} onValueChange={setFeedbackVerdict} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Safe" id="safe" className="border-green-500 text-green-500" />
                    <Label htmlFor="safe" className="text-green-400">Safe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Suspicious" id="suspicious" className="border-yellow-500 text-yellow-500" />
                    <Label htmlFor="suspicious" className="text-yellow-400">Suspicious</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Malicious" id="malicious" className="border-red-500 text-red-500" />
                    <Label htmlFor="malicious" className="text-red-400">Malicious</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="comment" className="text-slate-300 mb-2 block">Additional comments (optional):</Label>
                <Textarea 
                  id="comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Why do you believe this classification is incorrect?"
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setFeedbackDialogOpen(false)}
              className="text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFeedbackSubmit}
              disabled={!feedbackVerdict || isSubmittingFeedback}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmittingFeedback ? 
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Submitting...
                </span> : 
                'Submit Feedback'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
