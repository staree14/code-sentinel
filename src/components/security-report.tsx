"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertOctagon, Info, ChevronDown, ChevronUp, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Vulnerability, Severity } from "@/lib/mock-analysis";

const SEVERITY_META: Record<Severity, { label: string; color: string; Icon: LucideIcon }> = {
  critical: { label: "Critical", color: "#ef4444", Icon: AlertOctagon },
  high:     { label: "High",     color: "#f97316", Icon: AlertTriangle },
  medium:   { label: "Medium",   color: "#f59e0b", Icon: AlertTriangle },
  low:      { label: "Low",      color: "#22c55e", Icon: Info },
};

function VulnCard({ v }: { v: Vulnerability }) {
  const [open, setOpen] = useState(false);
  const meta = SEVERITY_META[v.severity.toLowerCase() as Severity] || SEVERITY_META.low;
  const Icon = meta.Icon;

  return (
    <motion.div
      layout
      className="pixel-border overflow-hidden cursor-pointer"
      style={{
        background: "var(--bg2)",
        boxShadow: open 
          ? `-2px 0 0 0 ${meta.color}, 2px 0 0 0 ${meta.color}, 0 -2px 0 0 ${meta.color}, 0 2px 0 0 ${meta.color}`
          : `-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)`,
        transition: "all 0.25s",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      {/* card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style={{ background: meta.color + "15" }}
        >
          <Icon size={15} color={meta.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-press-start" style={{ fontSize: "0.6rem", color: "var(--text)" }}>{v.title}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: meta.color + "18", color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-xs font-mono" style={{ color: "#444" }}>
              {v.cwe}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#555" }}>
            Line {v.line} · {v.category}
          </div>
        </div>

        <div style={{ color: "#333" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="text-xs leading-relaxed mt-4 mb-4" style={{ color: "#A0A0A0" }}>
                {v.description}
              </p>

              {/* fix suggestion */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: "rgba(34,197,94,0.04)",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-2 flex items-center gap-1"
                  style={{ color: "#22c55e" }}
                >
                  <ShieldCheck size={12} />
                  Suggested Fix
                </p>
                <pre
                  className="text-xs leading-relaxed overflow-x-auto"
                  style={{ color: "#ccc", fontFamily: "var(--font-geist-mono)" }}
                >
                  {v.fix}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Props {
  vulnerabilities: Vulnerability[];
}

export function SecurityReport({ vulnerabilities }: Props) {
  const [filter, setFilter] = useState<Severity | "all">("all");

  const counts = {
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    high:     vulnerabilities.filter((v) => v.severity === "high").length,
    medium:   vulnerabilities.filter((v) => v.severity === "medium").length,
    low:      vulnerabilities.filter((v) => v.severity === "low").length,
  };

  const filtered =
    filter === "all" ? vulnerabilities : vulnerabilities.filter((v) => v.severity === filter);

  return (
    <div>
      {/* summary row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(["all", "critical", "high", "medium", "low"] as const).map((s) => {
          const active = filter === s;
          const meta = s !== "all" ? SEVERITY_META[s.toLowerCase() as Severity] : null;
          const count = s === "all" ? vulnerabilities.length : counts[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 font-press-start transition-all"
              style={{
                fontSize: "0.45rem",
                background: active
                  ? meta
                    ? meta.color + "18"
                    : "rgba(255,255,255,0.08)"
                  : "var(--bg2)",
                border: `1px solid ${
                  active
                    ? meta
                      ? meta.color + "44"
                      : "var(--border)"
                    : "transparent"
                }`,
                boxShadow: active ? `2px 2px 0 ${meta ? meta.color : "var(--border)"}` : "none",
                color: active ? (meta ? meta.color : "var(--text)") : "var(--muted)",
              }}
            >
              {s === "all" ? "All" : SEVERITY_META[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* cards */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
            >
              <VulnCard v={v} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
