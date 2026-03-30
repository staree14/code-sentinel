"use client";

import { motion } from "framer-motion";
import { type LucideIcon, Upload, ShieldCheck, Cpu, GitBranch, Search, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface Step {
  id: number;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  aws: string;
  desc: string;
  isKey?: boolean;
}

const STEPS: Step[] = [
  {
    id: 0,
    icon: Upload,
    title: "CODE UPLOAD",
    subtitle: "Encrypted S3 ingestion",
    aws: "Amazon S3",
    desc: "Submitted via API Gateway, encrypted at rest with AWS KMS",
  },
  {
    id: 1,
    icon: ShieldCheck,
    title: "CONTEXT AGENT",
    subtitle: "Domain & threat modeling",
    aws: "AWS Lambda",
    desc: "Detects domain (FinTech/HealthTech), builds custom PCI-DSS / HIPAA / OWASP checklist",
    isKey: true,
  },
  {
    id: 2,
    icon: Cpu,
    title: "AI CLASSIFIER",
    subtitle: "Complexity scoring",
    aws: "AWS Lambda",
    desc: "Scores complexity via AST parsing, token count, and security surface area",
  },
  {
    id: 3,
    icon: GitBranch,
    title: "MODEL ROUTER",
    subtitle: "Context-aware selection",
    aws: "AWS Bedrock",
    desc: "Routes to optimal Claude model using classifier score + domain context",
  },
  {
    id: 4,
    icon: Search,
    title: "SECURITY ANALYSIS",
    subtitle: "Deep vulnerability review",
    aws: "AWS Bedrock",
    desc: "Claude performs domain-aware review using the custom security checklist",
  },
  {
    id: 5,
    icon: FileCheck,
    title: "REPORT",
    subtitle: "Prioritized findings",
    aws: "Amazon DynamoDB",
    desc: "Vulnerabilities ranked by severity with line-specific fix suggestions",
  },
];

const MODELS = [
  { name: "Claude Haiku",  label: "SIMPLE",  color: "#39d353", cost: "$0.001", saving: "95%" },
  { name: "Claude Sonnet", label: "MEDIUM",  color: "#58a6ff", cost: "$0.006", saving: "60%" },
  { name: "Claude Opus",   label: "COMPLEX", color: "#bc8cff", cost: "$0.015", saving: "—"   },
];

/* ── Step card ───────────────────────────────────────────────────────── */
function StepCard({ step, active, stepNum }: { step: Step; active: boolean; stepNum: number }) {
  const Icon = step.icon;
  const borderColor = step.isKey
    ? active ? "#bc8cff" : "#30363d"
    : active ? "#39d353" : "#30363d";
  const glowColor = step.isKey
    ? "rgba(188,140,255,0.25)"
    : "rgba(57,211,83,0.2)";

  return (
    <motion.div
      className="flex flex-col p-5 cursor-default"
      style={{ minHeight: "220px", background: "var(--bg2)" }}
      animate={{
        boxShadow: active
          ? `-2px 0 0 0 ${borderColor}, 2px 0 0 0 ${borderColor}, 0 -2px 0 0 ${borderColor}, 0 2px 0 0 ${borderColor}, 0 0 24px ${glowColor}`
          : `-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)`,
        background: active
          ? step.isKey ? "rgba(188,140,255,0.06)" : "rgba(57,211,83,0.04)"
          : "var(--bg2)",
      }}
      transition={{ duration: 0.3 }}
    >
      {/* header */}
      <div className="flex items-start justify-between mb-3">
        <motion.div
          className="w-10 h-10 flex items-center justify-center"
          animate={{
            background: active
              ? step.isKey ? "rgba(188,140,255,0.15)" : "rgba(57,211,83,0.12)"
              : "rgba(48,54,61,0.6)",
          }}
        >
          <Icon
            size={18}
            color={active ? (step.isKey ? "#bc8cff" : "#39d353") : "#7d8590"}
          />
        </motion.div>
        <span
          className="font-press-start"
          style={{
            fontSize: "0.5rem",
            color: active ? (step.isKey ? "#bc8cff" : "#39d353") : "#30363d",
            lineHeight: 1,
          }}
        >
          {String(stepNum).padStart(2, "0")}
        </span>
      </div>

      {/* differentiator tag */}
      {step.isKey && (
        <div className="mb-2">
          <span
            className="font-press-start"
            style={{
              fontSize: "0.38rem",
              background: "rgba(188,140,255,0.12)",
              color: "#bc8cff",
              padding: "0.25rem 0.5rem",
              border: "1px solid rgba(188,140,255,0.3)",
              display: "inline-block",
              letterSpacing: "0.05em",
            }}
          >
            OUR DIFFERENTIATOR
          </span>
        </div>
      )}

      {/* text */}
      <div className="flex-1">
        <div
          className="font-press-start mb-1"
          style={{
            fontSize: "0.6rem",
            color: active ? "var(--text)" : "var(--muted)",
            lineHeight: 1.8,
          }}
        >
          {step.title}
        </div>
        <div
          className="font-ibm-plex text-sm mb-2"
          style={{ color: active ? "#adbac7" : "#7d8590" }}
        >
          {step.subtitle}
        </div>
        <div
          className="font-ibm-plex text-xs leading-relaxed"
          style={{ color: active ? "#7d8590" : "#484f58" }}
        >
          {step.desc}
        </div>
      </div>

      {/* AWS badge — always visible */}
      <div className="mt-3">
        <span
          className="font-ibm-plex text-xs px-2 py-1 inline-block"
          style={{
            background: "rgba(255,153,0,0.08)",
            border: "1px solid rgba(255,153,0,0.2)",
            color: "var(--aws-orange)",
          }}
        >
          {step.aws}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export function RoutingDiagram() {
  const [step, setStep] = useState(0);
  const [modelIdx, setModelIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % STEPS.length;
        if (next === 3) setModelIdx((m) => (m + 1) % MODELS.length);
        return next;
      });
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  const routerActive = step >= 3;

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p
            className="font-press-start mb-4"
            style={{ fontSize: "0.55rem", color: "var(--green)", letterSpacing: "0.1em" }}
          >
            // HOW IT WORKS
          </p>
          <h2
            className="font-press-start mb-5"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            INTELLIGENT SECURITY PIPELINE
          </h2>
          <p className="font-ibm-plex text-base" style={{ color: "var(--muted)", maxWidth: "600px", lineHeight: 1.8 }}>
            Unlike generic AI tools, CodeSentinel&apos;s Security Context Agent
            understands your domain before routing — delivering precise findings
            at a fraction of the cost.
          </p>
        </motion.div>

        {/* 6-step grid — fixed minHeight prevents layout shift */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {STEPS.map((s, i) => (
            <StepCard key={s.id} step={s} active={step === i} stepNum={i + 1} />
          ))}
        </motion.div>

        {/* Model selection — always rendered, opacity-only (no layout shift) */}
        <motion.div
          animate={{ opacity: routerActive ? 1 : 0.2 }}
          transition={{ duration: 0.4 }}
          className="pixel-border p-6 mb-8"
          style={{ background: "var(--bg2)" }}
        >
          <p
            className="font-press-start text-center mb-5"
            style={{ fontSize: "0.5rem", color: "var(--purple)", letterSpacing: "0.1em" }}
          >
            // BEDROCK MODEL SELECTION
          </p>
          <div className="grid grid-cols-3 gap-4">
            {MODELS.map((m, i) => (
              <motion.div
                key={m.name}
                className="p-4 text-center"
                animate={{
                  boxShadow: routerActive && modelIdx === i
                    ? `-2px 0 0 0 ${m.color}, 2px 0 0 0 ${m.color}, 0 -2px 0 0 ${m.color}, 0 2px 0 0 ${m.color}, 0 0 20px ${m.color}30`
                    : `-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)`,
                  background: routerActive && modelIdx === i
                    ? `${m.color}0a`
                    : "var(--bg3)",
                }}
              >
                <div className="font-press-start mb-1" style={{ fontSize: "0.4rem", color: "var(--muted)" }}>
                  {m.label}
                </div>
                <div className="font-press-start mb-1" style={{ fontSize: "0.55rem", color: "var(--text)" }}>
                  {m.name}
                </div>
                <div className="font-press-start" style={{ fontSize: "0.8rem", color: m.color }}>
                  {m.cost}
                </div>
                <div className="font-ibm-plex text-xs mt-1" style={{ color: "var(--muted)" }}>
                  per review
                </div>
                {i < 2 && (
                  <div
                    className="mt-2 font-ibm-plex text-xs px-2 py-1 inline-block"
                    style={{ background: "rgba(57,211,83,0.1)", color: "var(--green)" }}
                  >
                    save {m.saving}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Savings callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pixel-border py-10 text-center"
          style={{ background: "var(--bg2)" }}
        >
          <p className="font-ibm-plex text-sm mb-3" style={{ color: "var(--muted)" }}>
            average cost savings vs Claude Opus-only
          </p>
          <p
            className="font-press-start"
            style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)", color: "var(--green)", lineHeight: 1.6 }}
          >
            87% LESS
          </p>
          <p className="font-ibm-plex text-sm mt-3" style={{ color: "var(--muted)" }}>
            70% Haiku · 20% Sonnet · 10% Opus · typical enterprise workload
          </p>
        </motion.div>
      </div>
    </section>
  );
}
