import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-[var(--border-color)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-extralight text-[var(--text-muted)]">
          Smash Academy
        </span>
        <span className="text-sm text-[var(--text-muted)]">
          Built with ❤️ for the Smash community
        </span>
        <a
          href="https://github.com/Endand/Smash-Academy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="GitHub"
        >
          <Github className="w-5 h-5" strokeWidth={1.5} />
        </a>
      </div>
    </footer>
  );
}
