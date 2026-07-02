"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Editable } from "@/components/editable-text";
import { useContentContext } from "@/components/content-provider";
import { useAuth } from "@/components/auth-provider";
import type { CourseLessonDef } from "@/lib/courses/foundations-data";

// ── Shared admin UI helpers ───────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-5">
      {label}
    </p>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer w-full justify-center transition-colors"
      style={{
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-card)",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--accent-medium)";
        e.currentTarget.style.borderColor = "var(--accent-medium)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
    >
      <Plus size={11} />
      {label}
    </button>
  );
}

function RemoveBtn({ onClick, title = "Remove" }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-strong)",
        color: "var(--text-muted)",
      }}
    >
      <X size={9} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  lesson: CourseLessonDef;
  prev: CourseLessonDef | null;
  next: CourseLessonDef | null;
}

export function LessonContent({ lesson, prev, next }: Props) {
  const { content, updateContent } = useContentContext();
  const { profile } = useAuth();
  const isAdmin = !!profile?.is_admin;

  const d = lesson.content!;
  const lk = lesson.lessonKey;

  // ── Outcomes ─────────────────────────────────────────────────────────────
  const defaultOutcomeCount = d.outcomes.length;
  const outcomeCount =
    parseInt(content[`${lk}_outcome_count`] ?? "", 10) || defaultOutcomeCount;
  const outcomes: { i: number; fallback: string }[] = [];
  for (let i = 0; i < outcomeCount; i++) {
    if (content[`${lk}_outcome_${i}_deleted`] === "1") continue;
    outcomes.push({ i, fallback: d.outcomes[i] ?? "" });
  }
  const addOutcome = () => {
    const idx = outcomeCount;
    updateContent(`${lk}_outcome_count`, String(idx + 1));
    updateContent(`${lk}_outcome_${idx}`, "New learning outcome");
  };
  const deleteOutcome = (idx: number) =>
    updateContent(`${lk}_outcome_${idx}_deleted`, "1");

  // ── Main Sections ─────────────────────────────────────────────────────────
  const defaultSectionCount = d.sections.length;
  const sectionCount =
    parseInt(content[`${lk}_section_count`] ?? "", 10) || defaultSectionCount;
  type SectionEntry = {
    i: number;
    def: (typeof d.sections)[number] | undefined;
    paraCount: number;
  };
  const sections: SectionEntry[] = [];
  for (let i = 0; i < sectionCount; i++) {
    if (content[`${lk}_s${i}_deleted`] === "1") continue;
    const def = d.sections[i];
    const paraCount = def
      ? def.paragraphs.length
      : parseInt(content[`${lk}_s${i}_para_count`] ?? "", 10) || 1;
    sections.push({ i, def, paraCount });
  }
  const addSection = () => {
    const idx = sectionCount;
    updateContent(`${lk}_section_count`, String(idx + 1));
    updateContent(`${lk}_s${idx}_heading`, "New Section");
    updateContent(`${lk}_s${idx}_p0`, "Add your content here.");
    updateContent(`${lk}_s${idx}_para_count`, "1");
  };
  const deleteSection = (idx: number) =>
    updateContent(`${lk}_s${idx}_deleted`, "1");

  // ── Assignment Items ──────────────────────────────────────────────────────
  const defaultAssignCount = d.assignment?.items.length ?? 0;
  const assignCount =
    parseInt(content[`${lk}_assign_count`] ?? "", 10) || defaultAssignCount;
  const assignItems: { i: number; fallback: string }[] = [];
  for (let i = 0; i < assignCount; i++) {
    if (content[`${lk}_assign_${i}_deleted`] === "1") continue;
    assignItems.push({ i, fallback: d.assignment?.items[i] ?? "" });
  }
  const addAssignItem = () => {
    const idx = assignCount;
    updateContent(`${lk}_assign_count`, String(idx + 1));
    updateContent(`${lk}_assign_${idx}`, "Complete this task.");
  };
  const deleteAssignItem = (idx: number) =>
    updateContent(`${lk}_assign_${idx}_deleted`, "1");

  // ── Knowledge Check Items ─────────────────────────────────────────────────
  const defaultKCCount = d.knowledgeCheck.length;
  const kcCount =
    parseInt(content[`${lk}_kc_count`] ?? "", 10) || defaultKCCount;
  type KCEntry = { i: number; defQ: string; defA: string };
  const kcItems: KCEntry[] = [];
  for (let i = 0; i < kcCount; i++) {
    if (content[`${lk}_kc${i}_deleted`] === "1") continue;
    kcItems.push({
      i,
      defQ: d.knowledgeCheck[i]?.question ?? "",
      defA: d.knowledgeCheck[i]?.answer ?? "",
    });
  }
  const addKCItem = () => {
    const idx = kcCount;
    updateContent(`${lk}_kc_count`, String(idx + 1));
    updateContent(`${lk}_kc${idx}_q`, "New question");
    updateContent(`${lk}_kc${idx}_a`, "Answer goes here.");
  };
  const deleteKCItem = (idx: number) =>
    updateContent(`${lk}_kc${idx}_deleted`, "1");

  // ── Resources ─────────────────────────────────────────────────────────────
  const defaultResCount = d.resources?.length ?? 0;
  const resCount =
    parseInt(content[`${lk}_res_count`] ?? "", 10) || defaultResCount;
  type ResEntry = { i: number; defTitle: string; defUrl: string; defDesc: string };
  const resItems: ResEntry[] = [];
  for (let i = 0; i < resCount; i++) {
    if (content[`${lk}_res${i}_deleted`] === "1") continue;
    resItems.push({
      i,
      defTitle: d.resources?.[i]?.title ?? "",
      defUrl: d.resources?.[i]?.url ?? "https://example.com",
      defDesc: d.resources?.[i]?.description ?? "",
    });
  }
  const addResource = () => {
    const idx = resCount;
    updateContent(`${lk}_res_count`, String(idx + 1));
    updateContent(`${lk}_res${idx}_title`, "Resource Title");
    updateContent(`${lk}_res${idx}_url`, "https://example.com");
    updateContent(`${lk}_res${idx}_desc`, "Description of this resource.");
  };
  const deleteResource = (idx: number) =>
    updateContent(`${lk}_res${idx}_deleted`, "1");

  // ── Derived display flags ─────────────────────────────────────────────────
  const showAssignment = isAdmin || assignItems.length > 0;
  const showKC = isAdmin || kcItems.length > 0;
  const showResources = isAdmin || resItems.length > 0;
  const prevWithContent = prev?.content ? prev : null;
  const nextWithContent = next?.content ? next : null;
  const titleValue = content[`${lk}_title`] ?? lesson.titleFallback;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 md:py-14">

      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-10"
        aria-label="Breadcrumb"
      >
        <Link href="/curriculum" className="hover:text-[var(--text)] transition-colors">
          Curriculum
        </Link>
        <span className="opacity-30">/</span>
        <Link href="/courses/foundations" className="hover:text-[var(--text)] transition-colors">
          Foundations
        </Link>
        <span className="opacity-30">/</span>
        <span style={{ color: "var(--text)" }}>{titleValue}</span>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-extralight tracking-wide text-[var(--text)] mb-5 leading-tight">
        <Editable as="span" contentKey={`${lk}_title`} fallback={lesson.titleFallback} />
      </h1>

      {/* Introduction */}
      <Editable
        as="p"
        contentKey={`${lk}_intro`}
        fallback={d.introduction}
        className="leading-relaxed text-[15px] mb-12"
        style={{ color: "var(--text-muted)" }}
      />

      {/* ── Lesson Overview ─────────────────────────────────── */}
      <div
        className="mb-12 px-5 pt-4 pb-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <SectionLabel label="Lesson Overview" />
        <ul className="flex flex-col gap-2.5">
          {outcomes.map(({ i, fallback }) => (
            <li key={i} className="group flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <span className="shrink-0 mt-0.5" style={{ color: "var(--accent-medium)" }}>▸</span>
              <Editable
                as="span"
                contentKey={`${lk}_outcome_${i}`}
                fallback={fallback}
                className="flex-1"
              />
              {isAdmin && <RemoveBtn onClick={() => deleteOutcome(i)} title="Remove outcome" />}
            </li>
          ))}
        </ul>
        {isAdmin && <AddBtn label="Add Outcome" onClick={addOutcome} />}
      </div>

      {/* ── Main Sections ───────────────────────────────────── */}
      <div className="flex flex-col gap-10 mb-14">
        {sections.map(({ i, def, paraCount }) => (
          <section key={i} className="group relative">
            {isAdmin && (
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <RemoveBtn onClick={() => deleteSection(i)} title="Remove section" />
              </div>
            )}
            <h2 className="text-xl font-light text-[var(--text)] mb-4 tracking-tight">
              <Editable
                as="span"
                contentKey={`${lk}_s${i}_heading`}
                fallback={def?.heading ?? "New Section"}
              />
            </h2>
            <div className="flex flex-col gap-4">
              {Array.from({ length: paraCount }, (_, j) => (
                <Editable
                  key={j}
                  as="p"
                  contentKey={`${lk}_s${i}_p${j}`}
                  fallback={def?.paragraphs[j] ?? ""}
                  className="leading-relaxed text-[15px]"
                  style={{ color: "var(--text-muted)" }}
                />
              ))}
            </div>
            {(def?.note || content[`${lk}_s${i}_note`]) && (
              <div
                className="mt-5 px-4 py-3 text-[13px] leading-relaxed"
                style={{
                  borderLeft: "3px solid var(--accent-medium)",
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  borderRadius: "0 var(--radius-card) var(--radius-card) 0",
                }}
              >
                <Editable
                  as="span"
                  contentKey={`${lk}_s${i}_note`}
                  fallback={def?.note ?? ""}
                />
              </div>
            )}
          </section>
        ))}
        {isAdmin && <AddBtn label="Add Section" onClick={addSection} />}
      </div>

      {/* ── Assignment ──────────────────────────────────────── */}
      {showAssignment && (
        <div className="mb-14">
          <SectionLabel label="Assignment" />
          <Editable
            as="p"
            contentKey={`${lk}_assign_desc`}
            fallback={
              d.assignment?.description ?? "Before moving on, complete the following tasks."
            }
            className="text-[14px] leading-relaxed mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <ul className="flex flex-col gap-3">
            {assignItems.map(({ i, fallback }) => (
              <li key={i} className="group flex items-start gap-3 text-[14px]">
                <span
                  className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--accent-medium)" }}
                />
                <Editable
                  as="span"
                  contentKey={`${lk}_assign_${i}`}
                  fallback={fallback}
                  className="flex-1 leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                />
                {isAdmin && <RemoveBtn onClick={() => deleteAssignItem(i)} title="Remove task" />}
              </li>
            ))}
          </ul>
          {isAdmin && <AddBtn label="Add Task" onClick={addAssignItem} />}
        </div>
      )}

      {/* ── Knowledge Check ─────────────────────────────────── */}
      {showKC && (
        <div className="mb-14">
          <SectionLabel label="Knowledge Check" />
          <div className="flex flex-col gap-2">
            {kcItems.map(({ i, defQ, defA }, displayIdx) => (
              <div key={i} className="group relative">
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <RemoveBtn onClick={() => deleteKCItem(i)} title="Remove question" />
                  </div>
                )}
                <details
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                  }}
                >
                  <summary
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none text-[13px] hover:bg-[var(--surface-raised)] transition-colors select-none"
                    style={{ color: "var(--text)" }}
                  >
                    <span
                      className="shrink-0 font-mono text-[9px] opacity-40 w-5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {String(displayIdx + 1).padStart(2, "0")}
                    </span>
                    <Editable
                      as="span"
                      contentKey={`${lk}_kc${i}_q`}
                      fallback={defQ}
                    />
                  </summary>
                  <div
                    className="px-4 py-3.5 text-[13px] leading-relaxed"
                    style={{
                      borderTop: "1px solid var(--border-color)",
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Editable
                      as="span"
                      contentKey={`${lk}_kc${i}_a`}
                      fallback={defA}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
          {isAdmin && <AddBtn label="Add Question" onClick={addKCItem} />}
        </div>
      )}

      {/* ── Additional Resources ────────────────────────────── */}
      {showResources && (
        <div className="mb-14">
          <SectionLabel label="Additional Resources" />
          <ul className="flex flex-col gap-3">
            {resItems.map(({ i, defTitle, defUrl, defDesc }) => {
              const url = content[`${lk}_res${i}_url`] ?? defUrl;
              const isNew = i >= defaultResCount;
              return (
                <li key={i} className="group flex items-start gap-2.5 text-[13px]">
                  <span className="shrink-0 mt-0.5" style={{ color: "var(--accent-medium)" }}>
                    →
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--accent-medium)" }}
                    >
                      <Editable
                        as="span"
                        contentKey={`${lk}_res${i}_title`}
                        fallback={defTitle}
                      />
                    </a>
                    <span style={{ color: "var(--text-muted)" }}> — </span>
                    <Editable
                      as="span"
                      contentKey={`${lk}_res${i}_desc`}
                      fallback={defDesc}
                      style={{ color: "var(--text-muted)" }}
                    />
                    {/* URL field only shown for admin-added resources */}
                    {isAdmin && isNew && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className="font-mono text-[9px] uppercase tracking-widest opacity-40 shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          URL:
                        </span>
                        <Editable
                          as="span"
                          contentKey={`${lk}_res${i}_url`}
                          fallback={defUrl}
                          className="font-mono text-[10px] truncate"
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <RemoveBtn onClick={() => deleteResource(i)} title="Remove resource" />
                  )}
                </li>
              );
            })}
          </ul>
          {isAdmin && <AddBtn label="Add Resource" onClick={addResource} />}
        </div>
      )}

      {/* Prev / Next navigation */}
      <div
        className="flex items-start justify-between gap-4 pt-8"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        {prevWithContent ? (
          <Link
            href={`/courses/foundations/${prevWithContent.slug}`}
            className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ChevronLeft size={15} className="shrink-0" />
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 mb-0.5">
                Previous
              </div>
              <div>{prevWithContent.titleFallback}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextWithContent ? (
          <Link
            href={`/courses/foundations/${nextWithContent.slug}`}
            className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-right"
          >
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 mb-0.5">
                Next
              </div>
              <div>{nextWithContent.titleFallback}</div>
            </div>
            <ChevronRight size={15} className="shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
