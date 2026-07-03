"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, BookOpen, GraduationCap } from "lucide-react";
import { useContentContext } from "@/components/content-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { buildCourseStructure, getEffectiveStatus, parseJSON } from "@/hooks/use-course-structure";
import {
  getCourseKeys,
  getCourseSlug,
  getCourseStatus,
  SEED_COURSE_IDS,
} from "@/lib/courses/course-utils";

interface Result {
  type: "course" | "lesson";
  title: string;
  context?: string;
  href: string;
}

const SEED_TITLE_FALLBACKS: Record<string, string> = {
  foundations: "Foundations",
  "character-modding": "Character Modding",
};

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Search lessons (Ctrl+K)"
        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <Search size={15} strokeWidth={1.5} />
      </button>
      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { content } = useContentContext();
  const { can } = usePermissions();
  const canPublish = can("manage_lessons");
  const [q, setQ] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Searchable index of visible courses and lessons
  const index = useMemo((): Result[] => {
    const courseIds = parseJSON<string[]>(content["curriculum_course_ids"], SEED_COURSE_IDS)
      .filter((id) => content[`course_${id}_deleted`] !== "1");

    const out: Result[] = [];
    for (const courseId of courseIds) {
      const status = getCourseStatus(courseId, content);
      if (status !== "available" && !canPublish) continue;

      const { titleKey } = getCourseKeys(courseId);
      const courseTitle = content[titleKey] ?? SEED_TITLE_FALLBACKS[courseId] ?? "Course";
      const slug = getCourseSlug(courseId, content);
      out.push({ type: "course", title: courseTitle, href: `/courses/${slug}` });

      const { allLessons } = buildCourseStructure(courseId, content);
      for (const l of allLessons) {
        const ls = getEffectiveStatus(l.lessonKey, l.hasStaticContent, content);
        if (ls !== "published" && !canPublish) continue;
        out.push({
          type: "lesson",
          title: content[`${l.lessonKey}_title`] ?? l.titleFallback,
          context: courseTitle,
          href: `/courses/${slug}/${l.slug}`,
        });
      }
    }
    return out;
  }, [content, canPublish]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return index.filter((r) => r.title.toLowerCase().includes(needle)).slice(0, 15);
  }, [q, index]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-card)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: results.length ? "1px solid var(--border-color)" : "none" }}>
          <Search size={15} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} className="shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses and lessons…"
            className="flex-1 py-3.5 bg-transparent outline-none text-sm"
            style={{ color: "var(--text)" }}
          />
          <kbd className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0" style={{ border: "1px solid var(--border-strong)", color: "var(--text-muted)", opacity: 0.6 }}>
            Esc
          </kbd>
        </div>
        {results.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto py-1">
            {results.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-raised)]"
                style={{ color: "var(--text)" }}
              >
                {r.type === "course"
                  ? <GraduationCap size={14} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--accent-medium)" }} />
                  : <BookOpen size={13} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--text-muted)" }} />}
                <span className="flex-1 truncate">{r.title}</span>
                {r.context && (
                  <span className="font-mono text-[9px] uppercase tracking-widest shrink-0" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                    {r.context}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
        {q.trim() && results.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            No results for “{q.trim()}”
          </p>
        )}
      </div>
    </div>
  );
}
