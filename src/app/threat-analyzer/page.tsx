'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ScanSearch, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react'; // Icons

// Define an interface for the analysis result
interface AnalysisResult {
  level: 'Benign' | 'Suspicious' | 'Malicious';
  severity: string;
  explanation: string;
}

const ThreatAnalyzerPage = () => {
  // Use a state to indicate if analysis is available
  const [hasAnalysis, setHasAnalysis] = useState(false);
  
  // Use a default value that won't be shown until hasAnalysis is true
  const analysisResult: AnalysisResult = {
    level: 'Benign',
    severity: 'Low',
    explanation: 'No threats detected.'
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Threat Analyzer</h1>
        <p className="text-muted-foreground">Paste any script, log, or code snippet to understand its potential risks.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Code/Log Snippet</CardTitle>
            <CardDescription>Paste the text content below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste script, log, or code here..."
              rows={15}
              className="resize-none font-mono text-sm" // Use mono font for code
            />
            <Button 
              className="w-full"
              onClick={() => setHasAnalysis(true)} // Just for demo purposes
            >
              <ScanSearch className="mr-2 h-4 w-4" /> Analyze Snippet
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>Assessment of the provided snippet.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {!hasAnalysis ? (
              <p className="text-muted-foreground text-center">Submit a snippet to see the analysis.</p>
            ) : (
              <div className="text-center space-y-3">
                {analysisResult.level === 'Benign' && (
                  <ShieldCheck className="h-16 w-16 text-green-500 mx-auto" />
                )}
                {analysisResult.level === 'Suspicious' && (
                  <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto" />
                )}
                {analysisResult.level === 'Malicious' && (
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                )}
                
                <h3 className={`text-2xl font-semibold ${
                  analysisResult.level === 'Benign' 
                    ? 'text-green-600' 
                    : analysisResult.level === 'Suspicious' 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  Threat Level: {analysisResult.level}
                </h3>
                <p>Severity: <span className="font-medium">{analysisResult.severity}</span></p>
                <p className="text-sm text-muted-foreground px-4">
                  Explanation: {analysisResult.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThreatAnalyzerPage; 