import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { RoutingDiagram } from "@/components/routing-diagram";
import { AwsArchitecture } from "@/components/aws-architecture";
import { LandingFeatures } from "@/components/landing-features";
import { InteractiveRouter } from "@/components/interactive-router";

export default function LandingPage() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <StatsBar />
      <PlatformPreview />
      <RoutingDiagram />
      <CodeSnippetSection />
      <RoutingVizSection />
      <LandingFeatures />
      <AwsArchitecture />
      <CtaSection />
      <Footer />
    </main>
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
      style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}
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

/* ── Platform Preview ───────────────────────────────────────────────── */
function PlatformPreview() {
  return (
    <section className="py-24 px-6 text-center" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-14">
          <p
            className="font-press-start mb-4"
            style={{ fontSize: "0.55rem", color: "var(--blue)", letterSpacing: "0.1em" }}
          >
            // PLATFORM OVERVIEW
          </p>
          <h2
            className="font-press-start mb-3"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            THE SENTINEL PROTOCOL
          </h2>
          <p className="font-ibm-plex text-base" style={{ color: "var(--muted)", maxWidth: "540px", margin: "0 auto" }}>
            A sneak peek into our unified security dashboard.
          </p>
        </div>
        <div className="relative mx-auto pixel-border overflow-hidden" style={{ maxWidth: "1000px" }}>
          <img 
            src="/prototype.png" 
            alt="Code Sentinel Prototype Dashboard" 
            className="w-full h-auto object-cover border-none"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Code snippet terminal ──────────────────────────────────────────── */
function CodeSnippetSection() {
  return (
    <section
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-14">
          <p
            className="font-press-start mb-4"
            style={{ fontSize: "0.55rem", color: "var(--green)", letterSpacing: "0.1em" }}
          >
            // SENTINEL IN ACTION
          </p>
          <h2
            className="font-press-start mb-3"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            CATCHES WHAT OTHERS MISS
          </h2>
          <p className="font-ibm-plex text-base" style={{ color: "var(--muted)", lineHeight: 1.8, maxWidth: "540px" }}>
            Submit code. Security Context Agent detects domain. Claude analyzes
            with domain-specific checklist. Report in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Terminal */}
          <div className="pixel-border overflow-hidden" style={{ background: "var(--bg2)" }}>
            {/* Terminal header */}
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ background: "var(--bg3)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex gap-2">
                <div className="w-3 h-3" style={{ background: "var(--red)" }} />
                <div className="w-3 h-3" style={{ background: "var(--yellow)" }} />
                <div className="w-3 h-3" style={{ background: "var(--green)" }} />
              </div>
              <span className="font-ibm-plex text-xs ml-2" style={{ color: "var(--muted)" }}>
                vulnerable.py
              </span>
              <span
                className="ml-auto font-press-start"
                style={{ fontSize: "0.35rem", color: "var(--muted)" }}
              >
                PYTHON · 24 LINES
              </span>
            </div>

            {/* Code */}
            <div className="p-5 font-ibm-plex text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              <div className="mb-1" style={{ color: "var(--border)" }}># AWS Configuration</div>
              <div
                className="mb-1 px-2 -mx-1"
                style={{
                  background: "rgba(248,81,73,0.1)",
                  borderLeft: "2px solid var(--red)",
                  color: "var(--text)",
                }}
              >
                AWS_ACCESS_KEY = <span style={{ color: "var(--yellow)" }}>&quot;AKIAIOSFODNN7EXAMPLE&quot;</span>
              </div>
              <div
                className="mb-1 px-2 -mx-1"
                style={{
                  background: "rgba(248,81,73,0.1)",
                  borderLeft: "2px solid var(--red)",
                  color: "var(--text)",
                }}
              >
                AWS_SECRET_KEY = <span style={{ color: "var(--yellow)" }}>&quot;wJalrXUtn/EXAMPLE+KEY&quot;</span>
              </div>
              <div className="mb-1">S3_BUCKET = <span style={{ color: "var(--blue)" }}>&quot;my-bucket&quot;</span></div>
              <div
                className="px-2 -mx-1"
                style={{
                  background: "rgba(210,153,34,0.1)",
                  borderLeft: "2px solid var(--yellow)",
                  color: "var(--text)",
                }}
              >
                DEBUG = <span style={{ color: "var(--red)" }}>True</span>
              </div>
            </div>

            {/* Alert box */}
            <div
              className="mx-5 mb-5 p-4"
              style={{
                background: "rgba(248,81,73,0.05)",
                boxShadow: "-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)",
                borderLeft: "3px solid var(--red)",
              }}
            >
              <div
                className="font-press-start mb-3"
                style={{ fontSize: "0.45rem", color: "var(--red)" }}
              >
                ┌─ SENTINEL ALERT ──────────────┐
              </div>
              <div className="space-y-2 font-ibm-plex text-sm">
                <div className="flex items-center gap-2">
                  <span className="badge badge-critical">CRITICAL</span>
                  <span style={{ color: "var(--text)" }}>Hardcoded AWS credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-high">HIGH</span>
                  <span style={{ color: "var(--text)" }}>Debug mode enabled in prod</span>
                </div>
                <div className="mt-3 font-ibm-plex text-xs" style={{ color: "var(--green)" }}>
                  Route → claude-sonnet (security context: AWS infra)
                </div>
                <div className="font-ibm-plex text-xs" style={{ color: "var(--blue)" }}>
                  Fix → Use AWS Secrets Manager + env vars
                </div>
              </div>
              <div
                className="font-press-start mt-3"
                style={{ fontSize: "0.45rem", color: "var(--border)" }}
              >
                └───────────────────────────────┘
              </div>
            </div>
          </div>

          {/* What happened explainer */}
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "CONTEXT DETECTED",
                color: "var(--purple)",
                body: "Security Context Agent identified AWS infrastructure code. Applied AWS Security Best Practices checklist (CIS AWS Foundations Benchmark).",
              },
              {
                step: "02",
                title: "COMPLEXITY SCORED",
                color: "var(--green)",
                body: "AI Classifier scored complexity 7/10. Security surface area: HIGH. Routed to Claude Sonnet for deep analysis.",
              },
              {
                step: "03",
                title: "FINDINGS GENERATED",
                color: "var(--red)",
                body: "2 findings in 1.4s. CWE-798 (Hardcoded credentials), CWE-94 (Debug flag). Fix suggestions included with each.",
              },
              {
                step: "04",
                title: "COST: $0.006",
                color: "var(--blue)",
                body: "Routed to Sonnet not Opus. Saved 60% vs always-Opus routing. Result stored in DynamoDB for audit trail.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="pixel-border p-5"
                style={{ background: "var(--bg2)" }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="font-press-start flex-shrink-0"
                    style={{ fontSize: "0.5rem", color: item.color, lineHeight: 1.8 }}
                  >
                    [{item.step}]
                  </span>
                  <div>
                    <div
                      className="font-press-start mb-2"
                      style={{ fontSize: "0.55rem", color: "var(--text)", lineHeight: 1.8 }}
                    >
                      {item.title}
                    </div>
                    <p className="font-ibm-plex text-sm" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Routing visualization ─────────────────────────────────────────── */
function RoutingVizSection() {
  return (
    <section
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-14">
          <p
            className="font-press-start mb-4"
            style={{ fontSize: "0.55rem", color: "var(--purple)", letterSpacing: "0.1em" }}
          >
            // TRY IT OUT
          </p>
          <h2
            className="font-press-start"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            LIVE INTELLIGENT ROUTING
          </h2>
        </div>

        <InteractiveRouter />
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
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.8rem)", color: "var(--text)", lineHeight: 1.8 }}
        >
          AUTOMATED CODEBASE SECURITY
        </h2>
        <p
          className="font-ibm-plex text-base mb-10 leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Our Security Agent automatically analyzes your entire codebase in the background. No more repetitive prompting or manual copy-pasting—just continuous, AI-powered protection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/demo" className="btn-primary-pixel">
            ► TRY THE LIVE DEMO
          </a>
          <a href="#architecture" className="btn-secondary-pixel">
            VIEW ARCHITECTURE
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
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
