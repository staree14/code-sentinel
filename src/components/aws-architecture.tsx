"use client";

import { motion } from "framer-motion";

interface Service {
  id: string;
  name: string;
  abbr: string;
  color: string;
  desc: string;
}

const SERVICES: Service[] = [
  { id: "apigw",   name: "API Gateway",      abbr: "APIGW", color: "#FF9900", desc: "REST endpoint for code submissions" },
  { id: "lambda1", name: "AWS Lambda",        abbr: "λ",     color: "#FF9900", desc: "Orchestrator — validates & fans out work" },
  { id: "s3",      name: "Amazon S3",         abbr: "S3",    color: "#3F8624", desc: "Encrypted storage for submitted code" },
  { id: "lambda2", name: "Classifier Lambda", abbr: "λ₂",   color: "#FF9900", desc: "Scores complexity & chooses routing tier" },
  { id: "bedrock", name: "AWS Bedrock",       abbr: "BR",    color: "#bc8cff", desc: "Hosts Claude Haiku, Sonnet, and Opus" },
  { id: "dynamo",  name: "Amazon DynamoDB",   abbr: "DDB",   color: "#3F8624", desc: "Stores analysis results & audit trail" },
  { id: "cw",      name: "CloudWatch",        abbr: "CW",    color: "#E7157B", desc: "Metrics, logs, and cost alarms" },
];

function ServiceCard({ svc, delay = 0 }: { svc: Service; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="p-5 cursor-default pixel-border transition-all duration-200"
      style={{ background: "var(--bg2)" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = "var(--bg3)";
        el.style.boxShadow = `-2px 0 0 0 ${svc.color}, 2px 0 0 0 ${svc.color}, 0 -2px 0 0 ${svc.color}, 0 2px 0 0 ${svc.color}, 0 0 20px ${svc.color}20`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = "var(--bg2)";
        el.style.boxShadow = "-2px 0 0 0 var(--border), 2px 0 0 0 var(--border), 0 -2px 0 0 var(--border), 0 2px 0 0 var(--border)";
      }}
    >
      {/* Abbr badge */}
      <div
        className="w-11 h-11 flex items-center justify-center font-press-start mb-3"
        style={{
          background: `${svc.color}18`,
          border: `1px solid ${svc.color}33`,
          color: svc.color,
          fontSize: "0.55rem",
        }}
      >
        {svc.abbr}
      </div>
      <div
        className="font-press-start mb-1"
        style={{ fontSize: "0.55rem", color: "var(--text)", lineHeight: 1.8 }}
      >
        {svc.name}
      </div>
      <div
        className="font-ibm-plex text-sm leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        {svc.desc}
      </div>
    </motion.div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center h-6 my-1">
      <span style={{ color: "var(--border)", fontSize: 16 }}>↓</span>
    </div>
  );
}

export function AwsArchitecture() {
  const s = Object.fromEntries(SERVICES.map((sv) => [sv.id, sv]));

  return (
    <section id="architecture" className="py-24 px-6" style={{ borderTop: "1px solid var(--border)" }}>
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
            style={{ fontSize: "0.55rem", color: "var(--aws-orange)", letterSpacing: "0.1em" }}
          >
            // AWS ARCHITECTURE
          </p>
          <h2
            className="font-press-start mb-5"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}
          >
            BUILT ON AWS
          </h2>
          <p className="font-ibm-plex text-base" style={{ color: "var(--muted)", maxWidth: "560px", lineHeight: 1.8 }}>
            Every component is serverless, pay-per-use, and deeply integrated
            with AWS security primitives.
          </p>
        </motion.div>

        {/* Two-column pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Ingestion */}
          <div>
            <p
              className="font-press-start text-center mb-6"
              style={{ fontSize: "0.45rem", color: "var(--muted)", letterSpacing: "0.1em" }}
            >
              [ INGESTION PIPELINE ]
            </p>
            <div className="flex flex-col items-center gap-0">
              <ServiceCard svc={s.apigw}   delay={0.05} />
              <Arrow />
              <ServiceCard svc={s.lambda1} delay={0.10} />
              <Arrow />
              <ServiceCard svc={s.s3}      delay={0.15} />
            </div>
          </div>

          {/* Analysis */}
          <div>
            <p
              className="font-press-start text-center mb-6"
              style={{ fontSize: "0.45rem", color: "var(--muted)", letterSpacing: "0.1em" }}
            >
              [ ANALYSIS PIPELINE ]
            </p>
            <div className="flex flex-col items-center gap-0">
              <ServiceCard svc={s.lambda2} delay={0.20} />
              <Arrow />
              <ServiceCard svc={s.bedrock} delay={0.25} />
              <Arrow />
              <ServiceCard svc={s.dynamo}  delay={0.30} />
              <Arrow />
              <ServiceCard svc={s.cw}      delay={0.35} />
            </div>
          </div>
        </div>

        {/* Bedrock model badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 pixel-border p-6"
          style={{ background: "var(--bg2)" }}
        >
          <p
            className="font-press-start text-center mb-5"
            style={{ fontSize: "0.5rem", color: "var(--purple)", letterSpacing: "0.1em" }}
          >
            // BEDROCK MODELS AVAILABLE
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Claude Haiku",      tier: "Low complexity",    color: "#39d353" },
              { name: "Claude Sonnet 3.5", tier: "Medium complexity", color: "#58a6ff" },
              { name: "Claude Opus",       tier: "High complexity",   color: "#bc8cff" },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2 px-4 py-2 font-ibm-plex text-sm"
                style={{
                  background: `${m.color}0f`,
                  border: `1px solid ${m.color}33`,
                  color: "var(--text)",
                }}
              >
                <span
                  className="w-2 h-2 flex-shrink-0"
                  style={{ background: m.color }}
                />
                <span className="font-medium">{m.name}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>· {m.tier}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AWS branding */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mt-10"
        >
          <div
            className="font-press-start px-4 py-2"
            style={{
              fontSize: "0.45rem",
              background: "rgba(255,153,0,0.08)",
              border: "1px solid rgba(255,153,0,0.2)",
              color: "var(--aws-orange)",
              letterSpacing: "0.05em",
            }}
          >
            ⚡ POWERED BY AMAZON WEB SERVICES
          </div>
        </motion.div>
      </div>
    </section>
  );
}
