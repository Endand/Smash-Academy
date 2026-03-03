"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

export function Nav() {
  const { theme } = useTheme();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]"
      style={{
        borderBottom: theme === "dark" ? "1px solid var(--border-color)" : "none",
        boxShadow: theme === "light" ? "0 1px 3px rgba(45,41,38,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-extralight tracking-wide text-[var(--text)]">
            Smash Academy
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/curriculum"
              className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Curriculum
            </Link>
            <Link
              href="/about"
              className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              About
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="font-mono text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-[var(--radius-button)] border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors cursor-pointer">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
