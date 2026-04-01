"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("user_email", data.email);
      router.push("/dashboard"); // Redirect to dashboard per request
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#050505] font-ibm-plex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,100,0.03)_0,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="pixel-border bg-[#0d0d0d] p-10 relative overflow-hidden">
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <ShieldCheck size={24} className="text-[var(--green)]" />
              <span className="font-press-start text-[0.65rem] tracking-tighter text-[var(--green)]">
                CODE SENTINEL
              </span>
            </Link>
            <h1 className="text-xl font-press-start text-center tracking-tighter uppercase">
              ACCESS_KERNEL
            </h1>
            <p className="text-[#444] text-center text-[0.55rem] font-press-start mt-2 uppercase">
              SESSION_INIT // VERSION_3.0
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[0.55rem] font-press-start text-[#666] mb-2 uppercase">
                Identify Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/10 px-10 py-3 text-sm font-mono text-[#eee] focus:border-[var(--green)] focus:outline-none transition-colors"
                  placeholder="admin@sentinel.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.55rem] font-press-start text-[#666] mb-2 uppercase">
                Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/10 px-10 py-3 text-sm font-mono text-[#eee] focus:border-[var(--green)] focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-[0.6rem] font-press-start"
              >
                ERR: {error.toUpperCase()}
              </motion.div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-[#00ff6611] border border-[#00ff6644] text-[var(--green)] font-press-start text-[0.6rem] hover:bg-[#00ff6622] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "INITIATE_SESSION"}
              {!loading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link 
              href="/signup" 
              className="text-[#444] hover:text-[var(--green)] text-[0.5rem] font-press-start transition-colors uppercase"
            >
              No Identity? Create New Node
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
