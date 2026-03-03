"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-button)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-[18px] h-[18px] text-[var(--text-muted)]" strokeWidth={1.5} />
      ) : (
        <Moon className="w-[18px] h-[18px] text-[var(--text-muted)]" fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );
}
