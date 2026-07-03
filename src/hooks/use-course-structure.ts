"use client";

import { useMemo } from "react";
import { useContentContext } from "@/components/content-provider";
import { FOUNDATIONS_SECTIONS } from "@/lib/courses/foundations-data";

export interface LiveLesson {
  lessonKey: string;
  slug: string;
  titleFallback: string;
  iconFallback: string;
  hasStaticContent: boolean;
}

export interface LiveSection {
  sectionId: string;
  sectionKey: string;
  titleFallback: string;
  lessons: LiveLesson[];
}

function parseJSON<T>(str: string | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; }
  catch { return fallback; }
}

export function useCourseStructure() {
  const { content } = useContentContext();

  return useMemo((): { sections: LiveSection[]; allLessons: LiveLesson[] } => {
    const sectionIds: string[] = parseJSON(
      content["foundations_section_ids"],
      FOUNDATIONS_SECTIONS.map((_, i) => `s${i}`)
    );

    const sections: LiveSection[] = [];
    for (const sId of sectionIds) {
      const sectionKey = `foundations_${sId}`;
      if (content[`${sectionKey}_deleted`] === "1") continue;

      // Map "s0" → FOUNDATIONS_SECTIONS[0], etc.
      const staticIdx = /^s\d+$/.test(sId) ? parseInt(sId.slice(1)) : -1;
      const staticSection = FOUNDATIONS_SECTIONS[staticIdx] ?? null;

      const defaultLessonIds = staticSection?.lessons.map((l) =>
        l.lessonKey.replace("foundations_", "")
      ) ?? [];
      const lessonIds: string[] = parseJSON(
        content[`${sectionKey}_lesson_ids`],
        defaultLessonIds
      );

      const lessons: LiveLesson[] = [];
      for (const lId of lessonIds) {
        const lk = `foundations_${lId}`;
        if (content[`${lk}_deleted`] === "1") continue;

        const staticLesson = staticSection?.lessons.find((l) => l.lessonKey === lk) ?? null;

        lessons.push({
          lessonKey: lk,
          slug: content[`${lk}_slug`] ?? staticLesson?.slug ?? lId,
          titleFallback: staticLesson?.titleFallback ?? "Untitled Lesson",
          iconFallback: staticLesson?.iconFallback ?? "BookOpen",
          hasStaticContent: !!staticLesson?.content,
        });
      }

      sections.push({
        sectionId: sId,
        sectionKey,
        titleFallback: staticSection?.titleFallback ?? "Untitled Section",
        lessons,
      });
    }

    const allLessons = sections.flatMap((s) => s.lessons);
    return { sections, allLessons };
  }, [content]);
}

// Resolve effective lesson status from content + static fallback
export function getEffectiveStatus(
  lessonKey: string,
  hasStaticContent: boolean,
  content: Record<string, string>
): "published" | "soon" | "draft" {
  const stored = content[`${lessonKey}_status`];
  if (stored === "published" || stored === "soon" || stored === "draft") return stored;
  return hasStaticContent ? "published" : "soon";
}

export { parseJSON };
