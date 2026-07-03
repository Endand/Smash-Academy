"use client";

import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ArrowRight } from "lucide-react";
import { Editable } from "@/components/editable-text";
import { useContentContext } from "@/components/content-provider";
import { COURSE_TITLE_KEY, COURSE_LEVEL_KEY } from "@/lib/courses/foundations-data";

const LEVEL_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

const COURSES = [
  {
    titleKey: COURSE_TITLE_KEY,
    titleFallback: "Foundations",
    levelKey: COURSE_LEVEL_KEY,
    levelFallback: "Beginner",
    slug: "foundations",
    descKey: "foundations_description",
    descFallback: "Tools setup, file structure, skin modding, and publishing your first mod.",
    stats: "17 lessons · 2 projects",
    available: true,
  },
  {
    titleKey: "curriculum_course_1_title",
    titleFallback: "Character Modding",
    levelKey: "curriculum_course_1_level",
    levelFallback: "Intermediate",
    slug: "character-modding",
    descKey: "curriculum_course_1_desc",
    descFallback: "Hitboxes, movesets, animations, and building custom fighters from scratch.",
    stats: "Coming soon",
    available: false,
  },
];

export default function CurriculumPage() {
  const { content } = useContentContext();

  // Sort by effective difficulty level
  const sorted = [...COURSES].sort((a, b) => {
    const la = LEVEL_ORDER[content[a.levelKey] ?? a.levelFallback] ?? 99;
    const lb = LEVEL_ORDER[content[b.levelKey] ?? b.levelFallback] ?? 99;
    return la - lb;
  });

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="mb-12">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-3">Paths</p>
            <h1 className="text-4xl font-extralight tracking-wide text-[var(--text)] mb-4">Curriculum</h1>
            <Editable
              contentKey="curriculum_subtitle"
              fallback="A structured path through Smash Ultimate modding — from your first texture swap to publishing finished mods."
              as="p"
              className="text-[var(--text-muted)] leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-3">
            {sorted.map((course) => {
              const levelValue = content[course.levelKey] ?? course.levelFallback;
              const isAvailable = course.available;
              const inner = (
                <div
                  className={`p-6 flex items-start justify-between gap-4 transition-colors ${isAvailable ? "group-hover:border-[var(--accent-medium)]" : "opacity-50"}`}
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-card)" }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Editable
                        contentKey={course.titleKey}
                        fallback={course.titleFallback}
                        as="h2"
                        className="text-lg font-extralight text-[var(--text)]"
                      />
                      <span
                        className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-[var(--radius-tag)]"
                        style={
                          isAvailable
                            ? { color: "var(--accent-medium)", border: "1px solid var(--accent-medium)" }
                            : { color: "var(--text-muted)", border: "1px solid var(--border-color)" }
                        }
                      >
                        {levelValue}
                      </span>
                    </div>
                    <Editable
                      contentKey={course.descKey}
                      fallback={course.descFallback}
                      as="p"
                      className="text-sm text-[var(--text-muted)]"
                    />
                    <p className="font-mono text-[10px] mt-3" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                      {course.stats}
                    </p>
                  </div>
                  {isAvailable && (
                    <ArrowRight size={16} strokeWidth={1.5} className="mt-1 flex-shrink-0 transition-opacity opacity-30 group-hover:opacity-70" style={{ color: "var(--text)" }} />
                  )}
                </div>
              );

              return isAvailable ? (
                <Link key={course.titleKey} href={`/courses/${course.slug}`} className="block group">
                  {inner}
                </Link>
              ) : (
                <div key={course.titleKey}>{inner}</div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
