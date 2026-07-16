"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient, withTimeout } from "@/lib/supabase/client";
import { computeSlugSync } from "@/lib/courses/slug-sync";

type ContentMap = Record<string, string>;

interface ContentContextValue {
  content: ContentMap;
  updateContent: (key: string, value: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextValue>({
  content: {},
  updateContent: async () => {},
});

export function useContentContext(): ContentContextValue {
  return useContext(ContentContext);
}

interface ContentProviderProps {
  children: React.ReactNode;
  initialContent: Record<string, string>;
}

export function ContentProvider({ children, initialContent }: ContentProviderProps) {
  // Initialised from server-fetched data — no loading flash or fallback flicker.
  const [content, setContent] = useState<ContentMap>(initialContent);
  // Surfaced to the user when a write fails, so silent data loss can't happen
  // unnoticed (the UI shows the optimistic edit even if the save didn't land).
  const [saveFailed, setSaveFailed] = useState(false);

  // Fresh snapshot for updateContent (stable callback) — used by slug sync
  const contentRef = useRef<ContentMap>(initialContent);
  useEffect(() => { contentRef.current = content; }, [content]);

  useEffect(() => {
    const supabase = createClient();

    // No initial client-side load needed — data came from the server.
    // Subscribe to real-time so admin edits propagate instantly to all clients.
    const channel = supabase
      .channel("site_content_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const { key, value } = payload.new as { key: string; value: string };
            setContent((prev) => ({ ...prev, [key]: value }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateContent = useCallback(async (key: string, value: string) => {
    const supabase = createClient();

    // Title edits also sync the matching course/lesson URL slug
    const writes: [string, string][] = [
      [key, value],
      ...computeSlugSync(key, value, contentRef.current),
    ];

    setContent((prev) => {
      const next = { ...prev };
      for (const [k, v] of writes) next[k] = v;
      return next;
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const { error } = await withTimeout(
        supabase.from("site_content").upsert(
          writes.map(([k, v]) => ({ key: k, value: v, updated_at: now, updated_by: user?.id ?? null })),
          { onConflict: "key" }
        )
      );
      if (error) throw error;
      setSaveFailed(false);
    } catch (err) {
      console.error("[content] save failed:", err);
      setSaveFailed(true);
    }
  }, []);

  return (
    <ContentContext.Provider value={{ content, updateContent }}>
      {children}
      {saveFailed && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-card)] shadow-lg"
          style={{ background: "#ed4245", color: "#fff", maxWidth: "90vw" }}
          role="alert"
        >
          <span className="text-[13px]">A change couldn&apos;t be saved — check your connection, then re-edit to retry.</span>
          <button
            onClick={() => setSaveFailed(false)}
            className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded cursor-pointer"
            style={{ border: "1px solid rgba(255,255,255,0.5)" }}
          >
            Dismiss
          </button>
        </div>
      )}
    </ContentContext.Provider>
  );
}
