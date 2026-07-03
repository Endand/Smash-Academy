"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient, withTimeout } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

interface ProgressContextValue {
  completed: Set<string>;
  signedIn: boolean;
  toggleComplete: (lessonKey: string) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue>({
  completed: new Set(),
  signedIn: false,
  toggleComplete: async () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCompleted(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await withTimeout(
          supabase.from("lesson_progress").select("lesson_key").eq("user_id", userId)
        );
        if (!cancelled && !error && data) {
          setCompleted(new Set(data.map((r: { lesson_key: string }) => r.lesson_key)));
        }
      } catch {
        // table may not exist yet — progress simply stays empty
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const toggleComplete = useCallback(async (lessonKey: string) => {
    if (!userId) return;
    const supabase = createClient();
    let wasComplete = false;
    setCompleted((prev) => {
      wasComplete = prev.has(lessonKey);
      const next = new Set(prev);
      if (wasComplete) next.delete(lessonKey);
      else next.add(lessonKey);
      return next;
    });
    try {
      if (wasComplete) {
        await withTimeout(
          supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_key", lessonKey)
        );
      } else {
        await withTimeout(
          supabase.from("lesson_progress").insert({ user_id: userId, lesson_key: lessonKey })
        );
      }
    } catch (err) {
      console.error("[progress] save failed:", err);
    }
  }, [userId]);

  return (
    <ProgressContext.Provider value={{ completed, signedIn: !!userId, toggleComplete }}>
      {children}
    </ProgressContext.Provider>
  );
}
