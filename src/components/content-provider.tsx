"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient, withTimeout } from "@/lib/supabase/client";

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
    setContent((prev) => ({ ...prev, [key]: value }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await withTimeout(
        supabase.from("site_content").upsert(
          { key, value, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
          { onConflict: "key" }
        )
      );
    } catch (err) {
      console.error("[content] save failed:", err);
    }
  }, []);

  return (
    <ContentContext.Provider value={{ content, updateContent }}>
      {children}
    </ContentContext.Provider>
  );
}
