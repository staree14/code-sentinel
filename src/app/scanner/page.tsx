"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Code, GitBranch, Terminal, AlertTriangle, ShieldCheck, FileCode2, Loader2, ArrowLeft, Send, Sparkles, Activity, Wrench, ChevronDown, ChevronUp, Bot, User, CheckCircle, Copy, Check } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Vulnerability {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  line?: number;
  category?: string;
  cwe?: string;
  description: string;
  fix: string;
}

interface AnalyticsData {
  routing_decision: { model_used: string; reason: string; intent_detected: string };
  performance_metrics: { tokens_processed: number; latency_sec: number; speed_improvement_vs_pro: string; };
  business_impact: { dollars_saved: string; cost_reduction_percentage: string; projected_monthly_savings: string; };
  security_scan: { risk_level: string; pii_detected: boolean; };
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export default function InteractiveDashboard() {
  // Scanner state
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "repo">("paste");
  const [code, setCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const [results, setResults] = useState<Vulnerability[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // UI state
  const [expandedFixes, setExpandedFixes] = useState<Record<string, boolean>>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);

  // Chat & Process API state
  const [promptInput, setPromptInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [latestAnalytics, setLatestAnalytics] = useState<AnalyticsData | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatOpen]);

  // Prevent background scrolling when chat overlay is open
  useEffect(() => {
    if (isChatOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isChatOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCode(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleScan = async () => {
    const payloadCode = activeTab === "repo" ? `Analyze this GitHub Repository URL: ${repoUrl}` : code;
    if (!payloadCode) return setScanError("Please provide some code or a repository URL to scan.");

    setLoadingScan(true);
    setScanError(null);
    setResults(null);

    try {
      const response = await fetch("http://localhost:8000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: payloadCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to scan code. Make sure the backend is running on port 8000.");

      setResults(data.vulnerabilities);
    } catch (err: any) {
      setScanError(err.message || "An unknown error occurred.");
    } finally {
      setLoadingScan(false);
    }
  };

  const explainVulnerability = (vulnTitle: string, vulnDesc: string) => {
    const q = `As an academic cyber-defense instructor, explain this vulnerability strictly for remediation and defensive training purposes. Be clinical and avoid malicious exploit commands.\n\nTitle: ${vulnTitle}\nDescription: ${vulnDesc}`;
    setPromptInput(q);
    setIsChatOpen(true);
  };

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) return;

    const textToSend = promptInput;
    setPromptInput("");
    setIsChatOpen(true);
    setChatHistory(prev => [...prev, { role: "user", text: textToSend }]);
    setLoadingChat(true);

    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await response.json();

      setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
      setLatestAnalytics({
        routing_decision: data.routing_decision,
        performance_metrics: data.performance_metrics,
        business_impact: data.business_impact,
        security_scan: data.security_scan
      });
      setShowAnalytics(true);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const toggleFix = (id: string) => {
    setExpandedFixes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyFix = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFixId(id);
    setTimeout(() => setCopiedFixId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-pixel-text font-ibm-plex overflow-hidden pb-[80px]">

      {/* ── 1. Independent Navbar ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-bg3 border-b border-pixel-border z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 text-muted hover:text-pixel-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-pixel-green" />
            <h1 className="font-press-start text-xs text-pixel-green tracking-widest leading-none mt-1">SECURITY DASHBOARD</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-mono transition-colors ${showAnalytics ? 'bg-pixel-blue/10 border-pixel-blue text-pixel-blue shadow-[0_0_15px_rgba(56,139,253,0.3)]' : 'border-pixel-border text-muted hover:text-pixel-text'}`}
        >
          <Activity className="w-4 h-4" />
          ANALYTICS {showAnalytics ? 'ON' : 'OFF'}
        </button>
      </header>

      {/* ── 2. Main Workspace ── */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Pane: Scanner Inputs */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-pixel-border">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 mb-6 border-b border-pixel-border pb-4">
              <button onClick={() => setActiveTab("paste")} className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'paste' ? 'bg-pixel-green/10 text-pixel-green border border-pixel-green/30' : 'hover:bg-bg3 text-muted'}`}>
                <Code className="w-4 h-4" /> Paste Code
              </button>
              <button onClick={() => setActiveTab("upload")} className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'upload' ? 'bg-pixel-yellow/10 text-pixel-yellow border border-pixel-yellow/30' : 'hover:bg-bg3 text-muted'}`}>
                <Upload className="w-4 h-4" /> Upload
              </button>
              <button onClick={() => setActiveTab("repo")} className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors ${activeTab === 'repo' ? 'bg-pixel-blue/10 text-pixel-blue border border-pixel-blue/30' : 'hover:bg-bg3 text-muted'}`}>
                <GitBranch className="w-4 h-4" /> Connect Repo
              </button>
            </div>

            <div className="min-h-[400px] mb-6">
              {activeTab === "paste" && (
                <textarea
                  value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your source code or IAM JSON here..."
                  className="w-full h-[400px] bg-bg2 border border-pixel-border p-4 font-mono text-sm focus:border-pixel-green resize-none rounded-sm outline-none"
                />
              )}
              {activeTab === "upload" && (
                <div className="flex flex-col gap-4">
                  {!code ? (
                    <div className="w-full h-[400px] border-2 border-dashed border-pixel-border flex flex-col items-center justify-center rounded-sm bg-bg2 hover:bg-bg3 transition-colors">
                      <FileCode2 className="w-12 h-12 text-muted mb-4" />
                      <label className="px-6 py-2 bg-pixel-border cursor-pointer hover:bg-bg border border-pixel-border text-xs rounded-sm transition-colors">
                        Browse Files <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center px-4 py-2 bg-bg2 border border-pixel-border rounded-sm">
                        <p className="text-pixel-green text-xs flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> File loaded ({code.length} characters)
                        </p>
                        <label className="text-[10px] text-muted hover:text-pixel-text cursor-pointer underline">
                          Change File <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                      <textarea
                        value={code} onChange={(e) => setCode(e.target.value)}
                        className="w-full h-[320px] bg-bg2 border border-pixel-border p-4 font-mono text-sm focus:border-pixel-green resize-none rounded-sm outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
              {activeTab === "repo" && (
                <div className="w-full h-[400px] flex flex-col justify-center bg-bg2 p-8 border border-pixel-border">
                  <label className="text-sm text-pixel-blue mb-2 font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Target Repository URL
                  </label>
                  <input
                    type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/staree14/code-sentinel"
                    className="w-full bg-bg border border-pixel-blue/40 p-4 font-mono text-sm focus:border-pixel-blue outline-none transition-colors rounded-sm"
                  />
                </div>
              )}
            </div>

            {scanError && <div className="mb-4 p-4 bg-pixel-red/10 border border-pixel-red/40 text-pixel-red text-xs leading-relaxed flex items-center gap-3"><AlertTriangle className="w-4 h-4 shrink-0" /> {scanError}</div>}

            <button
              onClick={handleScan} disabled={loadingScan}
              className="w-full py-4 bg-pixel-green text-bg font-press-start text-[0.6rem] hover:bg-green-400 disabled:opacity-50 flex items-center justify-center gap-3 transition-colors rounded-sm relative shadow-[0_0_20px_rgba(57,211,83,0.15)]"
            >
              {loadingScan ? <><Loader2 className="w-4 h-4 animate-spin" /> SCANNING...</> : "LAUNCH SECURITY SCAN"}
            </button>
          </div>
        </div>

        {/* Right Pane: Results & Optional Analytics */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-bg relative">

          {/* Analytics Header Panel (Slides in) */}
          <AnimatePresence>
            {showAnalytics && latestAnalytics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-bg3 border-b border-pixel-border p-6 shadow-2xl z-10"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-pixel-blue">
                    <Activity className="w-4 h-4" /> <span className="font-press-start text-[0.55rem]">PERFORMANCE ANALYTICS</span>
                  </div>
                  {latestAnalytics.security_scan?.pii_detected && (
                    <span className="text-[10px] px-2 py-0.5 bg-pixel-red/20 text-pixel-red border border-pixel-red/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> PII DETECTED IN PROMPT
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                  {/* BOX 1 */}
                  <div className="border border-pixel-border bg-bg p-4 flex flex-col justify-between hover:border-pixel-green/30 transition-colors">
                    <div>
                      <p className="text-muted text-[10px] mb-2">ROUTING DECISION</p>
                      <p className="text-pixel-green text-xl font-bold mb-1">{latestAnalytics.routing_decision?.model_used}</p>
                      <p className="text-xs text-pixel-text mb-2 border-l-2 border-pixel-green pl-2">{latestAnalytics.routing_decision?.intent_detected}</p>
                    </div>
                    <p className="text-[10px] text-muted leading-tight">{latestAnalytics.routing_decision?.reason}</p>
                  </div>

                  {/* BOX 2 */}
                  <div className="border border-pixel-border bg-bg p-4 flex flex-col justify-between hover:border-pixel-blue/30 transition-colors">
                    <div>
                      <p className="text-muted text-[10px] mb-2">PERFORMANCE METRICS</p>
                      <div className="flex justify-between items-end mb-2 border-b border-pixel-border/50 pb-2">
                        <span className="text-[10px] text-muted">LATENCY</span>
                        <span className="text-pixel-blue text-lg">{latestAnalytics.performance_metrics?.latency_sec}s</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-muted">TOKENS</span>
                        <span className="text-pixel-text text-sm">{latestAnalytics.performance_metrics?.tokens_processed}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-pixel-blue bg-pixel-blue/10 px-2 py-1 inline-block w-fit mt-2 border border-pixel-blue/20">
                      {latestAnalytics.performance_metrics?.speed_improvement_vs_pro}
                    </p>
                  </div>

                  {/* BOX 3 */}
                  <div className="border border-pixel-border bg-bg p-4 flex flex-col justify-between relative overflow-hidden group hover:border-pixel-green/30 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-pixel-green/5 rounded-full pointer-events-none group-hover:bg-pixel-green/10 transition-colors" />
                    <div>
                      <p className="text-muted text-[10px] mb-2 z-10 relative">BUSINESS IMPACT</p>
                      <div className="relative z-10">
                        <p className="text-pixel-green text-3xl font-black mb-1 drop-shadow-[0_0_10px_rgba(57,211,83,0.3)]">{latestAnalytics.business_impact?.cost_reduction_percentage}</p>
                        <p className="text-xs text-pixel-text mb-4 border-l-2 border-pixel-green pl-2">Cost Reduction</p>
                      </div>
                      <div className="flex justify-between items-end mb-2 relative z-10 border-t border-pixel-border/50 pt-2">
                        <span className="text-[10px] text-muted">SAVED / REQ</span>
                        <span className="text-aws-orange text-sm font-bold">${latestAnalytics.business_impact?.dollars_saved}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vulnerabilities Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {!results && !loadingScan && (
              <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                <ShieldCheck className="w-16 h-16 mb-4" />
                <p className="font-mono text-sm text-center">Awaiting target parameters.<br />Initiate scan to begin inspection.</p>
              </div>
            )}

            {results?.length === 0 && (
              <div className="p-6 border border-pixel-green/40 bg-pixel-green/5 text-pixel-green text-center flex flex-col items-center gap-3">
                <ShieldCheck className="w-12 h-12" />
                <span className="font-press-start text-[0.6rem]">CODE SECURE</span>
                <span className="font-mono text-sm max-w-sm">No vulnerabilities detected matching the current RAG architecture ruleset.</span>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="font-press-start text-[0.55rem] text-pixel-text mb-6 pb-2 border-b border-pixel-border flex items-center justify-between">
                <span>DETECTED THREATS ({results.length})</span>
              </div>
            )}

            <div className="space-y-4">
              {results?.map((vuln, idx) => (
                <div key={idx} className="border border-pixel-border bg-bg2 p-4 font-mono group hover:border-pixel-red/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-pixel-blue text-xs mr-2">{vuln.id}</span>
                      <h3 className="text-pixel-text text-base inline">{vuln.title}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-1 border whitespace-nowrap ml-4 flex-shrink-0 ${vuln.severity === 'CRITICAL' ? 'border-pixel-red text-pixel-red bg-pixel-red/10' :
                      vuln.severity === 'HIGH' ? 'border-aws-orange text-aws-orange bg-aws-orange/10' :
                        vuln.severity === 'MEDIUM' ? 'border-pixel-yellow text-pixel-yellow bg-pixel-yellow/10' :
                          'border-pixel-green text-pixel-green bg-pixel-green/10'
                      }`}>[{vuln.severity}]</span>
                  </div>

                  <div className="flex gap-4 mb-4 text-xs text-muted border-b border-pixel-border/50 pb-3">
                    {vuln.category && <span><span className="text-pixel-border">CAT:</span> {vuln.category}</span>}
                    {vuln.cwe && <span><span className="text-pixel-border">CWE:</span> {vuln.cwe}</span>}
                    {vuln.line && <span className="bg-bg3 px-1.5"><span className="text-pixel-border">L:</span>{vuln.line}</span>}
                  </div>

                  <p className="text-sm text-pixel-text mb-6 border-l-2 border-pixel-border pl-3 leading-relaxed">{vuln.description}</p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => toggleFix(vuln.id)} className="flex items-center gap-2 text-xs bg-bg border border-pixel-border px-3 py-1.5 hover:bg-bg3 hover:text-pixel-green transition-colors">
                      <Wrench className="w-3 h-3" /> {expandedFixes[vuln.id] ? 'HIDE FIX' : 'SHOW FIX'}
                    </button>
                    <button onClick={() => explainVulnerability(vuln.title, vuln.description)} className="flex items-center gap-2 text-xs bg-bg border border-pixel-border px-3 py-1.5 hover:bg-bg3 hover:text-pixel-purple transition-colors">
                      <Sparkles className="w-3 h-3 text-pixel-purple" /> EXPLAIN THIS
                    </button>
                  </div>

                  {/* Fix Area */}
                  <AnimatePresence>
                    {expandedFixes[vuln.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 p-4 bg-bg border flex flex-col relative" style={{ borderColor: 'rgba(57,211,83,0.3)' }}>
                        <span className="absolute -top-2 left-4 bg-bg px-2 text-[10px] text-pixel-green font-press-start" style={{ fontSize: '0.45rem' }}>RECOMMENDED_FIX</span>

                        <button
                          onClick={() => handleCopyFix(vuln.id, vuln.fix)}
                          className="absolute top-2 right-2 p-1.5 bg-bg2 text-muted hover:text-pixel-green hover:bg-pixel-green/10 border border-pixel-border rounded-sm transition-colors flex items-center gap-1 text-[10px] font-mono z-10"
                        >
                          {copiedFixId === vuln.id ? <Check className="w-3 h-3 text-pixel-green" /> : <Copy className="w-3 h-3" />}
                          {copiedFixId === vuln.id ? "COPIED!" : "COPY"}
                        </button>

                        <code className="whitespace-pre-wrap text-sm text-muted block mt-6 overflow-x-auto">{vuln.fix}</code>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. Full Screen Expandable Chat Overlay ── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 flex flex-col bg-bg/95 backdrop-blur-lg border-t border-pixel-border shadow-[0_-20px_80px_rgba(0,0,0,0.8)] pt-[80px] pb-[80px]"
          >
            {/* Darker background tint layer */}
            <div className="absolute inset-0 bg-black/40 -z-10" />

            {/* Chat Overlay Header */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-pixel-border bg-bg/80 absolute top-0 inset-x-0 z-50">
              <h3 className="font-press-start text-[0.6rem] text-pixel-purple flex items-center gap-3">
                <Sparkles className="w-5 h-5" /> AI SECURITY ASSISTANT
              </h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-muted hover:text-pixel-text bg-bg2 px-4 py-2 border border-pixel-border flex items-center gap-2 text-xs font-mono transition-colors"
                title="Collapse Chat"
              >
                COLLAPSE <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History Flow */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 max-w-5xl mx-auto w-full">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted opacity-50 font-mono">
                  <Bot className="w-16 h-16 mb-4" />
                  <p>Cyber-defense analysis unit ready.</p>
                  <p className="text-xs mt-2">Enter a prompt below or click "EXPLAIN THIS" on a vulnerability.</p>
                </div>
              )}

              {chatHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-4 max-w-[85%] ${chat.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xs border ${chat.role === "user" ? "bg-bg2 border-pixel-border text-muted" : "bg-pixel-purple/10 border-pixel-purple text-pixel-purple"
                      }`}>
                      {chat.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className={`p-5 text-sm font-mono whitespace-pre-wrap rounded-sm overflow-hidden ${chat.role === "user"
                      ? "bg-bg2 border border-pixel-border text-pixel-text"
                      : "bg-[#110e19] border border-pixel-purple/30 text-pixel-text shadow-[0_0_15px_rgba(163,113,247,0.05)]"
                      }`}>
                      {chat.role === "user" ? (
                        chat.text
                      ) : (
                        <div className="prose-invert prose-p:leading-relaxed prose-pre:m-0 prose-pre:bg-transparent">
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline ? (
                                  <div className="border border-pixel-purple/40 rounded-sm my-6 overflow-hidden bg-bg shadow-lg">
                                    <div className="bg-pixel-purple/10 px-4 py-2 border-b border-pixel-purple/40 text-[10px] text-pixel-purple font-mono uppercase font-bold flex items-center gap-2">
                                      <Code className="w-3 h-3" />
                                      {match?.[1] || 'snippet'}
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-[13px] text-pixel-text/90 leading-relaxed">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code className="bg-pixel-purple/10 border border-pixel-purple/20 px-1.5 py-0.5 mt-0.5 inline-block rounded-sm text-pixel-purple text-xs" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p({ children }) {
                                return <p className="mb-4 last:mb-0 leading-relaxed text-pixel-text/90">{children}</p>;
                              },
                              ul({ children }) {
                                return <ul className="list-disc pl-6 mb-4 space-y-2 text-pixel-text/90">{children}</ul>;
                              },
                              ol({ children }) {
                                return <ol className="list-decimal pl-6 mb-4 space-y-2 text-pixel-text/90">{children}</ol>;
                              },
                              h1({ children }) { return <h1 className="text-pixel-purple text-lg font-bold mb-4 mt-6">{children}</h1>; },
                              h2({ children }) { return <h2 className="text-pixel-purple text-base font-bold mb-3 mt-5">{children}</h2>; },
                              h3({ children }) { return <h3 className="text-pixel-purple text-sm font-bold mb-2 mt-4">{children}</h3>; }
                            }}
                          >
                            {chat.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex justify-start">
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-pixel-purple/10 border border-pixel-purple text-pixel-purple">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-5 text-sm font-mono bg-[#110e19] border border-pixel-purple/30 text-pixel-purple/80 flex items-center gap-2">
                      Processing analysis via Amazon Bedrock routing matrix...
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. Sticky Bottom Prompt Input Bar (Always Visible) ── */}
      <div className="fixed bottom-0 left-0 w-full bg-bg3/90 backdrop-blur-md border-t border-pixel-border p-4 z-50">
        <div className="max-w-5xl mx-auto relative flex items-center shadow-lg">
          <Sparkles className={`absolute left-4 w-5 h-5 transition-colors ${loadingChat ? 'text-muted' : 'text-pixel-purple'}`} />
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onFocus={() => setIsChatOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
            placeholder="Ask the AI routing agent to explain a vulnerability or rewrite code..."
            className="w-full bg-bg border border-pixel-border py-4 pl-12 pr-20 font-mono text-sm focus:outline-none focus:border-pixel-purple focus:ring-1 focus:ring-pixel-purple/50 transition-all rounded-sm text-pixel-text placeholder:text-muted/60"
            disabled={loadingChat}
          />
          {/* Action buttons inside input */}
          <div className="absolute right-2 flex items-center gap-2">
            {!isChatOpen && (
              <button onClick={() => setIsChatOpen(true)} className="p-2 text-muted hover:text-pixel-text transition-colors" title="Expand Chat">
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSendPrompt()}
              disabled={loadingChat || !promptInput.trim()}
              className="px-4 py-2 bg-pixel-purple text-bg hover:bg-purple-400 disabled:opacity-50 disabled:bg-pixel-border disabled:text-muted transition-colors rounded-sm shadow-[0_0_10px_rgba(163,113,247,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
