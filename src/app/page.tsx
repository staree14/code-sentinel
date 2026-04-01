import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { LandingFeatures } from "@/components/landing-features";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <ProblemSection />
      <StatsBar />
      <LandingFeatures />
      <CtaSection />
      <Footer />
    </main>
  );
}

function ProblemSection() {
  return (
    <section className="py-16 px-6 text-center" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
      <div className="max-w-4xl mx-auto">
        <p className="font-press-start mb-4" style={{ fontSize: "0.55rem", color: "var(--red)", letterSpacing: "0.1em" }}>
          // THE PROBLEM
        </p>
        <h2 className="font-press-start mb-6" style={{ fontSize: "clamp(0.8rem, 2vw, 1.4rem)", color: "var(--text)", lineHeight: 1.8 }}>
          CONSTANT DISRUPTIONS & NOISY ALERTS
        </h2>
        <p className="font-ibm-plex text-base md:text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
          Developers spend too much time pasting code into generalized AI tools, repeatedly prompting for security checks. Current tools lack specific context, resulting in noisy, irrelevant findings. This slows down development and frustrates teams, leading to missed vulnerabilities and costly breaches.
        </p>
      </div>
    </section>
  );
}

/* ── Stats bar ──────────────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { value: "[ 87% ]", label: "breaches from code vulns" },
    { value: "[ $4.5M ]", label: "avg breach cost" },
    { value: "[ 73% ]", label: "cost savings vs Opus-only" },
  ];

  return (
    <section
      className="py-6 px-6"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-wrap justify-around items-center gap-6">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            {i > 0 && (
              <span className="hidden md:block font-ibm-plex text-2xl" style={{ color: "var(--border)" }}>
                │
              </span>
            )}
            <div className="text-center">
              <div
                className="font-press-start mb-1"
                style={{ fontSize: "clamp(0.8rem, 1.8vw, 1.2rem)", color: "var(--green)", lineHeight: 1.8 }}
              >
                {s.value}
              </div>
              <div className="font-ibm-plex text-sm" style={{ color: "var(--muted)" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section
      className="py-28 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="font-press-start mb-5"
          style={{ fontSize: "0.5rem", color: "var(--green)", letterSpacing: "0.1em" }}
        >
          // GET STARTED
        </p>
        <h2
          className="font-press-start mb-6"
          style={{ fontSize: "clamp(0.8rem, 2vw, 1.4rem)", color: "var(--text)", lineHeight: 1.8 }}
        >
          AUTOMATED CODEBASE SECURITY
        </h2>
        <p
          className="font-ibm-plex text-sm mb-10 leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Our Security Agent automatically analyzes your entire codebase in the background. No more repetitive prompting or manual copy-pasting—just continuous, AI-powered protection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/architecture" className="btn-primary-pixel">
            ► DIVE INTO THE ARCHITECTURE
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer
      className="px-6 py-12"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
          <div>
            <div
              className="font-press-start mb-2"
              style={{ fontSize: "0.75rem", color: "var(--green)" }}
            >
              CODE SENTINEL
            </div>
            <p className="font-ibm-plex text-sm" style={{ color: "var(--muted)" }}>
              AI-powered security code review on AWS Bedrock.
            </p>
          </div>
          <div className="font-ibm-plex text-sm text-right" style={{ color: "var(--muted)" }}>
            <div style={{ color: "var(--text)" }}>Built for HACK&apos;A&apos;WAR</div>
            <div>GenAI × AWS · RIT Bengaluru</div>
          </div>
        </div>

        <div
            className="font-press-start text-center mb-6"
            style={{ fontSize: "0.35rem", color: "var(--border)", letterSpacing: "0.1em" }}
        >
          ────────────────────────────────────────────────────────────────────
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <span
              className="font-ibm-plex text-xs px-3 py-1"
              style={{
                background: "rgba(255,153,0,0.08)",
                border: "1px solid rgba(255,153,0,0.2)",
                color: "var(--aws-orange)",
              }}
            >
              Powered by AWS Bedrock
            </span>
            <span
              className="font-ibm-plex text-xs px-3 py-1"
              style={{
                background: "rgba(57,211,83,0.08)",
                border: "1px solid rgba(57,211,83,0.2)",
                color: "var(--green)",
              }}
            >
              Multi-Model Routing
            </span>
          </div>
          <p
            className="font-ibm-plex text-xs"
            style={{ color: "var(--border)" }}
          >
            © {new Date().getFullYear()} CodeSentinel
          </p>
        </div>
      </div>
    </footer>
  );
}
