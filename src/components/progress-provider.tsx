"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
  // Mirror of `completed` read synchronously in toggleComplete — reading a value
  // set inside a setState updater is unreliable (React may run it after the DB
  // call), which made un-completing a lesson fire an INSERT instead of a DELETE.
  const completedRef = useRef<Set<string>>(new Set());
  const setBoth = useCallback((next: Set<string>) => { completedRef.current = next; setCompleted(next); }, []);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setBoth(new Set());
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
          setBoth(new Set(data.map((r: { lesson_key: string }) => r.lesson_key)));
        }
      } catch {
        // table may not exist yet — progress simply stays empty
      }
    })();
    return () => { cancelled = true; };
  }, [userId, setBoth]);

  const toggleComplete = useCallback(async (lessonKey: string) => {
    if (!userId) return;
    const supabase = createClient();
    const wasComplete = completedRef.current.has(lessonKey);
    const next = new Set(completedRef.current);
    if (wasComplete) next.delete(lessonKey);
    else next.add(lessonKey);
    setBoth(next);
    try {
      if (wasComplete) {
        await withTimeout(
          supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_key", lessonKey)
        );
      } else {
        await withTimeout(
          supabase.from("lesson_progress").upsert(
            { user_id: userId, lesson_key: lessonKey },
            { onConflict: "user_id,lesson_key" }
          )
        );
      }
    } catch (err) {
      console.error("[progress] save failed:", err);
    }
  }, [userId, setBoth]);

  return (
    <ProgressContext.Provider value={{ completed, signedIn: !!userId, toggleComplete }}>
      {children}
    </ProgressContext.Provider>
  );
}
