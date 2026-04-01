"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CodeEditor } from "@/components/code-editor";
import { SecurityReport } from "@/components/security-report";
import { CostCalculator } from "@/components/cost-calculator";
import type { AnalysisResult, Vulnerability } from "@/lib/mock-analysis";

const COMPARISON = [
  { feature: "Multi-model routing", sentinel: true, competitorA: false, competitorB: false },
  { feature: "AWS Bedrock native", sentinel: true, competitorA: false, competitorB: true },
  { feature: "Cost transparency", sentinel: true, competitorA: false, competitorB: false },
  { feature: "Domain security rules", sentinel: true, competitorA: true, competitorB: false },
  { feature: "Sub-3s analysis", sentinel: true, competitorA: false, competitorB: true },
  { feature: "Automated fix hints", sentinel: true, competitorA: true, competitorB: false },
];

export default function DemoPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (!email) {
      router.push("/login");
    }
  }, []);

  function handleResult(r: AnalysisResult) {
    setResult(r);
    setVulns(r.vulnerabilities);
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* mini nav */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "var(--bg3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm transition-colors hover:text-white"
          style={{ color: "var(--muted)" }}
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <img src="/detective.svg" alt="Code Sentinel Logo" className="w-4 h-4 object-contain" />
          <span className="text-sm font-bold">
            Code<span style={{ color: "var(--green)" }}>Sentinel</span>
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-16">
        {/* page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 pixel-border font-press-start mb-6"
            style={{
              fontSize: "0.45rem",
              background: "rgba(57,211,83,0.06)",
              color: "var(--green)",
            }}
          >
            Interactive Demo
          </div>
          <h1 className="font-press-start mb-6" style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", color: "var(--text)", lineHeight: 1.6 }}>
            SEE CODESENTINEL IN ACTION
          </h1>
          <p style={{ color: "var(--muted)" }} className="max-w-xl mx-auto">
            Paste your code, click Analyze, and watch the multi-model router pick
            the right Claude model — then explore the security report below.
          </p>
        </motion.div>

        {/* editor */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <SectionLabel>01 · Code Editor</SectionLabel>
          <CodeEditor onResult={handleResult} />
        </motion.div>

        {/* security report — appears after analysis */}
        {vulns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <SectionLabel>02 · Security Report</SectionLabel>
            {result && (
              <div
                className="pixel-border px-5 py-4 mb-5 flex flex-wrap items-center gap-4"
                style={{
                  background: "rgba(248,81,73,0.04)"
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {result.summary}
                </span>
              </div>
            )}
            <SecurityReport vulnerabilities={vulns} />
          </motion.div>
        )}

        {/* cost calculator */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <SectionLabel>03 · Cost Calculator</SectionLabel>
          <CostCalculator />
        </motion.div>

        {/* comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <SectionLabel>04 · Comparison</SectionLabel>
          <div
            className="pixel-border overflow-hidden"
            style={{ background: "var(--bg2)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text)" }}>Feature</th>
                  <th className="px-5 py-4 font-semibold" style={{ color: "var(--green)" }}>CodeSentinel</th>
                  <th className="px-5 py-4 font-medium" style={{ color: "var(--muted)" }}>Snyk</th>
                  <th className="px-5 py-4 font-medium" style={{ color: "var(--muted)" }}>AWS Security Hub</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: i < COMPARISON.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted)" }}>
                      {row.feature}
                    </td>
                    <Tick val={row.sentinel} accent />
                    <Tick val={row.competitorA} />
                    <Tick val={row.competitorB} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* back CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="btn-secondary-pixel"
          >
            <ArrowLeft size={16} />
            Back to Landing
          </Link>
        </div>
      </div>
    </main>
  );
}

/* helpers */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-press-start mb-6" style={{ fontSize: "0.55rem", color: "var(--green)", letterSpacing: "0.1em" }}>
      // {children}
    </p>
  );
}

function Tick({ val, accent = false }: { val: boolean; accent?: boolean }) {
  return (
    <td className="px-5 py-3 text-center">
      {val ? (
        <span style={{ color: accent ? "var(--green)" : "var(--blue)", fontSize: 18 }}>✓</span>
      ) : (
        <span style={{ color: "var(--border)", fontSize: 18 }}>✗</span>
      )}
    </td>
  );
}
