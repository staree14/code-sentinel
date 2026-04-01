"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, BarChart3, User } from "lucide-react";

const NAV_LINKS = [
  { label: "How It Works", href: "/architecture#how-it-works" },
  { label: "Architecture", href: "/architecture" },
  { label: "Features", href: "/#features" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check for user session
    const email = localStorage.getItem("user_email");
    setUserEmail(email);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user_email");
    setUserEmail(null);
    router.push("/");
  };

  const isAuthPage = pathname === "/dashboard" || pathname === "/analytics";

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(13,17,23,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <img src="/detective.svg" alt="Code Sentinel Logo" className="w-6 h-6 object-contain" />
        {/* Blinking status dot */}
        <span
          className="w-2 h-2 rounded-none animate-blink flex-shrink-0"
          style={{ background: "var(--green)" }}
        />
        <span
          className="font-press-start text-[0.7rem] tracking-wider"
          style={{ color: "var(--green)", lineHeight: 1 }}
        >
          CODE SENTINEL
        </span>
      </Link>

      {/* Nav links — desktop (Only on landing) */}
      {!isAuthPage && (
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="font-ibm-plex text-sm transition-colors duration-200 hover:underline underline-offset-4"
              style={{
                color: "var(--muted)",
                textDecorationColor: "var(--green)",
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      {/* Conditional Auth Section */}
      <div className="flex items-center gap-4">
        {userEmail && isAuthPage ? (
          /* Dashboard / Analytics View */
          <div className="flex items-center gap-6">
            <Link
              href="/analytics"
              className="flex items-center gap-2 font-press-start text-[0.55rem] text-[var(--green)] hover:opacity-80 transition-opacity"
            >
              📊 DAILY ANALYSIS
            </Link>
            
            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[0.6rem] font-press-start text-[#444]">
                <User size={10} className="text-[var(--green)]" />
                {userEmail.split("@")[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[0.6rem] font-press-start text-[#444] hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={12} />
                LOGOUT
              </button>
            </div>
          </div>
        ) : (
          /* Guest / Landing View */
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 border border-white/10 text-[0.55rem] font-press-start hover:bg-white/5 transition-all"
              style={{ color: "var(--text)" }}
            >
              LOGIN
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[var(--green)] text-black text-[0.55rem] font-press-start hover:opacity-90 transition-all"
            >
              SIGNUP
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
