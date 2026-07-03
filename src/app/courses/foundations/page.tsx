import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CourseOverview } from "@/components/course-overview";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", ["foundations_title", "foundations_description"]);
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const title = map["foundations_title"] ?? "Foundations";
  return {
    title: `${title} — Smash Modding Academy`,
    ...(map["foundations_description"] ? { description: map["foundations_description"] } : {}),
  };
}

export default function FoundationsPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <CourseOverview courseId="foundations" />
      </main>
      <Footer />
    </>
  );
}
