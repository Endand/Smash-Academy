"use client";

import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { CurriculumPreview } from "@/components/curriculum-preview";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-14">
        <Hero />
        <HowItWorks />
        <CurriculumPreview />
      </main>
      <Footer />
    </>
  );
}
