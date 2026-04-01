"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
              RECRUIT_AGENT
            </h1>
            <p className="text-[#444] text-center text-[0.55rem] font-press-start mt-2 uppercase">
              REGISTER_IDENTITY // NODE_SYNC
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-[0.55rem] font-press-start text-[#666] mb-2 uppercase">
                  Register Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 px-10 py-3 text-sm font-mono text-[#eee] focus:border-[var(--green)] focus:outline-none transition-colors"
                    placeholder="user@sentinel.io"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.55rem] font-press-start text-[#666] mb-2 uppercase">
                  Initialize Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 px-10 py-3 text-sm font-mono text-[#eee] focus:border-[var(--green)] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.55rem] font-press-start text-[#666] mb-2 uppercase">
                  Confirm Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  REG_ERR: {error.toUpperCase()}
                </motion.div>
              )}

              <button
                disabled={loading}
                className="w-full py-4 bg-[#00ff6611] border border-[#00ff6644] text-[var(--green)] font-press-start text-[0.6rem] hover:bg-[#00ff6622] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? "INITIALIZING..." : "CREATE_IDENTITY"}
                {!loading && <Zap size={14} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <Zap className="mx-auto text-[var(--green)] mb-6 animate-pulse" size={48} />
              <h2 className="text-sm font-press-start text-[var(--green)] mb-4 uppercase">
                IDENTITY_SECURED
              </h2>
              <p className="text-[#444] text-[0.55rem] font-press-start uppercase">
                REDIRECTING_TO_AUTH_PORTAL...
              </p>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link 
              href="/login" 
              className="text-[#444] hover:text-[var(--green)] text-[0.5rem] font-press-start transition-colors uppercase"
            >
              Already Registered? Start Session
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
