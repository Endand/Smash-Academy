import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaticLessonKey, getStaticLesson } from "@/lib/courses/foundations-data";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { LessonContent } from "@/components/lesson-content";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface Props {
  params: Promise<{ slug: string }>;
}

async function resolveLessonKey(slug: string): Promise<string | null> {
  // Static lesson lookup (fast, in-memory)
  const staticKey = getStaticLessonKey(slug);
  if (staticKey) return staticKey;

  // Dynamic lesson lookup (Supabase — only when static lookup misses)
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "foundations_slug_map")
    .maybeSingle();
  if (data?.value) {
    try {
      const slugMap: Record<string, string> = JSON.parse(data.value);
      const mapped = slugMap[slug];
      if (mapped) return mapped;
    } catch { /* invalid JSON */ }
  }

  // Last resort: reverse-lookup a lesson whose own `<lk>_slug` key matches
  const { data: rows } = await supabase
    .from("site_content")
    .select("key")
    .like("key", "foundations\\_%\\_slug")
    .eq("value", slug)
    .limit(1);
  if (rows?.[0]) return rows[0].key.replace(/_slug$/, "");

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lessonKey = await resolveLessonKey(slug);
  if (!lessonKey) return {};

  const staticLesson = getStaticLesson(lessonKey);
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", [`${lessonKey}_title`, `${lessonKey}_intro`]);
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const title = map[`${lessonKey}_title`] ?? staticLesson?.titleFallback;
  const rawDesc = map[`${lessonKey}_intro`] ?? staticLesson?.content?.introduction ?? "";
  const description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
  return {
    ...(title ? { title: `${title} — Smash Modding Academy` } : {}),
    ...(description ? { description } : {}),
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lessonKey = await resolveLessonKey(slug);
  if (!lessonKey) return notFound();

  return (
    <>
      <Nav />
      <div className="pt-14 min-h-screen flex flex-col md:flex-row">
        <LessonSidebar currentSlug={slug} courseId="foundations" />
        <main className="flex-1 min-w-0">
          <LessonContent lessonKey={lessonKey} slug={slug} courseId="foundations" />
        </main>
      </div>
      <Footer />
    </>
  );
}
