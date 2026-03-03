"use client";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 min-h-[80vh] flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-extralight text-[var(--text)] mb-4">
            About
          </h1>
          <p className="text-[var(--text-muted)]">
            Smash Academy is a free, open-source learning platform for the Smash modding community.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
