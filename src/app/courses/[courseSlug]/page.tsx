import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CourseOverview } from "@/components/course-overview";
import { getCourseKeys } from "@/lib/courses/course-utils";

// Static slug → courseId for seed courses that don't have their own page files.
// "foundations" has a static page that takes priority and never hits this route.
const SEED_SLUG_MAP: Record<string, string> = {
  "character-modding": "character-modding",
};

interface Props {
  params: Promise<{ courseSlug: string }>;
}

async function resolveCourseId(courseSlug: string): Promise<string | null> {
  // 1. Check seed courses with known slugs
  const seeded = SEED_SLUG_MAP[courseSlug];
  if (seeded) return seeded;

  // 2. Check dynamically added courses via slug map in site_content
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "curriculum_slug_map")
    .maybeSingle();
  if (data?.value) {
    try {
      const slugMap: Record<string, string> = JSON.parse(data.value);
      return slugMap[courseSlug] ?? null;
    } catch { /* invalid JSON */ }
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const courseId = await resolveCourseId(courseSlug);
  if (!courseId) return {};

  const { titleKey, descKey } = getCourseKeys(courseId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", [titleKey, descKey]);
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const title = map[titleKey];
  return {
    ...(title ? { title: `${title} — Smash Modding Academy` } : {}),
    ...(map[descKey] ? { description: map[descKey] } : {}),
  };
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params;
  const courseId = await resolveCourseId(courseSlug);
  if (!courseId) return notFound();

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <CourseOverview courseId={courseId} />
      </main>
      <Footer />
    </>
  );
}
