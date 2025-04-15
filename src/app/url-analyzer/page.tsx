'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ImageOff, 
  Loader2, 
  ListChecks, 
  AlertOctagon, 
  ShieldCheck, 
  Eye, 
  Lightbulb,
  Info as InfoIcon,
  Shield
} from 'lucide-react'; // Icons

// Update interface based on README API response
interface UrlAnalysisResult {
  url: string;
  verdict: 'Safe' | 'Risky' | 'Dangerous';
  score: number;
  sources: { [key: string]: boolean };
  domain_age_days: number | null;
  ssl_valid: boolean | null;
  suspicious_features: string[];
  suggestions: string;
  previewAvailable?: boolean; // Keep optional for now
}

const UrlAnalyzerPage = () => {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<UrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Validate and format URL
      let processedUrl = url.trim();
      
      // Add protocol if missing
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }
      
      // Validate URL format before sending, but allow Unicode/IDN domains
      try {
        const parsedUrl = new URL(processedUrl);
        
        // Check for valid domain structure (at least one dot and a TLD)
        const domainParts = parsedUrl.hostname.split('.');
        if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
          throw new Error('Invalid URL: Please enter a domain with a valid TLD (e.g., .com, .org)');
        }
        
        // Only do basic validation - Unicode characters and IDN domains are now allowed
        // This lets our backend homograph detection work properly
        if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
          throw new Error('Invalid URL: Hostname is too short or missing');
        }
        
        // The old strict validation regex is commented out - it would block homograph attacks
        // const validDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        // if (!validDomainRegex.test(parsedUrl.hostname)) {
        //   throw new Error('Invalid URL: Domain contains invalid characters');
        // }
      } catch (e) {
        throw new Error('Invalid URL format. Please enter a valid website address (e.g., example.com)');
      }

      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: processedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setAnalysisResult(data);
      console.log("Analysis result:", data);

    } catch (err) {
      console.error("Analysis request failed:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Default analysis result with proper types (will be replaced by API response)
  // const defaultResult: UrlAnalysisResult = {
  //   url: "",
  //   verdict: 'Safe',
  //   score: 0,
  //   sources: {},
  //   domain_age_days: null,
  //   ssl_valid: null,
  //   suspicious_features: [],
  //   suggestions: "",
  // };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">URL Analyzer</h1>
        <p className="text-muted-foreground">Enter a website URL to scan for malicious content and safety risks.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Analyze Website</CardTitle>
          <CardDescription>Enter a website URL to check it for potential security threats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">
              <InfoIcon className="inline-block mr-1 h-4 w-4" />
              Enter a full domain name (e.g., example.com). HTTP/HTTPS will be added automatically if missing.
              Our advanced scanner now detects homograph attacks with look-alike characters.
            </p>
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="example.com or https://example.com"
                  className="pl-9 flex-grow"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && url.trim() && handleAnalyze()}
                />
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !url.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" /> 
                )}
                Analyze URL
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-400 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Common Signs of Suspicious URLs
            </h4>
            <ul className="mt-2 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <li>• Misspelled domain names (faceboook.com)</li>
              <li>• Unusual subdomains (login.secure-site.example.com)</li>
              <li>• Non-HTTPS connections for sensitive sites</li>
              <li>• URLs with excessive numbers or special characters</li>
              <li>• Look-alike characters (paypаl.com with Cyrillic 'а')</li>
              <li>• Mixed script domains (using multiple alphabets)</li>
            </ul>
            <div className="mt-3 text-xs text-slate-300 bg-slate-800/30 p-2 rounded">
              <span className="font-medium">Try scanning these domains to test homograph detection:</span>
              <ul className="mt-1 text-xs text-slate-400 space-y-1">
                <li>• payрal.com (using Cyrillic 'р' that looks like Latin 'p')</li>
                <li>• аpple.com (using Cyrillic 'а' that looks like Latin 'a')</li>
                <li>• microsоft.com (using Cyrillic 'о' that looks like Latin 'o')</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="mt-6">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-48 space-y-3">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-muted-foreground">Analyzing URL... This might take a moment.</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorDisplay message={error} onClose={() => setError(null)} />
      )}

      {/* Results Section */}
      {analysisResult && !isLoading && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Analysis Results for: <span className="font-normal break-all">{analysisResult.url}</span></CardTitle>
          </CardHeader>

          {/* Homograph Attack Warning - displayed prominently when detected */}
          {analysisResult.sources.homographDetection && (
            <div className="mx-6 mb-6 p-4 border-2 border-red-600 bg-red-900/20 rounded-lg">
              <div className="flex items-start">
                <AlertOctagon className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-500">Homograph Attack Detected!</h3>
                  <p className="text-slate-300 mt-1">
                    This URL appears to be using look-alike characters to mimic a legitimate website.
                    It may be attempting to steal your login credentials or personal information.
                  </p>
                  <div className="mt-3 bg-slate-900/40 p-3 rounded border border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300">Detected Issues:</h4>
                    <ul className="mt-1 text-sm text-slate-400 space-y-1">
                      {analysisResult.suspicious_features
                        .filter(feature => 
                          feature.includes('mimic') || 
                          feature.includes('similar') || 
                          feature.includes('character') || 
                          feature.includes('Punycode') ||
                          feature.includes('mix')
                        )
                        .map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Verdict and Score */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg bg-slate-900/50">
              <VerdictIcon verdict={analysisResult.verdict} />
              <h3 className={`text-2xl font-semibold ${getVerdictColor(analysisResult.verdict)}`}>
                {analysisResult.verdict}
              </h3>
              <p className="text-slate-300">Safety Score: <span className="font-bold text-slate-100">{(analysisResult.score * 100).toFixed(0)}%</span></p>
            </div>

            {/* Domain & SSL Info */}
            <div className="lg:col-span-1 space-y-3 p-6 border rounded-lg bg-slate-900/50">
              <h4 className="text-lg font-medium flex items-center text-slate-100"><Eye className="mr-2 h-5 w-5 text-blue-400"/>Domain & Security</h4>
              <InfoItem label="Domain Age" value={analysisResult.domain_age_days !== null ? `${analysisResult.domain_age_days} days` : 'Not Available'} />
              <InfoItem label="SSL Certificate" value={analysisResult.ssl_valid !== null ? (analysisResult.ssl_valid ? 'Valid' : 'Invalid/Missing') : 'Not Checked'} status={analysisResult.ssl_valid === null ? undefined : analysisResult.ssl_valid ? 'safe' : 'dangerous'} />
            </div>

            {/* Threat Sources */}
            <div className="lg:col-span-1 space-y-3 p-6 border rounded-lg bg-slate-900/50">
              <h4 className="text-lg font-medium flex items-center text-slate-100"><ListChecks className="mr-2 h-5 w-5 text-blue-400"/>Threat Intelligence</h4>
              {Object.keys(analysisResult.sources).length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {Object.entries(analysisResult.sources).map(([source, detected]) => (
                    <li key={source} className="flex justify-between">
                      <span className="text-slate-400">{formatSourceName(source)}:</span>
                      <span className={`font-medium ${detected ? 'text-red-400' : 'text-green-400'}`}>
                        {detected ? 'Detected' : 'Clean'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No threat intelligence sources checked or available.</p>
              )}
            </div>

            {/* Suspicious Features */}
            <div className="md:col-span-2 lg:col-span-3 space-y-3 p-6 border rounded-lg bg-slate-900/50">
              <h4 className="text-lg font-medium flex items-center text-slate-100"><ListChecks className="mr-2 h-5 w-5 text-blue-400"/>Suspicious Features Detected</h4>
              {analysisResult.suspicious_features.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 columns-1 md:columns-2">
                  {analysisResult.suspicious_features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No suspicious features found.</p>
              )}
            </div>

            {/* Suggestions */}
            <div className="md:col-span-2 lg:col-span-3 space-y-3 p-6 border rounded-lg bg-slate-900/50">
              <h4 className="text-lg font-medium flex items-center text-slate-100"><Lightbulb className="mr-2 h-5 w-5 text-yellow-400"/>Suggestions</h4>
              <p className="text-sm text-slate-400">{analysisResult.suggestions || 'No specific suggestions at this time.'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder if no analysis yet */}
      {!analysisResult && !isLoading && !error && (
          <Card className="mt-6">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-48 space-y-3">
                <Globe className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Submit a URL to see the analysis results.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
};

// Helper components and functions
const VerdictIcon = ({ verdict }: { verdict: UrlAnalysisResult['verdict'] }) => {
  const className = "h-16 w-16";
  switch (verdict) {
    case 'Safe': return <ShieldCheck className={`${className} text-green-500`} />;
    case 'Risky': return <AlertCircle className={`${className} text-yellow-500`} />;
    case 'Dangerous': return <XCircle className={`${className} text-red-500`} />;
    default: return null;
  }
};

const getVerdictColor = (verdict: UrlAnalysisResult['verdict']) => {
  switch (verdict) {
    case 'Safe': return 'text-green-600';
    case 'Risky': return 'text-yellow-600';
    case 'Dangerous': return 'text-red-600';
    default: return 'text-slate-100';
  }
};

const InfoItem = ({ label, value, status }: { label: string; value: string; status?: 'safe' | 'dangerous' }) => (
  <p className="text-sm text-slate-400">
    {label}: 
    <span className={`font-medium ml-1 ${status === 'safe' ? 'text-green-400' : status === 'dangerous' ? 'text-red-400' : 'text-slate-100'}`}>
      {value}
    </span>
  </p>
);

const formatSourceName = (source: string) => {
  // Simple formatter, can be expanded
  return source.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};

// Error state UI with better formatting
const ErrorDisplay = ({ message, onClose }: { message: string, onClose: () => void }) => {
  const formattedMessage = message.includes('Invalid URL') 
    ? message 
    : 'Analysis Error: ' + message;
    
  return (
    <Card className="mt-6 border-red-500/50">
      <CardContent className="pt-6 flex flex-col items-center justify-center h-48 space-y-3 text-red-500">
        <AlertOctagon className="h-10 w-10" />
        <p className="font-semibold">Analysis Failed</p>
        <p className="text-sm text-center px-4">{formattedMessage}</p>
        <Button variant="destructive" onClick={onClose}>Try Again</Button>
      </CardContent>
    </Card>
  );
};

export default UrlAnalyzerPage; 