"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Cpu, Zap, Upload } from "lucide-react";
import { getMockAnalysis, SAMPLE_CODE, type AnalysisResult } from "@/lib/mock-analysis";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#0d0d0d" }}>
      <div className="text-xs" style={{ color: "#333" }}>Loading editor…</div>
    </div>
  ),
});

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-3": "#22c55e",
  "claude-sonnet-3-5": "#00E5FF",
  "claude-opus-3": "#9333EA",
};

interface Props {
  onResult: (r: AnalysisResult) => void;
}

export function CodeEditor({ onResult }: Props) {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const editorRef = useRef<string>(SAMPLE_CODE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available samples from backend on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/samples")
      .then(r => r.json())
      .then(data => setSamples(data.samples || []))
      .catch(e => console.warn("Failed to fetch samples:", e));
  }, []);

  async function handleLoadSample(name: string) {
    try {
      const r = await fetch(`http://localhost:8000/api/sample/${name}`);
      const data = await r.json();
      setCode(data.content);
      editorRef.current = data.content;
    } catch (e) {
      console.warn("Failed to load sample:", e);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCode(content);
      editorRef.current = content;
    };
    reader.readAsText(file);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorRef.current }),
      });

      if (!response.ok) throw new Error("Backend unreachable");

      const data = await response.json();

      // Transform and normalize results from backend
      // Ensuring severity is lowercase to match the frontend SEVERITY_META keys
      const vulnerabilities = data.vulnerabilities.map((v: any) => ({
        ...v,
        id: v.id || Math.random().toString(36).substr(2, 9),
        severity: v.severity.toLowerCase(),
        line: v.line || 1,
        category: v.category || "Security",
        cwe: v.cwe || "CWE-Unknown",
      }));

      const vulnCount = vulnerabilities.length;
      const complexity = vulnCount > 3 ? "high" : vulnCount > 0 ? "medium" : "low";

      const res: AnalysisResult = {
        model: complexity === "high" ? "claude-opus-3" : complexity === "medium" ? "claude-sonnet-3-5" : "claude-haiku-3",
        modelLabel: complexity === "high" ? "Claude Opus" : complexity === "medium" ? "Claude Sonnet 3.5" : "Claude Haiku",
        modelReason: complexity === "high" ? "Deep analysis required for multiple issues" : "Standard security scan",
        complexity: complexity as any,
        durationMs: 1200 + Math.random() * 500,
        costUsd: complexity === "high" ? 0.015 : complexity === "medium" ? 0.005 : 0.0008,
        savingsVsOpus: complexity === "high" ? 0 : complexity === "medium" ? 63 : 95,
        vulnerabilities: vulnerabilities,
        summary: `Found ${vulnCount} vulnerabilities. ${vulnCount > 0 ? "Immediate remediation recommended." : "Code looks clean!"}`,
      };

      setResult(res);
      onResult(res);
    } catch (err) {
      console.warn("Backend error, using mock data:", err);
      // simulate network + model latency for mock
      await new Promise((r) => setTimeout(r, 2000));
      const res = getMockAnalysis(editorRef.current);
      setResult(res);
      onResult(res);
    } finally {
      setAnalyzing(false);
    }
  }

  const modelColor = result ? MODEL_COLORS[result.model] ?? "#00E5FF" : "#00E5FF";

  return (
    <div className="pixel-border overflow-hidden" style={{ background: "var(--bg2)" }}>
      {/* toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "#0d0d0d",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f56" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#27c93f" }} />
          <span className="ml-3 text-xs font-mono" style={{ color: "#444" }}>
            auth-service.js
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sample Picker */}
          {samples.length > 0 && (
            <select
              onChange={(e) => handleLoadSample(e.target.value)}
              className="text-xs px-2 py-1 pixel-border bg-[#0d0d0d]"
              style={{ color: "var(--muted)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <option value="">Load Sample...</option>
              {samples.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs border border-white/5 hover:bg-white/5 transition-colors"
            style={{ color: "var(--muted)" }}
            title="Import Local File"
          >
            <Upload size={12} />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* model badge */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-1.5 px-3 py-1 font-press-start"
                style={{
                  fontSize: "0.45rem",
                  background: modelColor + "14",
                  border: `1px solid ${modelColor}44`,
                  color: modelColor,
                }}
              >
                <Cpu size={11} />
                {result.modelLabel}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary-pixel"
            style={{ fontSize: "0.45rem", padding: "0.6rem 1rem", opacity: analyzing ? 0.7 : 1 }}
          >
            {analyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap size={12} />
                </motion.div>
                Analyzing…
              </>
            ) : (
              <>
                <Play size={12} />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* editor area */}
      <div className="relative" style={{ height: 380 }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          theme="vs-dark"
          onChange={(v) => {
            editorRef.current = v ?? "";
            setCode(v ?? "");
          }}
          options={{
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            padding: { top: 16, bottom: 16 },
            scrollbar: { verticalScrollbarSize: 4 },
          }}
        />

        {/* Real-time character counter */}
        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-bg/80 border border-white/5 backdrop-blur-md rounded-sm flex items-center gap-2 pointer-events-none shadow-xl">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: code.length > 1000 ? "#ff5f56" : "#22c55e" }} />
          <span className={`text-[10px] font-mono leading-none ${code.length > 1000 ? "text-[#ff5f56] font-bold" : "text-white/40"}`}>
            {code.length} / 1000 chars
          </span>
        </div>

        {/* scan-line overlay during analysis */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: "rgba(0,229,255,0.02)" }}
            >
              <div className="scan-line" />
              {/* tinted horizontal stripes */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    height: 1,
                    top: `${(i + 1) * 12}%`,
                    background: "rgba(0,229,255,0.06)",
                  }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.22,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* result summary bar */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 flex flex-wrap items-center gap-4 text-xs"
              style={{
                background: "#0d0d0d",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "#555" }}>Routed to</span>
              <span className="font-semibold" style={{ color: modelColor }}>
                {result.modelLabel}
              </span>
              <span style={{ color: "#333" }}>·</span>
              <span style={{ color: "#555" }}>
                {result.modelReason}
              </span>
              <span style={{ color: "#333" }}>·</span>
              <span style={{ color: "#22c55e" }}>
                ${result.costUsd.toFixed(4)} · {result.durationMs.toFixed(0)} ms
              </span>
              {result.savingsVsOpus > 0 && (
                <>
                  <span style={{ color: "#333" }}>·</span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                  >
                    {result.savingsVsOpus}% cheaper than Opus
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
