"use client";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function CurriculumPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 min-h-[80vh] flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-extralight text-[var(--text)] mb-4">
            Curriculum
          </h1>
          <p className="text-[var(--text-muted)]">
            Full curriculum coming soon. Stay tuned.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
