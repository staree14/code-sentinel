"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Code, GitBranch, Terminal, AlertTriangle, ShieldCheck, FileCode2, Loader2, ArrowLeft, Send, Sparkles, Activity, Wrench, ChevronDown, ChevronUp, Bot, User, CheckCircle, Copy, Check, Maximize2, Minimize2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const MAX_PASTE_CHARS = 1000;
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface Vulnerability {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  line?: number;
  category?: string;
  cwe?: string;
  description: string;
  fix: string;
  original_snippet?: string;
  fixed_snippet?: string;
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
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (!email) {
      router.push("/login");
    }
  }, []);

  // UI state
  const [expandedFixes, setExpandedFixes] = useState<Record<string, boolean>>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSize, setChatSize] = useState<"half" | "full">("half");
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);

  // Chat & Process API state
  const [promptInput, setPromptInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [latestAnalytics, setLatestAnalytics] = useState<AnalyticsData | null>(null);
  const [fixedVulnIds, setFixedVulnIds] = useState<string[]>([]);

  // Monaco Ref & Decorations
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Sync Decorations with Snippet Search
  const updateDecorations = () => {
    if (!editorRef.current || !monacoRef.current || !results) {
      if (editorRef.current && monacoRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const newDecorations: any[] = [];
    const model = editorRef.current.getModel();
    if (!model) return;

    results.forEach(vuln => {
      const isFixed = fixedVulnIds.includes(vuln.id);
      const targetSnippet = isFixed ? vuln.fixed_snippet : vuln.original_snippet;

      if (!targetSnippet) return;

      const matches = model.findMatches(targetSnippet, false, false, true, null, true);

      matches.forEach((match: any) => {
        newDecorations.push({
          range: match.range,
          options: {
            isWholeLine: true,
            className: isFixed ? 'fixed-line-highlight' : 'vulnerable-line-highlight',
            glyphMarginClassName: isFixed ? 'fixed-glyph' : 'vulnerable-glyph',
            hoverMessage: { value: isFixed ? `**[FIXED]** ${vuln.title}` : `**[${vuln.severity}]** ${vuln.title}` }
          }
        });
      });
    });

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    const timer = setTimeout(() => updateDecorations(), 50);
    return () => clearTimeout(timer);
  }, [results, fixedVulnIds, code]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('codesentinel-v2', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: { 'editor.background': '#0a0a0b', 'editorGutter.background': '#0a0a0b', 'editor.lineHighlightBackground': '#18181b' }
    });
    monaco.editor.setTheme('codesentinel-v2');
    updateDecorations();
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatOpen]);

  // Prevent background scrolling ONLY when in full mode
  useEffect(() => {
    if (isChatOpen && chatSize === "full") document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isChatOpen, chatSize]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) { setScanError(`File too large. Max is ${MAX_FILE_SIZE_MB}MB.`); return; }
    setScanError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content.length > 50000) { setScanError("File content too dense for quick scan."); return; }
      setCode(content);
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    const payloadCode = activeTab === "repo" ? `Analyze this GitHub Repository URL: ${repoUrl}` : code;
    if (!payloadCode) return setScanError("Please provide some code or a repository URL to scan.");
    if (activeTab === "paste" && code.length > MAX_PASTE_CHARS) return setScanError(`Pasted code exceeds ${MAX_PASTE_CHARS} limit.`);

    setLoadingScan(true); setScanError(null); setResults(null); setFixedVulnIds([]);

    try {
      const response = await fetch("http://localhost:8000/api/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: payloadCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Scan failed.");
      setResults(data.vulnerabilities);
    } catch (err: any) { setScanError(err.message || "An unknown error occurred."); }
    finally { setLoadingScan(false); }
  };

  const explainVulnerability = (title: string, desc: string) => {
    setPromptInput(`As a security instructor, explain this threat:\n\nTitle: ${title}\nDescription: ${desc}`);
    setIsChatOpen(true);
  };

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) return;
    const textToSend = promptInput; setPromptInput(""); setIsChatOpen(true);
    setChatHistory(prev => [...prev, { role: "user", text: textToSend }]);
    setLoadingChat(true);

    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
      setLatestAnalytics({ routing_decision: data.routing_decision, performance_metrics: data.performance_metrics, business_impact: data.business_impact, security_scan: data.security_scan });
      setShowAnalytics(true);
    } catch (err: any) { setChatHistory(prev => [...prev, { role: "ai", text: `Error: ${err.message}` }]); }
    finally { setLoadingChat(false); }
  };

  const handleApplyFix = (original: string, fixed: string, vulnId?: string) => {
    if (!original || !fixed) return;
    setCode(prevCode => {
      let newCode = prevCode.replace(original, fixed);
      if (newCode === prevCode) newCode = prevCode.replace(original.trim(), fixed.trim());
      if (newCode !== prevCode) { if (vulnId) setFixedVulnIds(prev => [...prev, vulnId]); return newCode; }
      setScanError("Auto-fix mismatch occurred."); return prevCode;
    });
  };

  const toggleFix = (id: string) => setExpandedFixes(prev => ({ ...prev, [id]: !prev[id] }));
  const handleCopy = (id: string, code: string) => { navigator.clipboard.writeText(code); setCopiedFixId(id); setTimeout(() => setCopiedFixId(null), 2000); };

  return (
    <div className="flex flex-col h-screen bg-bg text-pixel-text font-ibm-plex overflow-hidden">

      {/* ── Navbar ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-bg3 border-b border-pixel-border z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 text-muted hover:text-pixel-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-pixel-green" />
            <h1 className="font-press-start text-[0.65rem] text-pixel-green tracking-widest mt-1">SECURITY DASHBOARD</h1>
          </div>
        </div>
        <button onClick={() => setShowAnalytics(!showAnalytics)} className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-mono transition-colors ${showAnalytics ? 'bg-pixel-blue/10 border-pixel-blue text-pixel-blue shadow-[0_0_15px_rgba(56,139,253,0.3)]' : 'border-pixel-border text-muted hover:text-pixel-text'}`}>
          <Activity className="w-4 h-4" /> ANALYTICS {showAnalytics ? 'ON' : 'OFF'}
        </button>
      </header>

      {/* ── Main Workspace ── */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Workspace: Content Pane */}
        <div className={`flex w-full transition-all duration-500 ease-in-out ${isChatOpen && chatSize === 'full' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>

          {/* Left: Editor */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-pixel-border bg-bg/50">
            <div className="max-w-2xl mx-auto pb-12">
              <div className="flex gap-2 mb-6 border-b border-pixel-border pb-4">
                <button onClick={() => setActiveTab("paste")} className={`px-4 py-2 text-xs rounded-sm transition-colors flex items-center gap-2 ${activeTab === 'paste' ? 'bg-pixel-green/10 text-pixel-green border border-pixel-green/30 font-bold' : 'text-muted hover:text-pixel-text'}`}><Code className="w-4 h-4" /> Paste</button>
                <button onClick={() => setActiveTab("upload")} className={`px-4 py-2 text-xs rounded-sm transition-colors flex items-center gap-2 ${activeTab === 'upload' ? 'bg-pixel-yellow/10 text-pixel-yellow border border-pixel-yellow/30 font-bold' : 'text-muted hover:text-pixel-text'}`}><Upload className="w-4 h-4" /> Upload</button>
                <button onClick={() => setActiveTab("repo")} className={`px-4 py-2 text-xs rounded-sm transition-colors flex items-center gap-2 ${activeTab === 'repo' ? 'bg-pixel-blue/10 text-pixel-blue border border-pixel-blue/30 font-bold' : 'text-muted hover:text-pixel-text'}`}><GitBranch className="w-4 h-4" /> Repo</button>
              </div>

              <div className="min-h-[400px] mb-6">
                {(activeTab === "paste" || (activeTab === "upload" && code)) && (
                  <div className="flex flex-col gap-2">
                    <div className="w-full h-[450px] bg-bg2 border border-pixel-border overflow-hidden rounded-sm">
                      <Editor
                        height="100%" defaultLanguage="python" value={code} onMount={handleEditorMount} onChange={(v) => setCode(v || "")}
                        options={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", minimap: { enabled: false }, glyphMargin: true, padding: { top: 16 } }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono mt-1 opacity-60">
                      <span>{code.length > MAX_PASTE_CHARS ? "⚠ OVERLIMIT" : "READY"}</span>
                      <span>{code.length}/{MAX_PASTE_CHARS}</span>
                    </div>
                  </div>
                )}
                {activeTab === "upload" && !code && (
                  <div className="w-full h-[450px] border-2 border-dashed border-pixel-border flex flex-col items-center justify-center rounded-sm bg-bg2/40 hover:bg-bg2 transition-colors">
                    <FileCode2 className="w-12 h-12 text-muted mb-4" />
                    <label className="px-6 py-2 bg-pixel-border cursor-pointer hover:bg-bg border border-pixel-border text-xs rounded-sm uppercase tracking-widest font-bold">Browse Files <input type="file" className="hidden" onChange={handleFileUpload} /></label>
                  </div>
                )}
                {activeTab === "repo" && (
                  <div className="w-full h-[450px] flex flex-col justify-center bg-bg2/40 p-8 border border-pixel-border rounded-sm">
                    <label className="text-xs text-pixel-blue mb-2 font-mono flex items-center gap-2 uppercase">Target Repository URL</label>
                    <input type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/staree14/code-sentinel" className="w-full bg-bg border border-pixel-blue/40 p-4 font-mono text-sm outline-none focus:border-pixel-blue transition-colors rounded-sm" />
                  </div>
                )}
              </div>

              {scanError && <div className="mb-4 p-4 bg-pixel-red/10 border border-pixel-red/40 text-pixel-red text-xs flex items-center gap-3"><AlertTriangle className="w-4 h-4" /> {scanError}</div>}

              <button onClick={handleScan} disabled={loadingScan || code.length > MAX_PASTE_CHARS} className="w-full py-4 bg-pixel-green text-bg font-press-start text-[0.6rem] hover:bg-green-400 disabled:opacity-50 flex items-center justify-center gap-3 transition-all rounded-sm uppercase shadow-[0_4px_20px_rgba(57,211,83,0.15)]">
                {loadingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} {loadingScan ? "RUNNING..." : "LAUNCH SECURITY SCAN"}
              </button>
            </div>
          </div>

          {/* Right: Results + Analytics Overlay */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-bg relative">
            <AnimatePresence>
              {showAnalytics && latestAnalytics && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-bg3 border-b border-pixel-border p-6 shadow-2xl z-20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                    <div className="border border-pixel-border bg-bg p-4"><p className="text-[10px] text-muted mb-2">MODEL</p><p className="text-pixel-green text-lg font-bold">{latestAnalytics.routing_decision?.model_used}</p></div>
                    <div className="border border-pixel-border bg-bg p-4"><p className="text-[10px] text-muted mb-2">SPEED</p><p className="text-pixel-blue text-lg">{latestAnalytics.performance_metrics?.latency_sec}s</p></div>
                    <div className="border border-pixel-border bg-bg p-4"><p className="text-[10px] text-muted mb-2">IMPACT</p><p className="text-pixel-green text-xl font-black">{latestAnalytics.business_impact?.cost_reduction_percentage}</p></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!results && !loadingScan && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 invert-[0.1] grayscale">
                  <Sparkles className="w-16 h-16 mb-4 text-pixel-border" />
                  <p className="font-mono text-sm tracking-widest uppercase">Target Analysis Pending</p>
                </div>
              )}
              {results?.map((vuln, i) => (
                <div key={i} className="border border-pixel-border bg-bg2 p-5 font-mono group hover:border-pixel-red/40 transition-all rounded-sm relative">
                  <div className="flex justify-between items-start mb-4">
                    <div><span className="text-pixel-blue text-[10px] block mb-1">{vuln.id}</span><h3 className="text-pixel-text text-base font-bold">{vuln.title}</h3></div>
                    <span className={`text-[10px] px-2 py-1 border ${vuln.severity === 'CRITICAL' ? 'border-pixel-red text-pixel-red bg-pixel-red/10' : 'border-pixel-yellow text-pixel-yellow bg-pixel-yellow/10'}`}>[{vuln.severity}]</span>
                  </div>
                  <p className="text-xs text-pixel-text/80 mb-6 leading-relaxed border-l-2 border-pixel-border pl-4">{vuln.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFix(vuln.id)} className="px-3 py-1.5 bg-bg border border-pixel-border text-[10px] flex items-center gap-2 hover:text-pixel-green transition-colors"><Wrench className="w-3 h-3" /> FIX</button>
                    <button onClick={() => explainVulnerability(vuln.title, vuln.description)} className="px-3 py-1.5 bg-bg border border-pixel-border text-[10px] flex items-center gap-2 hover:text-pixel-purple transition-colors"><Sparkles className="w-3 h-3 text-pixel-purple" /> EXPLAIN</button>
                    {vuln.fixed_snippet && <button onClick={() => handleApplyFix(vuln.original_snippet!, vuln.fixed_snippet!, vuln.id)} className="px-3 py-1.5 bg-pixel-green/10 border border-pixel-green/30 text-pixel-green text-[10px] font-bold flex items-center gap-2 hover:bg-pixel-green hover:text-bg transition-all tracking-tighter"><Check className="w-3 h-3" /> APPLY FIX</button>}
                  </div>
                  <AnimatePresence>
                    {expandedFixes[vuln.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 p-4 bg-bg border border-pixel-green/20 relative rounded-sm overflow-hidden">
                        <button onClick={() => handleCopy(vuln.id, vuln.fix)} className="absolute top-2 right-2 text-[8px] border border-pixel-border px-2 py-1 bg-bg2 rounded-sm hover:text-pixel-green">{copiedFixId === vuln.id ? "COPIED" : "COPY"}</button>
                        <pre className="whitespace-pre-wrap text-[11px] text-muted mt-4 font-mono leading-relaxed">{vuln.fix}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chatbot Side-Drawer (Optimized) ── */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0, width: chatSize === 'full' ? '100%' : '50%' }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed top-[73px] right-0 bottom-0 z-50 flex flex-col bg-bg/95 backdrop-blur-xl border-l border-pixel-border shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-8 py-5 border-b border-pixel-border bg-bg3/90">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-pixel-purple" />
                  <span className="font-press-start text-[0.6rem] text-pixel-purple uppercase">AI Sentinel Center</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setChatSize(chatSize === 'half' ? 'full' : 'half')} className="text-muted hover:text-pixel-blue transition-colors p-1 bg-bg2/50 rounded-sm border border-pixel-border">
                    {chatSize === 'half' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="text-muted hover:text-pixel-red transition-colors p-1 bg-bg2/50 rounded-sm border border-pixel-border">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 scrollbar-thin">
                {chatHistory.length === 0 && (
                  <div className="h-[300px] flex flex-col items-center justify-center opacity-20 grayscale scale-90">
                    <Sparkles className="w-20 h-20 mb-6 text-pixel-purple" />
                    <p className="font-mono text-sm uppercase tracking-[0.4em]">Strategic Support Online</p>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] p-6 rounded-sm border ${chat.role === "user" ? "bg-bg2 border-pixel-border text-pixel-blue" : "bg-[#110e19] border-pixel-purple/30 text-pixel-text shadow-[0_0_20px_rgba(163,113,247,0.05)]"}`}>
                      {chat.role === "ai" ? <div className="prose prose-invert prose-code:bg-bg prose-pre:bg-bg max-w-none font-mono text-sm leading-relaxed"><ReactMarkdown>{chat.text}</ReactMarkdown></div> : <p className="font-mono text-sm">{chat.text}</p>}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                ))}
                {loadingChat && <div className="flex items-center gap-4 text-pixel-purple font-mono text-xs animate-pulse font-bold tracking-widest"><Loader2 className="w-4 h-4 animate-spin" /> EXECUTING DEFENSIVE LOGIC...</div>}
              </div>

              {/* Chat Input Layer */}
              <div className="p-8 bg-bg2 border-t border-pixel-border shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <input type="text" value={promptInput} onChange={(e) => setPromptInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()} placeholder="Inquire about patch logic or vulnerability origins..." className="flex-1 bg-bg border border-pixel-border p-4 font-mono text-sm outline-none focus:border-pixel-purple transition-all rounded-sm placeholder:opacity-30" />
                  <button onClick={handleSendPrompt} disabled={loadingChat} className="bg-pixel-purple text-white p-4 hover:scale-105 transition-all shadow-[0_0_20px_rgba(163,113,247,0.35)] disabled:opacity-30 rounded-sm">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble */}
        <button onClick={() => { setIsChatOpen(true); setChatSize('half'); }} className={`fixed bottom-8 right-8 w-16 h-16 bg-bg2 border border-pixel-purple/50 text-pixel-purple flex items-center justify-center hover:bg-pixel-purple hover:text-white transition-all shadow-[0_0_40px_rgba(163,113,247,0.2)] z-40 rounded-full group ${isChatOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </main>

      {/* Global CSS for Highlights & Editor */}
      <style jsx global>{`
        .vulnerable-line-highlight { background: rgba(255, 95, 86, 0.12) !important; }
        .vulnerable-glyph { background: #ff5f56 !important; width: 4px !important; margin-left: 2px !important; border-radius: 1px; box-shadow: 0 0 8px rgba(255, 95, 86, 0.4); }
        .fixed-line-highlight { background: rgba(34, 197, 94, 0.12) !important; }
        .fixed-glyph { background: #22c55e !important; width: 4px !important; margin-left: 2px !important; border-radius: 1px; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0b; }
        ::-webkit-scrollbar-thumb { background: #1a1a1c; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a2c; }
      `}</style>
    </div>
  );
}
