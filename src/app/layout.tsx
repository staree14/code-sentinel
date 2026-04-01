import type { Metadata } from "next";
import localFont from "next/font/local";
import { Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeSentinel — AI Security Code Review on AWS Bedrock",
  description:
    "Detect vulnerabilities 73% faster with intelligent multi-model routing across Claude Haiku, Sonnet & Opus. Powered by AWS Bedrock.",
  icons: {
    icon: "/detective.svg",
    shortcut: "/detective.svg",
    apple: "/detective.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${pressStart.variable} ${ibmPlexMono.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        {/* Global dot grid background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#30363d 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            opacity: 0.35,
            zIndex: 0,
          }}
        />
        {/* Global noise texture */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
            zIndex: 0,
          }}
        />
        {/* Content layer */}
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
