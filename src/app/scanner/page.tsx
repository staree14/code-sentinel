"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Code, GitBranch, Terminal, AlertTriangle, ShieldCheck, FileCode2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Vulnerability {
  vulnerability: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  fix: string;
}

export default function ScannerDashboard() {
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "repo">("paste");
  const [code, setCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Vulnerability[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleScan = async () => {
    // Determine payload based on active tab
    const payloadCode = activeTab === "repo" ? `Analyze this GitHub Repository URL: ${repoUrl}` : code;
    
    if (!payloadCode) {
      setError("Please provide some code or a repository URL to scan.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("http://localhost:8000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: payloadCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to scan code. Make sure the backend is running on port 8000.");
      }

      const data = await response.json();
      setResults(data.vulnerabilities);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-pixel-text p-8 font-ibm-plex">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-press-start text-3xl text-pixel-green mb-4">Security Terminal</h1>
            <p className="text-muted">Analyze your code against AWS Bedrock security intelligence.</p>
          </div>
          <Link href="/" className="px-4 py-2 border border-pixel-border hover:bg-bg2 transition-colors flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Panel */}
          <div className="border border-pixel-border bg-bg2 p-6 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-pixel-green/30" />
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-pixel-border pb-4">
              <button 
                onClick={() => setActiveTab("paste")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'paste' ? 'bg-pixel-green/10 text-pixel-green border border-pixel-green/30' : 'hover:bg-bg3 text-muted'}`}
              >
                <Code className="w-4 h-4" /> Paste Code
              </button>
              <button 
                onClick={() => setActiveTab("upload")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'upload' ? 'bg-pixel-yellow/10 text-pixel-yellow border border-pixel-yellow/30' : 'hover:bg-bg3 text-muted'}`}
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <button 
                onClick={() => setActiveTab("repo")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'repo' ? 'bg-pixel-blue/10 text-pixel-blue border border-pixel-blue/30' : 'hover:bg-bg3 text-muted'}`}
              >
                <GitBranch className="w-4 h-4" /> Connect Repo
              </button>
            </div>

            {/* Input Content */}
            <div className="min-h-[300px]">
              {activeTab === "paste" && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code snippet or IaC template here..."
                  className="w-full h-[300px] bg-bg border border-pixel-border p-4 font-mono text-sm focus:outline-none focus:border-pixel-green transition-colors resize-none rounded-sm"
                />
              )}

              {activeTab === "upload" && (
                <div className="w-full h-[300px] border-2 border-dashed border-pixel-border flex flex-col items-center justify-center rounded-sm bg-bg hover:bg-bg3 transition-colors">
                  <FileCode2 className="w-12 h-12 text-muted mb-4" />
                  <p className="text-muted mb-4 text-center px-4">Drag & drop a file here, or click to select</p>
                  <label className="px-6 py-2 bg-pixel-border cursor-pointer hover:bg-bg2 transition-colors border border-pixel-border">
                    Browse Files
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {code && <p className="mt-4 text-pixel-green text-sm">✓ File loaded ({code.length} characters)</p>}
                </div>
              )}

              {activeTab === "repo" && (
                <div className="w-full h-[300px] flex flex-col justify-center">
                  <label className="text-sm text-pixel-blue mb-2 font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4"/> Target Repository URL
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/staree14/code-sentinel"
                    className="w-full bg-bg border border-pixel-blue/40 p-4 font-mono text-sm focus:outline-none focus:border-pixel-blue transition-colors rounded-sm"
                  />
                  <p className="mt-4 text-xs text-muted">The agent will attempt to scan the root files of the repository.</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 border border-pixel-red/40 bg-pixel-red/10 text-pixel-red text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={loading}
              className="mt-6 w-full py-4 bg-pixel-green text-bg font-press-start text-xs hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> SCANNING WITH BEDROCK...
                </>
              ) : (
                "LAUNCH SECURITY SCAN"
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="border border-pixel-border bg-bg p-6 rounded-sm relative overflow-y-auto max-h-[600px]">
            <h2 className="font-mono text-lg mb-6 border-b border-pixel-border pb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pixel-purple" /> Analysis Results
            </h2>

            {!results && !loading && (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted opacity-50">
                <ShieldCheck className="w-16 h-16 mb-4" />
                <p>Waiting for scan target...</p>
              </div>
            )}

            {loading && (
              <div className="h-[300px] flex flex-col items-center justify-center font-mono gap-4 animate-pulse">
                <div className="flex gap-2 text-pixel-purple">
                  <span>[</span>
                  <span>RUNNING_VULN_CHECKS</span>
                  <span>]</span>
                </div>
                <div className="w-48 h-1 bg-pixel-border overflow-hidden">
                  <div className="h-full bg-pixel-purple animate-ping origin-left" />
                </div>
              </div>
            )}

            <AnimatePresence>
              {results && results.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-6 border border-pixel-green/30 bg-pixel-green/5 text-pixel-green text-center"
                >
                  <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="font-press-start text-sm mb-2">Code Secure</h3>
                  <p className="text-sm">No critical vulnerabilities detected against current RAG ruleset.</p>
                </motion.div>
              )}

              {results && results.length > 0 && (
                <div className="space-y-4">
                  {results.map((vuln, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className="border border-pixel-border bg-bg2 p-4 font-mono group hover:border-pixel-red/40 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-pixel-text leading-tight">{vuln.vulnerability}</h3>
                        <span className={`text-[10px] px-2 py-1 border whitespace-nowrap ml-4 ${
                          vuln.severity === 'CRITICAL' ? 'border-pixel-red text-pixel-red bg-pixel-red/10' :
                          vuln.severity === 'HIGH' ? 'border-aws-orange text-aws-orange bg-aws-orange/10' :
                          vuln.severity === 'MEDIUM' ? 'border-pixel-yellow text-pixel-yellow bg-pixel-yellow/10' :
                          'border-pixel-green text-pixel-green bg-pixel-green/10'
                        }`}>
                          [{vuln.severity}]
                        </span>
                      </div>
                      
                      <div className="mt-4 p-3 bg-bg border border-pixel-border text-sm text-muted">
                        <span className="text-pixel-purple text-xs mb-2 block">RECOMMENDED_FIX:</span>
                        <code className="whitespace-pre-wrap">{vuln.fix}</code>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
