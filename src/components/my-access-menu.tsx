"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, GraduationCap, BookOpen, Wrench } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useContentContext } from "@/components/content-provider";
import { buildCourseStructure, getEffectiveStatus, parseJSON } from "@/lib/courses/course-structure";
import { getCourseKeys, getCourseSlug, SEED_COURSE_IDS, PROJECT_ICONS } from "@/lib/courses/course-utils";
import { courseAclKey, lessonAclKey } from "@/hooks/use-permissions";

interface LessonRef {
  lessonKey: string;
  title: string;
  slug: string;
  status: "published" | "soon" | "draft";
  isProject: boolean;
}
interface CourseGroup {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  hasCourseGrant: boolean; // whole-course access (professors)
  lessons: LessonRef[];
}

// Pure: which courses/lessons `username` has edit access to, grouped by course.
// A whole-course grant lists every lesson; otherwise only per-lesson grants.
export function computeAccessGroups(username: string | undefined, content: Record<string, string>): CourseGroup[] {
  if (!username) return [];
  const courseIds = Array.from(new Set([
    ...parseJSON<string[]>(content["curriculum_course_ids"], SEED_COURSE_IDS),
    ...SEED_COURSE_IDS,
  ])).filter((id) => content[`course_${id}_deleted`] !== "1");

  const out: CourseGroup[] = [];
  for (const courseId of courseIds) {
    const courseTitle = content[getCourseKeys(courseId).titleKey] ?? "Course";
    const courseSlug = getCourseSlug(courseId, content);
    const courseAcl = parseJSON<string[]>(content[courseAclKey(courseId)], []);
    const hasCourseGrant = courseAcl.includes(username);
    const { allLessons } = buildCourseStructure(courseId, content);

    const toRef = (l: (typeof allLessons)[number]): LessonRef => ({
      lessonKey: l.lessonKey,
      title: content[`${l.lessonKey}_title`] ?? l.titleFallback,
      slug: l.slug,
      status: getEffectiveStatus(l.lessonKey, l.hasStaticContent, content),
      isProject: PROJECT_ICONS.has(content[`${l.lessonKey}_icon`] ?? l.iconFallback),
    });

    const lessons = hasCourseGrant
      ? allLessons.map(toRef)
      : allLessons
          .filter((l) => parseJSON<string[]>(content[lessonAclKey(l.lessonKey)], []).includes(username))
          .map(toRef);

    if (hasCourseGrant || lessons.length > 0) {
      out.push({ courseId, courseTitle, courseSlug, hasCourseGrant, lessons });
    }
  }
  return out;
}

// The role badge in the nav opens this menu: which courses (professors) and
// lessons a role-holder has been granted edit access to, grouped by course.
export function MyAccessMenu() {
  const { profile } = useAuth();
  const { content } = useContentContext();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const username = profile?.username;

  const groups = useMemo<CourseGroup[]>(() => computeAccessGroups(username, content), [username, content]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Only non-admin role-holders get this menu
  if (!profile?.role || profile.is_admin) return null;

  const totalLessons = groups.reduce((n, g) => n + g.lessons.length, 0);

  return (
    <div ref={wrapRef} className="relative hidden sm:inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Your edit access"
        className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-[var(--radius-tag)] cursor-pointer transition-opacity hover:opacity-80"
        style={{ color: "var(--accent-medium)", border: "1px solid var(--accent-medium)" }}
      >
        {profile.role}
        <ChevronDown size={9} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-72 max-h-[70vh] overflow-y-auto overflow-x-hidden"
          style={{ background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-card)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Your Edit Access
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              {groups.length} course{groups.length === 1 ? "" : "s"} · {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
            </p>
          </div>

          {groups.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] italic" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
              No lessons assigned to you yet.
            </p>
          ) : (
            <div className="py-1">
              {groups.map((g) => (
                <div key={g.courseId} className="py-1.5">
                  {/* Course header — a link only when the whole course is granted (professors) */}
                  <div className="px-4 py-1 flex items-center gap-2">
                    <GraduationCap size={12} className="shrink-0" style={{ color: "var(--accent-medium)" }} />
                    {g.hasCourseGrant ? (
                      <Link
                        href={`/courses/${g.courseSlug}`}
                        onClick={() => setOpen(false)}
                        className="font-mono text-[10px] uppercase tracking-widest hover:underline truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {g.courseTitle}
                      </Link>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-widest truncate" style={{ color: "var(--text-muted)" }}>
                        {g.courseTitle}
                      </span>
                    )}
                    {g.hasCourseGrant && (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 rounded shrink-0" style={{ color: "var(--accent-medium)", border: "1px solid var(--accent-medium)" }}>
                        Full
                      </span>
                    )}
                  </div>

                  {g.lessons.length === 0 ? (
                    <p className="px-4 pl-9 py-1 text-[11px] italic" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
                      No lessons yet.
                    </p>
                  ) : (
                    g.lessons.map((l) => (
                      <Link
                        key={l.lessonKey}
                        href={`/courses/${g.courseSlug}/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 pl-9 pr-4 py-1.5 text-[12px] transition-colors hover:bg-[var(--surface-raised)]"
                        style={{ color: "var(--text)" }}
                      >
                        {l.isProject
                          ? <Wrench size={11} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--accent-medium)" }} />
                          : <BookOpen size={11} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--text-muted)" }} />}
                        <span className="flex-1 truncate">{l.title}</span>
                        {l.status !== "published" && (
                          <span className="font-mono text-[8px] uppercase tracking-widest shrink-0" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                            {l.status}
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
