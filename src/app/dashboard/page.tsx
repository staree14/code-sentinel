"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Code, GitBranch, Terminal, AlertTriangle, ShieldCheck, FileCode2, Loader2, Send, Sparkles, Activity, Wrench, Bot, CheckCircle, Check, Copy, Maximize2, Minimize2, X, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
import { Nav } from "@/components/nav";

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
  routing_decision: { model_used: string; reason: string; intent_detected: string; complexity_rank: string };
  performance_metrics: { tokens_processed: number; latency_sec: number; speed_improvement_vs_pro: string };
  business_impact: { dollars_saved: string; cost_reduction_percentage: string; projected_monthly_savings: string };
  security_scan: { risk_level: string; pii_detected: boolean };
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (!email) router.push("/login");
  }, []);

  // Scanner state
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "repo">("paste");
  const [code, setCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const [results, setResults] = useState<Vulnerability[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStage, setScanStage] = useState<"idle" | "simulating" | "analyzing">("idle");
  const [attackLogs, setAttackLogs] = useState<{ type: "attacker" | "defender"; msg: string; time: string }[]>([]);

  // UI state
  const [expandedFixes, setExpandedFixes] = useState<Record<string, boolean>>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSize, setChatSize] = useState<"half" | "full">("half");
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);
  const [fixedVulnIds, setFixedVulnIds] = useState<string[]>([]);
  const [showBotGreeting, setShowBotGreeting] = useState(true);

  // Risk Tags Helper
  const getRiskTag = (vuln: Vulnerability) => {
    const cat = (vuln.category || "").toLowerCase();
    const title = vuln.title.toLowerCase();
    const desc = vuln.description.toLowerCase();

    if (cat.includes("iam") || title.includes("iam") || desc.includes("iam") || title.includes("policy") || desc.includes("access")) 
      return { label: "IAM ACCESS", color: "border-pixel-blue text-pixel-blue bg-pixel-blue/5" };
    if (cat.includes("iac") || title.includes("terraform") || title.includes("cloudformation") || desc.includes("infrastructure")) 
      return { label: "IaC RISK", color: "border-pixel-purple text-pixel-purple bg-pixel-purple/5" };
    if (cat.includes("docker") || title.includes("docker") || desc.includes("container") || title.includes("k8s")) 
      return { label: "DOCKER RISK", color: "border-aws-orange text-aws-orange bg-aws-orange/5" };
    if (cat.includes("network") || title.includes("port") || title.includes("ingress") || desc.includes("network") || title.includes("ddos") || desc.includes("ddos")) 
      return { label: "DDOS RISK", color: "border-pixel-red text-pixel-red bg-pixel-red/5" };
    
    return { label: "CODE RISK", color: "border-pixel-green text-pixel-green bg-pixel-green/5" };
  };


  // Chat state
  const [promptInput, setPromptInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [latestAnalytics, setLatestAnalytics] = useState<AnalyticsData | null>(null);

  // Monaco refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const simDecorationsRef = useRef<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Monaco decorations
  const updateDecorations = () => {
    if (!editorRef.current || !monacoRef.current || !results) {
      if (editorRef.current && monacoRef.current)
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      return;
    }
    const newDecorations: any[] = [];
    const model = editorRef.current.getModel();
    if (!model) return;
    results.forEach(vuln => {
      const isFixed = fixedVulnIds.includes(vuln.id);
      const snippet = isFixed ? vuln.fixed_snippet : vuln.original_snippet;
      if (!snippet) return;
      model.findMatches(snippet, false, false, true, null, true).forEach((match: any) => {
        newDecorations.push({
          range: match.range,
          options: {
            isWholeLine: true,
            className: isFixed ? "fixed-line-highlight" : "vulnerable-line-highlight",
            glyphMarginClassName: isFixed ? "fixed-glyph" : "vulnerable-glyph",
            hoverMessage: { value: isFixed ? `**[FIXED]** ${vuln.title}` : `**[${vuln.severity}]** ${vuln.title}` },
          },
        });
      });
    });
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    const t = setTimeout(() => updateDecorations(), 50);
    return () => clearTimeout(t);
  }, [results, fixedVulnIds, code]);

  useEffect(() => {
    // Keep it always visible as requested
    setShowBotGreeting(true);
  }, []);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatOpen]);

  useEffect(() => {
    document.body.style.overflow = isChatOpen && chatSize === "full" ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isChatOpen, chatSize]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("codesentinel-v2", {
      base: "vs-dark", inherit: true, rules: [],
      colors: { "editor.background": "#0a0a0b", "editorGutter.background": "#0a0a0b", "editor.lineHighlightBackground": "#18181b" },
    });
    monaco.editor.setTheme("codesentinel-v2");
    updateDecorations();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) { setScanError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`); return; }
    setScanError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content.length > 50000) { setScanError("File too dense for quick scan."); return; }
      setCode(content);
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    const payload = activeTab === "repo" ? `Analyze this GitHub Repository URL: ${repoUrl}` : code;
    if (!payload) return setScanError("Please provide code or a repo URL.");
    if (activeTab !== "repo" && code.length > MAX_PASTE_CHARS) return setScanError(`Exceeds ${MAX_PASTE_CHARS} char limit.`);
    setLoadingScan(true); setScanError(null); setResults(null); setFixedVulnIds([]);
    try {
      const res = await fetch("http://localhost:8000/api/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Scan failed.");
      setResults(data.vulnerabilities);
    } catch (err: any) { setScanError(err.message); }
    finally { setLoadingScan(false); setScanStage("idle"); }
  };
  
  const handleSimulateAttack = async () => {
    const payload = activeTab === "repo" ? `Analyze this GitHub Repository URL: ${repoUrl}` : code;
    if (!payload) return setScanError("Please provide code or a repo URL.");
    if (activeTab !== "repo" && code.length > MAX_PASTE_CHARS) return setScanError(`Exceeds ${MAX_PASTE_CHARS} char limit.`);

    setResults(null); setFixedVulnIds([]); setScanError(null);
    setScanStage("simulating");
    setAttackLogs([]);
    
    // Attack Stages narrative
    const addLog = (type: "attacker" | "defender", msg: string) => {
      const time = `00:0${Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 900) + 100}`;
      setAttackLogs(prev => [...prev, { type, msg, time }]);
    };

    setTimeout(() => addLog("attacker", "Initiating adversarial probe..."), 200);
    setTimeout(() => addLog("attacker", "Scanning for credential exposure..."), 600);
    setTimeout(() => addLog("attacker", "Probing lines for hardcoded secrets..."), 1000);
    
    // Stage 1: Simulate Attack (with highlights)
    const lineCount = code.split("\n").length;
    const interval = setInterval(() => {
      if (!editorRef.current) return;
      const randomLine = Math.floor(Math.random() * lineCount) + 1;
      const newDecs = [{
        range: new monacoRef.current.Range(randomLine, 1, randomLine, 1),
        options: { isWholeLine: true, className: "attacker-scan-highlight", glyphMarginClassName: "attacker-glyph" }
      }];
      simDecorationsRef.current = editorRef.current.deltaDecorations(simDecorationsRef.current, newDecs);
    }, 150);

    await new Promise(r => setTimeout(r, 2500));
    clearInterval(interval);
    if (editorRef.current) simDecorationsRef.current = editorRef.current.deltaDecorations(simDecorationsRef.current, []);
    
    addLog("defender", "Escalating to Bedrock Nova Pro (CRITICAL severity)");
    addLog("defender", "Generating mitigation strategy for detected vectors...");
    
    setScanStage("analyzing");
    
    // Stage 2: Deep Analysis
    handleScan();
  };

  const explainVulnerability = (title: string, desc: string) => {
    setPromptInput(`As a security instructor, explain this threat:\n\nTitle: ${title}\nDescription: ${desc}`);
    setIsChatOpen(true);
  };

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) return;
    const text = promptInput; setPromptInput(""); setIsChatOpen(true);
    setChatHistory(prev => [...prev, { role: "user", text }]);
    setLoadingChat(true);
    try {
      const res = await fetch("http://localhost:8000/process", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
      setLatestAnalytics({ routing_decision: data.routing_decision, performance_metrics: data.performance_metrics, business_impact: data.business_impact, security_scan: data.security_scan });
      setShowAnalytics(true);
    } catch (err: any) { setChatHistory(prev => [...prev, { role: "ai", text: `Error: ${err.message}` }]); }
    finally { setLoadingChat(false); }
  };

  const handleApplyFix = (original: string, fixed: string, vulnId?: string) => {
    if (!original || !fixed) return;
    setCode(prev => {
      const next = prev.replace(original, fixed) !== prev ? prev.replace(original, fixed) : prev.replace(original.trim(), fixed.trim());
      if (next !== prev) { 
        if (vulnId) setFixedVulnIds(ids => [...ids, vulnId]); 
        setTimeout(() => updateDecorations(), 10);
        return next; 
      }
      setScanError("Auto-fix mismatch. Try copying manually."); return prev;
    });
  };

  const toggleFix = (id: string) => setExpandedFixes(prev => ({ ...prev, [id]: !prev[id] }));
  const handleCopy = (id: string, text: string) => { navigator.clipboard.writeText(text); setCopiedFixId(id); setTimeout(() => setCopiedFixId(null), 2000); };

  const downloadReport = () => {
    if (!results) return;
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let report = `CODESENTINEL V2 SECURITY ANALYSIS REPORT\n`;
    report += `========================================\n`;
    report += `Generated: ${timestamp}\n`;
    report += `Risk Level: ${latestAnalytics?.security_scan?.risk_level || "CALCULATED"}\n`;
    report += `Target: ${activeTab === 'repo' ? repoUrl : 'Pasted Code / Upload'}\n`;
    report += `Total Vulnerabilities: ${results.length}\n\n`;

    results.forEach((v, i) => {
      report += `[VULNERABILITY ${i + 1}: ${v.id}]\n`;
      report += `TITLE: ${v.title}\n`;
      report += `SEVERITY: ${v.severity}\n`;
      report += `CATEGORY: ${v.category || 'N/A'}\n`;
      report += `CWE: ${v.cwe || 'N/A'}\n`;
      report += `LINE: ${v.line || 'Unknown'}\n`;
      report += `DESCRIPTION: ${v.description}\n`;
      report += `REMEDIATION: ${v.fix}\n`;
      report += `----------------------------------------\n\n`;
    });

    report += `\nDISCLAIMER: This report is generated by CodeSentinel AI (Bedrock Nova). Always verify fixes before production push.`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesentinel_report_${timestamp.split(' ')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-pixel-text font-ibm-plex overflow-hidden">
      <Nav />

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-bg3 border-b border-pixel-border z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-pixel-green" />
          <h1 className="font-press-start text-[0.65rem] text-pixel-green tracking-widest mt-1">SECURITY DASHBOARD</h1>
        </div>
        <button onClick={() => setShowAnalytics(!showAnalytics)} className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-mono transition-colors ${showAnalytics ? "bg-pixel-blue/10 border-pixel-blue text-pixel-blue" : "border-pixel-border text-muted hover:text-pixel-text"}`}>
          <Activity className="w-4 h-4" /> ANALYTICS {showAnalytics ? "ON" : "OFF"}
        </button>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative">
        <div className={`flex w-full transition-all duration-500 ${isChatOpen && chatSize === "full" ? "opacity-20 pointer-events-none" : "opacity-100"}`}>

          {/* Left: Editor */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-pixel-border">
            <div className="max-w-2xl mx-auto pb-12">
              <div className="flex gap-3 mb-8 border-b border-pixel-border pb-6">
                {(["paste", "upload", "repo"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm rounded-sm flex items-center gap-3 transition-colors ${activeTab === tab ? "bg-pixel-green/10 text-pixel-green border border-pixel-green/30 font-bold" : "text-muted hover:text-pixel-text"}`}>
                    {tab === "paste" ? <><Code className="w-5 h-5" /> PASTE</> : tab === "upload" ? <><Upload className="w-5 h-5" /> UPLOAD</> : <><GitBranch className="w-5 h-5" /> REPO URL</>}
                  </button>
                ))}
              </div>

              <div className="min-h-[400px] mb-6">
                {(activeTab === "paste" || (activeTab === "upload" && code)) && (
                  <div className="flex flex-col gap-2">
                    <div className="w-full h-[450px] bg-bg2 border border-pixel-border overflow-hidden rounded-sm">
                      <Editor height="100%" defaultLanguage="python" value={code} onMount={handleEditorMount} onChange={v => setCode(v || "")}
                        options={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", minimap: { enabled: false }, glyphMargin: true, padding: { top: 16 } }} />
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
                    <label className="px-6 py-2 bg-pixel-border cursor-pointer border border-pixel-border text-xs rounded-sm uppercase font-bold">
                      Browse Files <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
                {activeTab === "repo" && (
                  <div className="w-full h-[450px] flex flex-col justify-center bg-bg2/40 p-8 border border-pixel-border rounded-sm">
                    <label className="text-xs text-pixel-blue mb-2 font-mono uppercase">Target Repository URL</label>
                    <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/staree14/code-sentinel"
                      className="w-full bg-bg border border-pixel-blue/40 p-4 font-mono text-sm outline-none focus:border-pixel-blue transition-colors rounded-sm" />
                  </div>
                )}
              </div>

              {scanError && <div className="mb-4 p-4 bg-pixel-red/10 border border-pixel-red/40 text-pixel-red text-xs flex items-center gap-3"><AlertTriangle className="w-4 h-4" /> {scanError}</div>}

              <div className="flex flex-col gap-3">
                <button onClick={handleSimulateAttack} disabled={scanStage !== "idle" || code.length > MAX_PASTE_CHARS}
                  className={`w-full py-4 text-white font-press-start text-[0.6rem] disabled:opacity-50 flex items-center justify-center gap-3 transition-all rounded-sm relative overflow-hidden group shadow-[0_0_30px_rgba(255,0,0,0.25)] ${scanStage === "idle" ? "simulate-attack-btn" : "bg-pixel-purple"}`}>
                  {scanStage === "simulating" ? (
                    <><Activity className="w-4 h-4 animate-pulse" /> ATTACKER_SCANNING_SOFT_SPOTS...</>
                  ) : scanStage === "analyzing" ? (
                    <><Sparkles className="w-4 h-4 animate-spin" /> GENERATING DEFENSE STRATEGY...</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 group-hover:animate-bounce" /> SIMULATE ATTACK DEMO</>
                  )}
                  {scanStage !== "idle" && (
                    <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  )}
                </button>

                {scanStage !== "idle" && (
                  <div className="attack-log h-[120px] overflow-y-auto bg-bg3 border border-pixel-red/20 p-4 font-mono text-[10px] space-y-1 mb-2 scroll-smooth">
                    {attackLogs.map((log, i) => (
                      <div key={i} className="log-entry flex gap-2">
                        <span className="timestamp text-muted shrink-0">{log.time}</span>
                        <span className={`attacker font-bold shrink-0 ${log.type === "attacker" ? "text-pixel-red" : "text-pixel-purple"}`}>
                          {log.type === "attacker" ? "🔴 ATTACKER:" : "🛡️ DEFENDER:"}
                        </span>
                        <span className="text-white/90">{log.msg}</span>
                      </div>
                    ))}
                    {scanStage === "simulating" && <div className="animate-pulse text-muted italic">Scanning internal data structures...</div>}
                  </div>
                )}

                <button onClick={handleScan} disabled={scanStage !== "idle" || code.length > MAX_PASTE_CHARS}
                  className="w-full py-3 border border-pixel-green/30 text-pixel-green text-[0.55rem] font-press-start hover:bg-pixel-green/5 disabled:opacity-30 disabled:border-pixel-border transition-all flex items-center justify-center gap-2 rounded-sm">
                  <ShieldCheck className="w-3 h-3" /> LAUNCH STANDARD SCAN
                </button>

                {results && (
                  <button onClick={downloadReport}
                    className="w-full py-3 border border-pixel-blue/30 text-pixel-blue text-[0.55rem] font-press-start hover:bg-pixel-blue/5 transition-all flex items-center justify-center gap-2 rounded-sm mt-2">
                    <Download className="w-3 h-3" /> DOWNLOAD SECURITY REPORT (.TXT)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-bg">
            <AnimatePresence>
              {showAnalytics && latestAnalytics && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-bg3 border-b border-pixel-border p-6 z-20">
                  <div className="font-mono space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="border border-pixel-green/30 bg-bg px-3 py-2">
                        <p className="text-[9px] text-white/70 uppercase tracking-widest">Model</p>
                        <p className="text-pixel-green text-xs font-bold">{latestAnalytics.routing_decision?.model_used}</p>
                      </div>
                      <div className="border border-pixel-border bg-bg px-3 py-2 col-span-2">
                        <p className="text-[9px] text-white/70 uppercase tracking-widest">Intent</p>
                        <p className="text-white text-xs truncate">{latestAnalytics.routing_decision?.intent_detected}</p>
                      </div>
                      <div className={`border px-3 py-2 bg-bg ${
                        latestAnalytics.security_scan?.risk_level === 'HIGH' ? 'border-pixel-red/50' :
                        latestAnalytics.security_scan?.risk_level === 'MEDIUM' ? 'border-pixel-yellow/50' : 'border-pixel-green/30'}`}>
                        <p className="text-[9px] text-white/70 uppercase tracking-widest">Criticality</p>
                        <p className={`text-xs font-black ${
                          latestAnalytics.security_scan?.risk_level === 'HIGH' ? 'text-pixel-red' :
                          latestAnalytics.security_scan?.risk_level === 'MEDIUM' ? 'text-pixel-yellow' : 'text-pixel-green'}`}>
                          {latestAnalytics.security_scan?.risk_level || 'LOW'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 border border-pixel-border bg-bg text-[11px] flex-wrap">
                      <span className="text-white/70">Latency <span className="text-pixel-blue font-bold">{latestAnalytics.performance_metrics?.latency_sec}s</span></span>
                      <span className="text-pixel-border">·</span>
                      <span className="text-white/70">Tokens <span className="text-white font-bold">{latestAnalytics.performance_metrics?.tokens_processed}</span></span>
                      <span className="text-pixel-border">·</span>
                      <span className="text-white/70">Cost Saved <span className="text-pixel-green font-bold">{latestAnalytics.business_impact?.cost_reduction_percentage}</span></span>
                      <span className="text-pixel-border">·</span>
                      <span className="text-white/70">$/mo Saved <span className="text-aws-orange font-bold">${latestAnalytics.business_impact?.projected_monthly_savings}</span></span>
                      <span className={`ml-auto text-[9px] font-bold ${latestAnalytics.security_scan?.pii_detected ? 'text-pixel-red' : 'text-pixel-green'}`}>
                        {latestAnalytics.security_scan?.pii_detected ? '⚠ PII DETECTED' : '✓ PII CLEAN'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!results && !loadingScan && (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <Sparkles className="w-16 h-16 mb-4 text-pixel-border" />
                  <p className="font-mono text-sm uppercase tracking-widest">Target Analysis Pending</p>
                </div>
              )}
              {results?.length === 0 && (
                <div className="p-6 border border-pixel-green/40 bg-pixel-green/5 text-pixel-green text-center flex flex-col items-center gap-3">
                  <ShieldCheck className="w-12 h-12" />
                  <span className="font-press-start text-[0.6rem]">CODE SECURE</span>
                  <span className="font-mono text-sm">No vulnerabilities detected.</span>
                </div>
              )}
              {results?.map((vuln, i) => (
                <div key={i} className="border border-pixel-border bg-bg2 p-5 font-mono hover:border-pixel-red/40 transition-all rounded-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-pixel-blue text-[10px]">{vuln.id}</span>
                        {(() => {
                          const tag = getRiskTag(vuln);
                          return <span className={`text-[10px] px-2 py-0.5 border font-bold rounded-sm ${tag.color}`}>{tag.label}</span>;
                        })()}
                      </div>
                      <h3 className="text-pixel-text text-base font-bold">{vuln.title}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-1 border ${vuln.severity === "CRITICAL" ? "border-pixel-red text-pixel-red bg-pixel-red/10" : vuln.severity === "HIGH" ? "border-aws-orange text-aws-orange bg-aws-orange/10" : vuln.severity === "MEDIUM" ? "border-pixel-yellow text-pixel-yellow bg-pixel-yellow/10" : "border-pixel-green text-pixel-green bg-pixel-green/10"}`}>[{vuln.severity}]</span>
                  </div>
                  <div className="flex gap-4 mb-3 text-xs text-muted border-b border-pixel-border/50 pb-3">
                    {vuln.category && <span>CAT: {vuln.category}</span>}
                    {vuln.cwe && <span>CWE: {vuln.cwe}</span>}
                    {vuln.line && <span>L:{vuln.line}</span>}
                  </div>
                  <p className="text-xs text-pixel-text/80 mb-4 leading-relaxed border-l-2 border-pixel-border pl-4">{vuln.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFix(vuln.id)} className="px-3 py-1.5 bg-bg border border-pixel-border text-[10px] flex items-center gap-2 hover:text-pixel-green transition-colors"><Wrench className="w-3 h-3" /> {expandedFixes[vuln.id] ? "HIDE FIX" : "SHOW FIX"}</button>
                    <button onClick={() => explainVulnerability(vuln.title, vuln.description)} className="px-3 py-1.5 bg-bg border border-pixel-border text-[10px] flex items-center gap-2 hover:text-pixel-purple transition-colors"><Sparkles className="w-3 h-3 text-pixel-purple" /> EXPLAIN</button>
                    <button
                      onClick={() => {
                        if (fixedVulnIds.includes(vuln.id)) return;
                        vuln.fixed_snippet
                          ? handleApplyFix(vuln.original_snippet!, vuln.fixed_snippet!, vuln.id)
                          : explainVulnerability(vuln.title, `Apply this fix to my code:\n\n${vuln.fix}`)
                      }}
                      disabled={fixedVulnIds.includes(vuln.id)}
                      className={`px-3 py-1.5 border text-[10px] font-bold flex items-center gap-2 transition-all ${
                        fixedVulnIds.includes(vuln.id) 
                          ? "bg-pixel-green text-bg border-pixel-green cursor-default" 
                          : "bg-pixel-green/10 border-pixel-green/30 text-pixel-green hover:bg-pixel-green hover:text-bg"
                      }`}>
                      {fixedVulnIds.includes(vuln.id) ? <CheckCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      {fixedVulnIds.includes(vuln.id) ? "FIXED" : vuln.fixed_snippet ? "APPLY FIX" : "QUICK FIX"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {expandedFixes[vuln.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 p-4 bg-bg border border-pixel-green/20 relative rounded-sm">
                        <button onClick={() => handleCopy(vuln.id, vuln.fix)} className="absolute top-2 right-2 text-[8px] border border-pixel-border px-2 py-1 bg-bg2 rounded-sm hover:text-pixel-green flex items-center gap-1">
                          {copiedFixId === vuln.id ? <><Check className="w-3 h-3" /> COPIED</> : <><Copy className="w-3 h-3" /> COPY</>}
                        </button>
                        <pre className="whitespace-pre-wrap text-[11px] text-muted mt-4 font-mono leading-relaxed">{vuln.fix}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat Side-Drawer ── */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0, width: chatSize === "full" ? "100%" : "50%" }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed top-[130px] right-0 bottom-0 z-50 flex flex-col bg-bg/95 backdrop-blur-xl border-l border-pixel-border shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center px-8 py-5 border-b border-pixel-border bg-bg3/90">
                <div className="flex items-center gap-3"><Bot className="w-5 h-5 text-pixel-purple" /><span className="font-press-start text-[0.6rem] text-pixel-purple">AI SENTINEL CENTER</span></div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setChatSize(chatSize === "half" ? "full" : "half")} className="text-muted hover:text-pixel-blue p-1 bg-bg2/50 rounded-sm border border-pixel-border">
                    {chatSize === "half" ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="text-muted hover:text-pixel-red p-1 bg-bg2/50 rounded-sm border border-pixel-border"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
                {chatHistory.length === 0 && (
                  <div className="h-[300px] flex flex-col items-center justify-center opacity-20"><Sparkles className="w-20 h-20 mb-6 text-pixel-purple" /><p className="font-mono text-sm uppercase tracking-[0.3em]">Ready for Analysis</p></div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] p-6 rounded-sm border ${chat.role === "user" ? "bg-bg2 border-pixel-border text-pixel-blue" : "bg-[#110e19] border-pixel-purple/30 text-pixel-text"}`}>
                      {chat.role === "ai" ? <div className="prose prose-invert max-w-none font-mono text-sm leading-relaxed"><ReactMarkdown>{chat.text}</ReactMarkdown></div> : <p className="font-mono text-sm">{chat.text}</p>}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                ))}
                {loadingChat && <div className="flex items-center gap-4 text-pixel-purple font-mono text-xs animate-pulse"><Loader2 className="w-4 h-4 animate-spin" /> EXECUTING DEFENSIVE LOGIC...</div>}
              </div>
              <div className="p-6 bg-bg2 border-t border-pixel-border">
                <div className="flex gap-4 items-center">
                  <input type="text" value={promptInput} onChange={e => setPromptInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendPrompt()}
                    placeholder="Ask about a vulnerability or request a fix..." className="flex-1 bg-bg border border-pixel-border p-4 font-mono text-sm outline-none focus:border-pixel-purple transition-all rounded-sm placeholder:opacity-30" />
                  <button onClick={handleSendPrompt} disabled={loadingChat} className="bg-pixel-purple text-white p-4 hover:scale-105 transition-all disabled:opacity-30 rounded-sm shadow-[0_0_20px_rgba(163,113,247,0.35)]"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Chat Bubble */}
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
          <AnimatePresence>
            {showBotGreeting && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-bg2 border border-pixel-purple/50 px-6 py-4 rounded-sm shadow-[0_0_30px_rgba(163,113,247,0.15)] relative mb-2"
              >
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-bg2 border-b border-r border-pixel-purple/50 rotate-45"></div>
                <p className="text-sm font-bold font-mono whitespace-nowrap text-pixel-purple flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  I AM YOUR SMART PROMPT ROUTER
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => { setIsChatOpen(true); setChatSize("half"); }}
            className={`w-16 h-16 bg-bg2 border border-pixel-purple/50 text-pixel-purple flex items-center justify-center hover:bg-pixel-purple hover:text-white transition-all shadow-[0_0_40px_rgba(163,113,247,0.2)] rounded-full group ${isChatOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </main>

      <style jsx global>{`
        .vulnerable-line-highlight { background: rgba(255,95,86,0.12) !important; }
        .vulnerable-glyph { background: #ff5f56 !important; width: 4px !important; margin-left: 2px !important; border-radius: 1px; }
        .fixed-line-highlight { background: rgba(34,197,94,0.15) !important; border-left: 2px solid #22c55e; }
        .fixed-glyph { background: #22c55e !important; width: 4px !important; margin-left: 2px !important; border-radius: 1px; }
        .attacker-scan-highlight { background: rgba(163,113,247,0.2) !important; border-top: 1px solid rgba(163,113,247,0.4); border-bottom: 1px solid rgba(163,113,247,0.4); }
        .attacker-glyph { background: #a371f7 !important; width: 4px !important; margin-left: 2px !important; border-radius: 1px; box-shadow: 0 0 10px #a371f7; }
        
        .monaco-editor .margin-view-overlays .vulnerable-glyph:before { content: "!"; color: white; font-size: 8px; font-weight: bold; position: absolute; left: -2px; top: 2px; }
        .monaco-editor .margin-view-overlays .attacker-glyph:before { content: "☠"; color: white; font-size: 10px; position: absolute; left: -3px; top: 1px; }

        .attack-log::-webkit-scrollbar { width: 4px; }
        .attack-log::-webkit-scrollbar-track { background: #0a0a0b; }
        .attack-log::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }

        .simulate-attack-btn {
          background: linear-gradient(135deg, #ff0000, #8b0000) !important;
          animation: pulse-danger 2s infinite;
          border: 1px solid #ff0000 !important;
        }
        .simulate-attack-btn:hover {
          background: linear-gradient(135deg, #ff3333, #cc0000) !important;
          box-shadow: 0 6px 25px rgba(255, 0, 0, 0.6) !important;
        }
        @keyframes pulse-danger {
          0%, 100% { box-shadow: 0 4px 15px rgba(255, 0, 0, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(255, 0, 0, 0.8); }
        }
      `}</style>
    </div>
  );
}
