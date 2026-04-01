"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "How It Works", href: "/architecture#how-it-works" },
  { label: "Architecture", href: "/architecture" },
  { label: "Features", href: "/#features" },
];

export function Nav() {
  const pathname = usePathname();

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

      {/* Nav links — desktop */}
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
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.color = "var(--text)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.color = "var(--muted)")
            }
          >
            {label}
          </a>
        ))}
      </nav>

      {/* CTA */}
      <div className="flex gap-3">
        <Link
          href="/scanner"
          className="btn-secondary-pixel"
          style={{ fontSize: "0.55rem", borderColor: "var(--pixel-purple)", color: "var(--pixel-purple)" }}
        >
          {pathname === "/scanner" ? "← BACK" : "AGENT TERMINAL"}
        </Link>
        <Link
          href="/demo"
          className="btn-primary-pixel"
          style={{ fontSize: "0.55rem" }}
        >
          {pathname === "/demo" ? "← BACK" : "LIVE DEMO UI"}
        </Link>
      </div>
    </header>
  );
}
