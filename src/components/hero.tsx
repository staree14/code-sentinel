"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const HeroShape = dynamic(() => import("./hero-shape"), { ssr: false });

const HEADING_WORDS = [
  { text: "CODE", color: "var(--text)" },
  { text: "SENTINEL", color: "var(--green)" },
];

const letterVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden px-6 pt-20"
      style={{ background: "var(--bg)" }}
    >
      {/* Radial vignette behind text area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 30% 50%, rgba(57,211,83,0.04) 0%, transparent 70%)",
        }}
      />

      {/* 3D rotating cube — right half */}
      <HeroShape />

      {/* Left content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-10 pixel-border"
            style={{ background: "var(--bg2)" }}
          >
            <span
              className="w-1.5 h-1.5 flex-shrink-0"
              style={{ background: "var(--aws-orange)" }}
            />
            <span
              className="font-press-start"
              style={{ fontSize: "0.5rem", color: "var(--aws-orange)", lineHeight: 1 }}
            >
              POWERED BY AWS BEDROCK
            </span>
          </motion.div>

          {/* Pixel heading — letter-by-letter stagger */}
          <div className="mb-8">
            {HEADING_WORDS.map((word, wi) => (
              <motion.div
                key={wi}
                className="font-press-start block"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
                  color: word.color,
                  lineHeight: 1.8,
                }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: wi * 0.25 + 0.3 } } }}
                initial="hidden"
                animate="show"
              >
                {word.text.split("").map((letter, li) => (
                  <motion.span key={li} variants={letterVariant} style={{ display: "inline-block" }}>
                    {letter}
                  </motion.span>
                ))}
                {/* Blinking cursor on last word */}
                {wi === HEADING_WORDS.length - 1 && (
                  <span
                    className="animate-blink ml-2"
                    style={{ color: "var(--green)" }}
                  >|</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="font-ibm-plex text-lg mb-10 leading-relaxed"
            style={{ color: "var(--muted)", maxWidth: "520px" }}
          >
            The AI security gate that catches vulnerabilities before your AI
            generates them.{" "}
            <span style={{ color: "var(--text)" }}>
              Intelligent routing. Context-aware analysis. AWS-powered.
            </span>
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <Link href="/dashboard" className="btn-primary-pixel">
              ► TRY LIVE DEMO
            </Link>
            <a href="/architecture" className="btn-secondary-pixel">
              VIEW ARCHITECTURE
            </a>
          </motion.div>

          {/* Pixel stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { value: "87%", label: "cost savings" },
              { value: "< 3s", label: "analysis time" },
              { value: "6-step", label: "ai pipeline" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  className="font-press-start"
                  style={{ fontSize: "0.9rem", color: "var(--green)", lineHeight: 1.8 }}
                >
                  [{value}]
                </div>
                <div
                  className="font-ibm-plex text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-6 font-ibm-plex text-xs animate-pixel-pulse"
        style={{ color: "var(--border)" }}
      >
        scroll ↓
      </div>
    </section>
  );
}
