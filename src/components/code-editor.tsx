"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Cpu, Zap } from "lucide-react";
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
  "claude-haiku-3":   "#22c55e",
  "claude-sonnet-3-5": "#00E5FF",
  "claude-opus-3":    "#9333EA",
};

interface Props {
  onResult: (r: AnalysisResult) => void;
}

export function CodeEditor({ onResult }: Props) {
  const [code, setCode]         = useState(SAMPLE_CODE);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]     = useState<AnalysisResult | null>(null);
  const editorRef               = useRef<string>(SAMPLE_CODE);

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);
    // simulate network + model latency
    await new Promise((r) => setTimeout(r, 2400));
    const res = getMockAnalysis(editorRef.current);
    setResult(res);
    setAnalyzing(false);
    onResult(res);
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
                ${result.costUsd.toFixed(4)} · {result.durationMs} ms
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
