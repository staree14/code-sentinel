"use client";

import { motion } from "framer-motion";

interface Feature {
  num: string;
  title: string;
  badge: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    num: "01",
    title: "SMART ROUTING & PROMPT INTEL",
    badge: "CORE & OPTIMIZATION",
    desc: "AI classifier determines optimal Claude model per request. A lightweight model analyzes each input before processing. Classifies intent, complexity, and security risk to optimize token usage & reduce cost.",
  },
  {
    num: "02",
    title: "CONTEXT-AWARE SECURITY",
    badge: "DIFFERENTIATOR",
    desc: "Switch between FinTech, HealthTech, E-commerce, and SaaS security profiles. Each domain brings its own OWASP checklist and compliance rules (PCI-DSS, HIPAA, SOC2).",
  },
  {
    num: "03",
    title: "SCAN & SUB-3S ANALYSIS",
    badge: "PERFORMANCE & AI CORE",
    desc: "LLMs understand code to detect complex security issues beyond rule-based tools. Uses RAG against security best practices. Even the most complex Opus-routed reviews complete in under 3 seconds end-to-end.",
  },
  {
    num: "04",
    title: "REPORTING & COST TRANSPARENCY",
    badge: "VISIBILITY",
    desc: "GenAI-generated insights provide clear, actionable feedback on identified vulnerabilities. Every review logs model used, tokens consumed, and exact cost to DynamoDB to surface real-time spending trends.",
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
            // KEY DIFFERENTIATORS
          </p>
          <h2
            className="font-press-start"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            WHY CODESENTINEL?
          </h2>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => {
            const isBadgePurple = f.badge.includes("DIFFERENTIATOR") || f.badge.includes("VISIBILITY");
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="group pixel-border p-5 md:p-6 cursor-default transition-all duration-200 flex flex-col h-full"
                style={{ background: "var(--bg2)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = "var(--bg3)";
                  el.style.boxShadow =
                    "4px 0 0 0 var(--green), -2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = "var(--bg2)";
                  el.style.boxShadow =
                    "-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)";
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 pt-1">
                    <span
                      className="font-press-start group-hover:text-[var(--green)] transition-colors"
                      style={{ fontSize: "0.7rem", color: "var(--green)" }}
                    >
                      ►
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-press-start block mb-2"
                      style={{ fontSize: "0.45rem", color: "var(--muted)" }}
                    >
                      {f.num}
                    </span>
                    <h3
                      className="font-press-start mb-3"
                      style={{ fontSize: "0.6rem", color: "var(--text)", lineHeight: 1.8 }}
                    >
                      {f.title}
                    </h3>
                    <span
                      className="font-press-start flex-shrink-0 inline-block"
                      style={{
                        fontSize: "0.4rem",
                        padding: "0.3rem 0.6rem",
                        background: isBadgePurple
                          ? "rgba(188,140,255,0.12)"
                          : "rgba(57,211,83,0.12)",
                        color: isBadgePurple ? "var(--purple)" : "var(--green)",
                        border: `1px solid ${isBadgePurple ? "rgba(188,140,255,0.3)" : "rgba(57,211,83,0.3)"}`,
                      }}
                    >
                      [{f.badge}]
                    </span>
                  </div>
                </div>
                <p
                  className="font-ibm-plex text-sm leading-relaxed mt-auto"
                  style={{ color: "var(--muted)" }}
                >
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
