"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Editable } from "@/components/editable-text";
import { EditableIcon } from "@/components/editable-icon";
import { useContentContext } from "@/components/content-provider";
import { FOUNDATIONS_SECTIONS } from "@/lib/courses/foundations-data";
import type { CourseLessonDef } from "@/lib/courses/foundations-data";

const PROJECT_ICONS = new Set(["Wrench", "Hammer", "Package", "Target", "Trophy"]);

function LessonRow({ lesson, isLast }: { lesson: CourseLessonDef; isLast: boolean }) {
  const { content } = useContentContext();
  const iconName = content[`${lesson.lessonKey}_icon`] ?? lesson.iconFallback;
  const isProject = PROJECT_ICONS.has(iconName);
  const hasContent = !!lesson.content;

  const inner = (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors ${hasContent ? "hover:bg-[var(--surface-raised)] cursor-pointer" : "cursor-default"}`}
      style={{ borderBottom: !isLast ? "1px solid var(--border-color)" : "none" }}
    >
      <span
        style={{
          color: isProject ? "var(--accent-medium)" : "var(--text-muted)",
          opacity: isProject ? 1 : 0.6,
          flexShrink: 0,
        }}
      >
        <EditableIcon
          contentKey={`${lesson.lessonKey}_icon`}
          fallback={lesson.iconFallback}
          size={15}
          strokeWidth={1.5}
        />
      </span>
      <Editable
        as="span"
        contentKey={`${lesson.lessonKey}_title`}
        fallback={lesson.titleFallback}
        className="flex-1 text-sm text-[var(--text)]"
      />
      {isProject && (
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-[var(--radius-tag)] hidden sm:inline"
          style={{ color: "var(--accent-medium)", border: "1px solid var(--accent-medium)" }}
        >
          Project
        </span>
      )}
      {hasContent ? (
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--accent-medium)" }}
        >
          Start →
        </span>
      ) : (
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--text-muted)", opacity: 0.4 }}
        >
          Soon
        </span>
      )}
    </div>
  );

  return hasContent ? (
    <Link href={`/courses/foundations/${lesson.slug}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function FoundationsPage() {
  const { content } = useContentContext();

  const [lessonCount, projectCount] = useMemo(() => {
    let l = 0;
    let p = 0;
    for (const section of FOUNDATIONS_SECTIONS) {
      for (const lesson of section.lessons) {
        const iconName = content[`${lesson.lessonKey}_icon`] ?? lesson.iconFallback;
        if (PROJECT_ICONS.has(iconName)) p++;
        else l++;
      }
    }
    return [l, p];
  }, [content]);

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Course header */}
          <div className="mb-14">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Course
            </p>
            <div className="flex items-center gap-3 mb-5">
              <Editable
                contentKey="foundations_title"
                fallback="Foundations"
                as="h1"
                className="text-4xl font-extralight tracking-wide text-[var(--text)]"
              />
              <span
                className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-[var(--radius-tag)]"
                style={{ color: "var(--accent-medium)", border: "1px solid var(--accent-medium)" }}
              >
                Beginner
              </span>
            </div>
            <Editable
              contentKey="foundations_description"
              fallback="This is where it all begins. You'll set up your modding environment, learn how Smash Ultimate stores its files, create your first skin mod, and publish it for the community. No prior experience required."
              as="p"
              className="text-[var(--text-muted)] leading-relaxed"
            />
            <div
              className="mt-5 font-mono text-[11px] flex items-center gap-3"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{lessonCount} lessons</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{projectCount} projects</span>
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-10">
            {FOUNDATIONS_SECTIONS.map((section) => (
              <div key={section.sectionKey}>
                <div className="flex items-center gap-4 mb-3">
                  <Editable
                    as="span"
                    contentKey={`${section.sectionKey}_title`}
                    fallback={section.titleFallback}
                    className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap"
                  />
                  <div className="h-px flex-1 bg-[var(--border-color)]" />
                </div>
                <div
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                  }}
                >
                  {section.lessons.map((lesson, i) => (
                    <LessonRow
                      key={lesson.lessonKey}
                      lesson={lesson}
                      isLast={i === section.lessons.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
