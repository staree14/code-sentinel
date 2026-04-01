"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs" style={{ color: "#A0A0A0" }}>
          {label}
        </span>
        <span className="text-sm font-semibold text-white font-mono">
          {format(value)}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="absolute left-0 top-0 h-2 rounded-full"
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            background: "linear-gradient(90deg, #00E5FF, #9333EA)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
  formatted,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  formatted: string;
  delay: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-end gap-3">
      <div className="w-28 text-right text-xs leading-tight" style={{ color: "#555" }}>
        {label}
      </div>
      <div className="flex-1 h-8 rounded-lg overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          className="h-full rounded-lg"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
      <div className="w-24 text-xs font-semibold font-mono" style={{ color }}>
        {formatted}
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

export function CostCalculator() {
  const [reviews, setReviews] = useState(200);
  const [lines, setLines]     = useState(500);

  // cost per review
  const haiku  = 0.001 * (lines / 100);
  const sonnet = 0.006 * (lines / 100);
  const opus   = 0.015 * (lines / 100);
  const blended = haiku * 0.7 + sonnet * 0.2 + opus * 0.1; // 70/20/10 split

  const sentinel = blended * reviews;
  const opusOnly  = opus    * reviews;
  const manual    = 150 * 8 * reviews; // $150/hr × 8hr

  const maxCost = manual;

  return (
    <div
      className="pixel-border p-7"
      style={{
        background: "var(--bg2)",
      }}
    >
      <h3 className="font-press-start mb-4" style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.6 }}>COST CALCULATOR</h3>
      <p className="text-xs mb-8" style={{ color: "#555" }}>
        Estimate monthly spend across review strategies
      </p>

      <Slider
        label="Monthly code reviews"
        value={reviews}
        min={10}
        max={2000}
        step={10}
        format={(v) => `${v.toLocaleString()} reviews`}
        onChange={setReviews}
      />
      <Slider
        label="Avg lines of code per review"
        value={lines}
        min={50}
        max={5000}
        step={50}
        format={(v) => `${v.toLocaleString()} lines`}
        onChange={setLines}
      />

      <div className="space-y-4 mt-2">
        <Bar label="Manual Review" value={manual}   max={maxCost} color="#ef4444" formatted={fmt(manual)}   delay={0}    />
        <Bar label="Opus Only"     value={opusOnly} max={maxCost} color="#f97316" formatted={fmt(opusOnly)} delay={0.1}  />
        <Bar label="CodeSentinel"  value={sentinel} max={maxCost} color="#00E5FF" formatted={fmt(sentinel)} delay={0.2}  />
      </div>

      {/* savings callout */}
      <motion.div
        key={`${reviews}-${lines}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-7 pixel-border px-5 py-4 flex items-center justify-between flex-wrap gap-3"
        style={{
          background: "var(--bg3)",
        }}
      >
        <div>
          <div className="text-xs mb-0.5" style={{ color: "#555" }}>
            You save vs manual review
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(135deg, #22c55e, #00E5FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {fmt(manual - sentinel)} / mo
          </div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: "#555" }}>
            vs Opus-only
          </div>
          <div className="text-2xl font-bold" style={{ color: "#00E5FF" }}>
            {fmt(opusOnly - sentinel)} / mo
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "#22c55e",
          }}
        >
          {Math.round((1 - sentinel / manual) * 100)}% cheaper
        </div>
      </motion.div>
    </div>
  );
}
