"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu, Zap, ShieldCheck } from "lucide-react";

export function InteractiveRouter() {
  const [prompt, setPrompt] = useState("");
  const [routing, setRouting] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [history, setHistory] = useState<{ p: string; m: string }[]>([]);

  function handleRoute() {
    if (!prompt.trim() || routing) return;
    setRouting(true);
    setActiveModel(null);
    
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let route = "haiku";
      
      const opusKeywords = ["crypto", "auth", "vulnerability", "token", "deep", "complex", "architecture", "comprehensive"];
      const sonnetKeywords = ["aws", "iam", "database", "config", "analyze", "analyse", "review", "codebase"];
      
      if (opusKeywords.some(kw => lower.includes(kw))) {
        route = "opus";
      } else if (sonnetKeywords.some(kw => lower.includes(kw))) {
        route = "sonnet";
      }
      
      setActiveModel(route);
      setHistory(prev => [{ p: prompt, m: route }, ...prev].slice(0, 3));
      setRouting(false);
      setPrompt("");
    }, 800);
  }

  const models = [
    { id: "haiku", name: "Claude Haiku", desc: "Fast / Low Cost", color: "var(--green)", icon: Zap },
    { id: "sonnet", name: "Claude Sonnet", desc: "Balanced", color: "var(--blue)", icon: Cpu },
    { id: "opus", name: "Claude Opus", desc: "Deep Analysis", color: "var(--purple)", icon: ShieldCheck },
  ];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Input area */}
        <div className="md:col-span-5 pixel-border p-5 h-full flex flex-col justify-center" style={{ background: "var(--bg2)" }}>
          <div className="font-press-start mb-3" style={{ fontSize: "0.45rem", color: "var(--muted)" }}>
            AWAITING INPUT...
          </div>
          <textarea
            className="w-full bg-transparent outline-none font-ibm-plex text-sm resize-none mb-6"
            style={{ color: "var(--text)", borderBottom: "1px dashed var(--border)" }}
            rows={4}
            placeholder="Type 'aws config' or 'auth token issue' or 'IAM permissions'..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRoute();
              }
            }}
          />
          <div className="flex justify-between items-center mt-auto pb-1">
             <span className="font-ibm-plex text-xs hidden md:inline-block" style={{ color: "var(--muted)" }}>Hit Enter</span>
             <button 
               onClick={handleRoute}
               className="btn-primary-pixel w-full md:w-auto text-center justify-center" 
               style={{ fontSize: "0.45rem", padding: "0.6rem 1rem" }}
               disabled={routing || !prompt.trim()}
             >
               {routing ? "ROUTING..." : "ANALYZE"}
             </button>
          </div>
        </div>

        {/* Animation Path */}
        <div className="md:col-span-2 flex justify-center py-4 md:py-0">
          <div className="relative w-full h-8 flex items-center justify-center">
            {routing ? (
              <div className="animate-dash w-full" />
            ) : activeModel ? (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="w-full h-[2px]"
                style={{ background: models.find(m => m.id === activeModel)?.color, transformOrigin: "left" }}
              />
            ) : (
              <div className="w-full h-[2px]" style={{ background: "var(--border)" }} />
            )}
            {activeModel && !routing && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute text-center"
              >
                 <ArrowLeft size={16} className="rotate-180 drop-shadow-md" style={{ color: models.find(m => m.id === activeModel)?.color }} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Models area */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {models.map(m => {
            const isActive = activeModel === m.id;
            const Icon = m.icon;
            return (
              <div 
                key={m.id}
                className={`pixel-border p-4 transition-all duration-300 ${isActive ? "scale-105" : "opacity-60 scale-100"}`}
                style={{ 
                  background: isActive ? "var(--bg3)" : "var(--bg2)",
                  boxShadow: isActive ? `-2px 0 0 0 ${m.color}, 2px 0 0 0 ${m.color}, 0 -2px 0 0 ${m.color}, 0 2px 0 0 ${m.color}, 0 0 15px ${m.color}33` : undefined,
                }}
              >
                <div className="flex items-center gap-4">
                   <div style={{ color: isActive ? m.color : "var(--muted)" }}><Icon size={20} /></div>
                   <div>
                     <div className="font-press-start" style={{ fontSize: "0.55rem", color: isActive ? m.color : "var(--text)", lineHeight: 1.8 }}>{m.name}</div>
                     <div className="font-ibm-plex text-xs mt-1" style={{ color: "var(--muted)" }}>{m.desc}</div>
                   </div>
                   {isActive && (
                     <motion.div 
                       initial={{ scale: 0 }} animate={{ scale: 1 }}
                       className="font-press-start ml-auto text-xs" 
                       style={{ color: m.color }}
                     >
                       ✓
                     </motion.div>
                   )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-10 pt-6" style={{ borderTop: "1px dashed var(--border)" }}>
          <div className="font-press-start mb-4" style={{ fontSize: "0.45rem", color: "var(--muted)" }}>RECENT ROUTES</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.map((h, i) => {
              const matched = models.find(m => m.id === h.m);
              return (
                <div key={i} className="pixel-border p-3" style={{ background: "var(--bg2)" }}>
                   <div className="font-ibm-plex text-xs truncate mb-2" style={{ color: "var(--text)" }}>&quot;{h.p}&quot;</div>
                   <div className="font-press-start" style={{ fontSize: "0.4rem", color: matched?.color }}>→ {matched?.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
