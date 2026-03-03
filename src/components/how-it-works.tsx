"use client";

import { BookOpen, Hammer, Users } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const steps = [
  {
    icon: BookOpen,
    title: "Learn",
    description:
      "Follow a structured path through curated tutorials, video guides, and documentation — from file systems to fighter movesets.",
  },
  {
    icon: Hammer,
    title: "Build",
    description:
      "Create real mods at every step. Texture swaps, custom stages, character edits — build your portfolio as you learn.",
  },
  {
    icon: Users,
    title: "Connect",
    description:
      "Join a community of modders. Get help, share your work, and collaborate on projects.",
  },
];

export function HowItWorks() {
  const { theme } = useTheme();
  const filled = theme === "light";

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            How It Works
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col gap-4">
                <Icon
                  className="w-6 h-6 text-[var(--accent-medium)]"
                  strokeWidth={filled ? 0 : 1.5}
                  fill={filled ? "currentColor" : "none"}
                />
                <h3 className="text-xl font-light text-[var(--text)]">
                  {step.title}
                </h3>
                <p className="text-[var(--text-muted)] leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
