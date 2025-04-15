'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { FileCheck, AlertCircle, ShieldX, Upload, Shield, File, X } from 'lucide-react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Define the type for the analysis result
type AnalysisResultType = {
  verdict: 'Safe' | 'Suspicious' | 'Malicious';
  score: number;
  explanation: string;
  detectionDetails?: {
    type: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
  }[];
};

export default function FileScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleAnalyze = () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Mock result for demo purposes
        setTimeout(() => {
          const mockResult: AnalysisResultType = {
            verdict: Math.random() > 0.7 ? 'Safe' : Math.random() > 0.5 ? 'Suspicious' : 'Malicious',
            score: Math.random(),
            explanation: "This file has been analyzed using our AI security model. We've scanned for malware signatures, suspicious code patterns, and potentially harmful content.",
            detectionDetails: Math.random() > 0.7 ? [
              {
                type: "Potential Malware",
                severity: "Medium",
                description: "The file contains patterns associated with known malware families."
              },
              {
                type: "Suspicious Code",
                severity: "Low",
                description: "Obfuscated code sections detected that may hide malicious intent."
              }
            ] : undefined
          };
          
          setAnalysisResult(mockResult);
          setIsAnalyzing(false);
        }, 1000);
      }
    }, 100);
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
          File Scanner
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
          Scan files for malware, viruses, and other security threats with our advanced AI analysis engine.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-slate-100">Upload File</CardTitle>
              <CardDescription className="text-slate-400">Select or drag & drop a file to analyze for security threats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-500/5' 
                    : 'border-slate-700 hover:border-blue-400/50 hover:bg-slate-800/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input 
                  type="file" 
                  id="fileInput" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <File className="h-10 w-10 text-blue-400" />
                      <div className="absolute -top-1 -right-1 bg-slate-800 rounded-full p-0.5">
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>
                          <X className="h-4 w-4 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-200 truncate max-w-xs">{file.name}</p>
                      <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-10 w-10 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-300">Drag and drop a file</p>
                      <p className="text-sm text-slate-400">or click to browse</p>
                    </div>
                  </div>
                )}
              </div>
              
              {file && (
                <Button 
                  className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-2"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Analyze File
                    </>
                  )}
                </Button>
              )}
              
              {isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2 bg-slate-800" />
                  <p className="text-xs text-slate-400 text-right">{uploadProgress}% complete</p>
                </div>
              )}
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
              <CardDescription className="text-slate-400">The security assessment will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-400">Analyzing file contents...</p>
                </div>
              ) : !analysisResult ? (
                <div className="text-center space-y-4 p-8">
                  <Shield className="h-16 w-16 text-slate-500 mx-auto" />
                  <p className="text-slate-400">Upload and analyze a file to see results.</p>
                </div>
              ) : (
                <motion.div 
                  className="text-center space-y-6 w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-24 h-24 mx-auto">
                    {analysisResult.verdict === 'Safe' && (
                      <>
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                        <FileCheck className="h-24 w-24 text-green-500 mx-auto" />
                      </>
                    )}
                    {analysisResult.verdict === 'Suspicious' && (
                      <>
                        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                        <AlertCircle className="h-24 w-24 text-yellow-500 mx-auto" />
                      </>
                    )}
                    {analysisResult.verdict === 'Malicious' && (
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
                      <h3 className="text-xl font-medium text-slate-100">Threat Score</h3>
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
                      <p className="mt-1 text-sm text-slate-400">{(analysisResult.score * 100).toFixed(0)}% threat level</p>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 mx-auto max-w-md">
                    {analysisResult.explanation}
                  </div>
                  
                  {analysisResult.detectionDetails && (
                    <div className="w-full mt-4">
                      <h3 className="text-lg font-medium text-slate-100 mb-3">Detection Details</h3>
                      <div className="space-y-2">
                        {analysisResult.detectionDetails.map((detail, index) => (
                          <div key={index} className="bg-slate-800/30 rounded-lg p-3 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-slate-200">{detail.type}</span>
                              <Badge className={
                                detail.severity === 'Low' ? 'bg-blue-500/10 text-blue-400' :
                                detail.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }>
                                {detail.severity} Severity
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">{detail.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
}
