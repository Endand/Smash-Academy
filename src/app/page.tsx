"use client";

import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { CurriculumPreview } from "@/components/curriculum-preview";
import { Footer } from "@/components/footer";
import { UsernameSetup } from "@/components/username-setup";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const needsUsername = !loading && user && !profile;

  return (
    <>
      <Nav />
      <main className="pt-14">
        {needsUsername ? (
          <UsernameSetup />
        ) : (
          <>
            <Hero />
            <HowItWorks />
            <CurriculumPreview />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
